import { UniqueConstraintError, Transaction } from 'sequelize';
import { PromoCodesService } from './promo-codes.service';
import { PromoCode } from './promo-code.model';

function fixture() {
  const promo = {
    id: 1,
    code: 'GALLERY10',
    percent: 10,
    active: true,
    expiresAt: null as Date | null,
  };
  const model = {
    create: jest.fn().mockResolvedValue(promo),
    findOne: jest.fn().mockResolvedValue(promo),
    findAndCountAll: jest.fn().mockResolvedValue({ rows: [promo], count: 1 }),
    update: jest.fn().mockResolvedValue([1, [promo]]),
  };
  return {
    service: new PromoCodesService(model as unknown as typeof PromoCode),
    model,
    promo,
  };
}

describe('promo code management and validation', () => {
  it('normalizes a new code and stores an optional absolute expiry', async () => {
    const { service, model } = fixture();
    const expiresAt = new Date(Date.now() + 60000).toISOString();
    await service.create({ code: ' gallery10 ', percent: 10, expiresAt });
    expect(model.create).toHaveBeenCalledWith({
      code: 'GALLERY10',
      percent: 10,
      expiresAt: new Date(expiresAt),
    });
    await service.create({ code: 'FOREVER', percent: 5 });
    expect(model.create).toHaveBeenLastCalledWith({
      code: 'FOREVER',
      percent: 5,
      expiresAt: null,
    });
  });

  it('rejects an expired creation date and reports duplicate codes while preserving database errors', async () => {
    const { service, model } = fixture();
    for (const expiresAt of ['2000-01-01T00:00:00Z', 'invalid'])
      await expect(
        service.create({ code: 'TEST', percent: 10, expiresAt }),
      ).rejects.toMatchObject({ status: 400 });
    expect(model.create).not.toHaveBeenCalled();
    model.create.mockRejectedValueOnce(new UniqueConstraintError({}));
    await expect(
      service.create({ code: 'TEST', percent: 10 }),
    ).rejects.toMatchObject({ status: 409, message: 'PROMO_CODE_EXISTS' });
    model.create.mockRejectedValueOnce(new Error('database unavailable'));
    await expect(service.create({ code: 'TEST', percent: 10 })).rejects.toThrow(
      'database unavailable',
    );
  });

  it('uses one query for a normalized code and locks it inside checkout', async () => {
    const { service, model, promo } = fixture();
    const transaction = { LOCK: { UPDATE: 'UPDATE' } } as Transaction;
    expect(await service.getValid(' gallery10 ', transaction)).toBe(promo);
    expect(model.findOne).toHaveBeenCalledWith({
      where: { code: 'GALLERY10' },
      transaction,
      lock: 'UPDATE',
    });
    expect(model.findOne).toHaveBeenCalledTimes(1);
  });

  it.each(['missing', 'disabled', 'expired', 'invalidFormat'])(
    'rejects %s codes',
    async (scenario) => {
      const { service, model, promo } = fixture();
      if (scenario === 'missing') model.findOne.mockResolvedValue(null);
      if (scenario === 'disabled') promo.active = false;
      if (scenario === 'expired') promo.expiresAt = new Date(Date.now() - 1);
      await expect(
        service.getValid(scenario === 'invalidFormat' ? '../../' : 'GALLERY10'),
      ).rejects.toMatchObject({ status: 400, message: 'PROMO_CODE_INVALID' });
      if (scenario === 'invalidFormat')
        expect(model.findOne).not.toHaveBeenCalled();
    },
  );

  it('lists a bounded page and updates only the active flag without changing historic discounts', async () => {
    const { service, model } = fixture();
    expect(await service.list({ page: 2, limit: 20 })).toMatchObject({
      total: 1,
      page: 2,
      limit: 20,
    });
    expect(model.findAndCountAll).toHaveBeenCalledWith({
      order: [
        ['createdAt', 'DESC'],
        ['id', 'DESC'],
      ],
      limit: 20,
      offset: 20,
    });
    await service.setActive(1, false);
    expect(model.update).toHaveBeenCalledWith(
      { active: false },
      { where: { id: 1 }, returning: true },
    );
    model.update.mockResolvedValueOnce([0, []]);
    await expect(service.setActive(999, true)).rejects.toMatchObject({
      status: 404,
    });
  });
});
