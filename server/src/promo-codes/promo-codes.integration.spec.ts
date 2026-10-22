import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { Client } from 'pg';
import { Sequelize } from 'sequelize-typescript';
import { PromoCode } from './promo-code.model';
import { PromoCodesService } from './promo-codes.service';

const url = process.env.PROMO_TEST_DATABASE_URL;
if (url) {
  const target = new URL(url);
  if (
    !['localhost', '127.0.0.1'].includes(target.hostname) ||
    target.pathname !== '/gallery_promo_test' ||
    Number(target.port) < 20000
  )
    throw new Error(
      'Promo integration tests require an isolated local gallery_promo_test database on a test port',
    );
}

(url ? describe : describe.skip)('promo codes with PostgreSQL', () => {
  let database: Sequelize;
  let client: Client;
  let service: PromoCodesService;
  let migration: string;

  beforeAll(async () => {
    database = new Sequelize(url, {
      dialect: 'postgres',
      models: [PromoCode],
      logging: false,
    });
    client = new Client({ connectionString: url });
    await client.connect();
    await database.sync();
    migration = await readFile(
      resolve(__dirname, '../../../deploy/sql/20261022-promo-codes.sql'),
      'utf8',
    );
    await client.query(migration);
    await client.query(migration);
    service = new PromoCodesService(PromoCode);
  });
  afterAll(async () => {
    await database?.close();
    await client?.end();
  });
  beforeEach(async () => {
    await PromoCode.destroy({ where: {} });
  });

  it('migrates a fresh Sequelize table idempotently and enforces SQL checks', async () => {
    await service.create({ code: 'FIRST', percent: 10 });
    await expect(
      client.query(
        'INSERT INTO promo_codes(code, percent, "createdAt", "updatedAt") VALUES ($1, $2, NOW(), NOW())',
        ['BAD SPACE', 10],
      ),
    ).rejects.toMatchObject({ code: '23514' });
    await expect(
      client.query(
        'INSERT INTO promo_codes(code, percent, "createdAt", "updatedAt") VALUES ($1, $2, NOW(), NOW())',
        ['BAD_PERCENT', 101],
      ),
    ).rejects.toMatchObject({ code: '23514' });
    expect((await service.list({ page: 1, limit: 20 })).total).toBe(1);
  });

  it('migrates legacy codes without re-enabling an existing disabled promotion', async () => {
    await client.query(migration);
    expect(await PromoCode.count()).toBe(3);
    const promo = await service.getValid('SALE10');
    await service.setActive(promo.id, false);
    await client.query(migration);
    expect(await PromoCode.count()).toBe(3);
    await expect(service.getValid('SALE10')).rejects.toMatchObject({
      message: 'PROMO_CODE_INVALID',
    });
  });

  it('allows only one concurrent creation of a normalized code', async () => {
    const results = await Promise.allSettled([
      service.create({ code: ' same_code ', percent: 10 }),
      service.create({ code: 'SAME_CODE', percent: 15 }),
    ]);
    expect(
      results.filter((result) => result.status === 'fulfilled'),
    ).toHaveLength(1);
    expect(
      results.find((result) => result.status === 'rejected'),
    ).toMatchObject({ reason: { status: 409 } });
    expect(await PromoCode.count()).toBe(1);
  });

  it('locks checkout validation against a simultaneous administrator deactivation', async () => {
    const promo = await service.create({ code: 'LOCKED', percent: 10 });
    const transaction = await database.transaction();
    let update: Promise<PromoCode> | undefined;
    try {
      await service.getValid('LOCKED', transaction);
      let finished = false;
      update = service.setActive(promo.id, false).then((result) => {
        finished = true;
        return result;
      });
      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(finished).toBe(false);
    } finally {
      await transaction.rollback();
    }
    await update;
    await expect(service.getValid('LOCKED')).rejects.toMatchObject({
      message: 'PROMO_CODE_INVALID',
    });
  });

  it('persists activation changes and respects expiry stored as a PostgreSQL timestamp', async () => {
    const promo = await service.create({
      code: 'EXPIRING',
      percent: 25,
      expiresAt: new Date(Date.now() + 60000).toISOString(),
    });
    expect(await service.getValid('expiring')).toMatchObject({
      percent: 25,
      active: true,
    });
    await PromoCode.update(
      { expiresAt: new Date(Date.now() - 1000) },
      { where: { id: promo.id } },
    );
    await expect(service.getValid('EXPIRING')).rejects.toMatchObject({
      message: 'PROMO_CODE_INVALID',
    });
  });
});
