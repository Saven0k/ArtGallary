import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { Client } from 'pg';

export function migrationBody(sql: string): string {
  // Inspect statement starts, ignoring SQL strings, comments and PL/pgSQL dollar bodies.
  const masked = sql.replace(
    /--[^\r\n]*|\/\*[\s\S]*?\*\/|[eE]'(?:\\[\s\S]|''|[^'])*'|'(?:''|[^'])*'|"(?:""|[^"])*"|(\$(?:[A-Za-z_][A-Za-z_0-9]*)?\$)[\s\S]*?\1/g,
    (match) => ' '.repeat(match.length),
  );
  const statements: { text: string; start: number; end: number }[] = [];
  let start = 0;
  for (let end = 0; end <= masked.length; end++) {
    if (end !== masked.length && masked[end] !== ';') continue;
    const text = masked.slice(start, end).trim();
    if (text) statements.push({ text, start, end: end + 1 });
    start = end + 1;
  }
  let body = sql;
  if (
    /^BEGIN(?:\s+(?:WORK|TRANSACTION))?$/i.test(statements[0]?.text ?? '') &&
    /^COMMIT(?:\s+(?:WORK|TRANSACTION))?$/i.test(
      statements[statements.length - 1]?.text ?? '',
    )
  ) {
    const first = statements.shift()!;
    const last = statements.pop()!;
    body = sql.slice(first.end, last.start);
  }
  if (
    statements.some(({ text }) =>
      /^(BEGIN|COMMIT|END|ROLLBACK|ABORT|SAVEPOINT|RELEASE|START\s+TRANSACTION|PREPARE\s+TRANSACTION)\b/i.test(
        text,
      ),
    )
  )
    throw new Error('Migration transactions are managed by bootstrap');
  if (!body.trim()) throw new Error('Empty migration');
  return body.trim();
}

export async function applyMigrations(
  client: Pick<Client, 'query'>,
  directory: string,
) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS _schema_migrations (
      name TEXT PRIMARY KEY,
      checksum CHAR(64) NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  const files = (await readdir(directory))
    .filter((name) => name.endsWith('.sql'))
    .sort();
  const applied = await client.query<{ name: string; checksum: string }>(
    'SELECT name, checksum FROM _schema_migrations ORDER BY name',
  );
  for (const row of applied.rows) {
    if (!files.includes(row.name))
      throw new Error('Applied migration missing: ' + row.name);
  }
  // Validate the entire history before applying any pending migration.
  const pending: { name: string; checksum: string; sql: string }[] = [];
  for (const name of files) {
    if (!/^\d{8}-[a-z0-9-]+\.sql$/.test(name))
      throw new Error('Invalid migration name: ' + name);
    const source = (await readFile(join(directory, name), 'utf8')).replace(
      /\r\n/g,
      '\n',
    );
    const checksum = createHash('sha256').update(source).digest('hex');
    const previous = applied.rows.find((row) => row.name === name);
    if (previous && previous.checksum !== checksum)
      throw new Error('Applied migration changed: ' + name);
    if (!previous) {
      const latest = applied.rows[applied.rows.length - 1]?.name;
      if (latest && name < latest)
        throw new Error('New migrations must append to history: ' + name);
      pending.push({ name, checksum, sql: migrationBody(source) });
    }
  }
  for (const migration of pending) {
    await client.query('BEGIN');
    try {
      await client.query(migration.sql);
      await client.query(
        'INSERT INTO _schema_migrations(name, checksum) VALUES($1, $2)',
        [migration.name, migration.checksum],
      );
      await client.query('COMMIT');
      console.log('Migration applied: ' + migration.name);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  }
}
