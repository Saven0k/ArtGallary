import { mkdtemp, rm, writeFile, readdir, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { applyMigrations, migrationBody } from './migrations';

describe('production migrations', () => {
  let directory: string;
  beforeEach(async () => {
    directory = await mkdtemp(join(tmpdir(), 'gallery-migrations-'));
  });
  afterEach(async () => {
    await rm(directory, { recursive: true, force: true });
  });

  it('unwraps the existing SQL transaction and rejects nested transaction commands', () => {
    expect(migrationBody('BEGIN;\nSELECT 1;\nCOMMIT;')).toBe('SELECT 1;');
    expect(() => migrationBody('SELECT 1;\nCOMMIT;')).toThrow('transactions');
  });

  it('accepts every actual deployment migration', async () => {
    const migrations = resolve(__dirname, '../../../deploy/sql');
    const files = (await readdir(migrations)).filter((name) =>
      name.endsWith('.sql'),
    );
    expect(files.length).toBeGreaterThanOrEqual(2);
    for (const file of files) {
      expect(
        migrationBody(await readFile(join(migrations, file), 'utf8')),
      ).not.toBe('');
    }
  });

  it('unwraps an outer transaction with leading and trailing comments', () => {
    expect(
      migrationBody('-- migration\nBEGIN;\nSELECT 1;\nCOMMIT;\n-- done'),
    ).toBe('SELECT 1;');
  });

  it('preserves BEGIN inside dollar bodies and ignores quoted transaction text', () => {
    const sql =
      "DO $migration$ BEGIN RAISE NOTICE 'COMMIT;'; END $migration$;\nSELECT 'BEGIN;', \"COMMIT\" FROM example;";
    expect(migrationBody(sql)).toBe(sql);
  });

  it('rejects an edited applied migration before executing SQL', async () => {
    await writeFile(join(directory, '20261008-example.sql'), 'SELECT 2;\n');
    const client = {
      query: jest
        .fn()
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({
          rows: [{ name: '20261008-example.sql', checksum: 'old-checksum' }],
        }),
    };
    await expect(applyMigrations(client as any, directory)).rejects.toThrow(
      'Applied migration changed',
    );
    expect(client.query).toHaveBeenCalledTimes(2);
  });

  it('skips an unchanged migration', async () => {
    const sql = 'SELECT 1;\n';
    await writeFile(join(directory, '20261008-example.sql'), sql);
    const client = {
      query: jest
        .fn()
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({
          rows: [
            {
              name: '20261008-example.sql',
              checksum: createHash('sha256').update(sql).digest('hex'),
            },
          ],
        }),
    };
    await applyMigrations(client as any, directory);
    expect(client.query).toHaveBeenCalledTimes(2);
  });

  it('rolls back failed SQL without recording success', async () => {
    await writeFile(join(directory, '20261008-example.sql'), 'BROKEN SQL;');
    const client = {
      query: jest.fn(async (sql: string) => {
        if (sql === 'BROKEN SQL;') throw new Error('bad migration');
        return { rows: [] };
      }),
    };
    await expect(applyMigrations(client as any, directory)).rejects.toThrow(
      'bad migration',
    );
    expect(client.query.mock.calls.map((call) => call[0])).toContain(
      'ROLLBACK',
    );
    expect(
      client.query.mock.calls
        .map((call) => call[0])
        .some((sql) => sql.startsWith('INSERT')),
    ).toBe(false);
  });
});
