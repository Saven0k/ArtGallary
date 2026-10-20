import { ArtsService } from './arts.service';
import { ArtCreationAttrs, CurrencyType } from './arts.model';

function fixture() {
  const transaction = { commit: jest.fn(), rollback: jest.fn() };
  const stored = {
    id: 7,
    cost: 1200 as number | null,
    currency: 'RUB' as CurrencyType,
    update: jest.fn(),
  };
  const create = jest.fn((data: ArtCreationAttrs) => {
    Object.assign(stored, data);
    return Promise.resolve(stored);
  });
  const update = jest.fn((data: object) => {
    Object.assign(stored, data);
    return Promise.resolve([1]);
  });
  const service: ArtsService = Object.assign(
    Object.create(ArtsService.prototype) as ArtsService,
    {
      sequelize: { transaction: jest.fn(() => Promise.resolve(transaction)) },
      authorProfileModel: {
        findByPk: jest.fn(() =>
          Promise.resolve({ is_deleted: false, user: { is_deleted: false } }),
        ),
      },
      artRepository: {
        create,
        update,
        findByPk: jest.fn(() => Promise.resolve(stored)),
      },
      fileService: { createFile: jest.fn(() => Promise.resolve('/art.png')) },
      calculateScore: jest.fn(() => Promise.resolve(0)),
      updateScore: jest.fn(() => Promise.resolve()),
      findArtWithLocation: jest.fn(() => Promise.resolve({ ...stored })),
    },
  );
  return { service, stored, transaction, create, update };
}

it.each(['RUB', 'USD', 'CNY'] as const)(
  'persists the original amount and %s on create and edit',
  async (currency) => {
    const { service, create, stored, transaction } = fixture();
    await service.createArt(
      {
        title: 'Art',
        description: '',
        date_published: new Date(),
        author_id: 7,
        cost: 1500.5,
        currency,
      },
      undefined,
      7,
    );
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ cost: 1500.5, currency }),
      { transaction },
    );
    expect(transaction.commit).toHaveBeenCalledTimes(1);
    expect(transaction.rollback).not.toHaveBeenCalled();
    await service.updateArt(7, { cost: 0, currency });
    expect(stored).toMatchObject({ cost: 0, currency });
  },
);

it('preserves omitted price fields on partial updates and supports clearing both', async () => {
  const { service, stored, update } = fixture();
  await service.updateArt(7, { title: 'Updated' });
  expect(update).toHaveBeenCalledWith(
    { title: 'Updated' },
    { where: { id: 7 } },
  );
  expect(stored).toMatchObject({ cost: 1200, currency: 'RUB' });
  await service.updateArt(7, { currency: 'CNY' });
  expect(stored).toMatchObject({ cost: 1200, currency: 'CNY' });
  await service.updateArt(7, { cost: null, currency: null });
  expect(stored).toMatchObject({ cost: null, currency: null });
});
