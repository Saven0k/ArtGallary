import '../load-env';
import 'reflect-metadata';
import { Client } from 'pg';
import { Sequelize } from 'sequelize-typescript';
import { GALLERY_MODELS } from './models';
import { applyMigrations } from './migrations';

async function bootstrap() {
  for (const name of [
    'POSTGRES_HOST',
    'POSTGRES_USER',
    'POSTGRES_PASSWORD',
    'POSTGRES_DB',
    'ADMIN_PASSWORD',
  ])
    if (!process.env[name]) throw new Error(name + ' is required');
  for (const name of ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'])
    if ((process.env[name]?.length ?? 0) < 32)
      throw new Error(name + ' must contain at least 32 characters');
  if (process.env.JWT_ACCESS_SECRET === process.env.JWT_REFRESH_SECRET)
    throw new Error('JWT access and refresh secrets must differ');
  const config = {
    host: process.env.POSTGRES_HOST,
    port: Number(process.env.POSTGRES_PORT || 5432),
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB,
  };
  const client = new Client({ ...config, connectionTimeoutMillis: 10000 });
  await client.connect();
  try {
    await client.query("SET statement_timeout = '5min'");
    const lock = await client.query<{ locked: boolean }>(
      'SELECT pg_try_advisory_lock(1310, 1) AS locked',
    );
    if (!lock.rows[0].locked)
      throw new Error('Another database migration is running');
    const tables = await client.query<{ count: string }>(
      "SELECT count(*) FROM pg_tables WHERE schemaname='public' AND tablename <> '_schema_migrations'",
    );
    if (Number(tables.rows[0].count) === 0) {
      const database = new Sequelize({
        dialect: 'postgres',
        host: config.host,
        port: config.port,
        username: config.user,
        password: config.password,
        database: config.database,
        models: GALLERY_MODELS,
        logging: false,
      });
      try {
        // Only a completely empty database may be initialized from models.
        await database.sync({ alter: false, force: false });
        console.log('Empty database initialized');
      } finally {
        await database.close();
      }
    }
    await applyMigrations(client, '/app/migrations');
    console.log('Database ready; runtime schema synchronization disabled');
  } finally {
    // Closing this dedicated session also releases the advisory lock.
    await client.end();
  }
}

void bootstrap().catch((error: unknown) => {
  console.error(
    'Database bootstrap failed:',
    error instanceof Error ? error.message : 'Unknown error',
  );
  process.exitCode = 1;
});
