import { Transaction } from 'sequelize';
import { Art, ART_STATUS } from '../arts/arts.model';
import { Cart } from './cart.model';
import { CartService } from './cart.service';

function fixture() {
  const transaction = { LOCK: { UPDATE: 'UPDATE' } } as Transaction;
  const cart = {
    user_id: 3,
    art_ids: [] as number[],
    save: jest.fn(() => Promise.resolve()),
  };
  let queue = Promise.resolve();
  const transactionMock = jest.fn(
    <T>(work: (tx: Transaction) => Promise<T>): Promise<T> => {
      const run = queue.then(() => work(transaction));
      queue = run.then<void, void>(
        () => undefined,
        () => undefined,
      );
      return run;
    },
  );
  const model = {
    sequelize: { transaction: transactionMock },
    findOrCreate: jest.fn(() => Promise.resolve([cart, false])),
    findByPk: jest.fn(() => Promise.resolve(cart)),
  };
  const art = {
    author: {
      user_id: 8,
      is_deleted: false,
      user: { id: 8, is_deleted: false },
    },
    status: ART_STATUS.ON_SALE,
    moderate: '{"moderate":true}',
    cost: 100,
    currency: 'RUB',
  };
  const artModel = { findByPk: jest.fn(() => Promise.resolve(art)) };
  const service = new CartService(
    model as unknown as typeof Cart,
    artModel as unknown as typeof Art,
  );
  return { service, cart, model, art, artModel, transaction };
}

describe('cart mutations', () => {
  it('keeps concurrent additions instead of overwriting a JSON snapshot', async () => {
    const { service, cart, model, transaction } = fixture();
    await Promise.all([service.addItem(3, 7), service.addItem(3, 8)]);
    expect(cart.art_ids).toEqual([7, 8]);
    expect(model.findByPk).toHaveBeenCalledWith(3, {
      transaction,
      lock: 'UPDATE',
    });
    expect(cart.save).toHaveBeenCalledWith({ transaction });
  });

  it('does not add duplicate items', async () => {
    const { service, cart } = fixture();
    await Promise.all([service.addItem(3, 7), service.addItem(3, 7)]);
    expect(cart.art_ids).toEqual([7]);
    expect(cart.save).toHaveBeenCalledTimes(1);
  });

  it('rejects unavailable and unmoderated paintings at addition', async () => {
    const { service, art, cart } = fixture();
    art.moderate = '{"moderate":false}';
    await expect(service.addItem(3, 7)).rejects.toMatchObject({ status: 400 });
    expect(cart.art_ids).toEqual([]);
    expect(cart.save).not.toHaveBeenCalled();
  });

  it('serializes removal with addition', async () => {
    const { service, cart } = fixture();
    cart.art_ids = [7];
    await Promise.all([service.removeItem(3, 7), service.addItem(3, 8)]);
    expect(cart.art_ids).toEqual([8]);
  });

  it.each(['profile', 'account'])(
    'rejects deleted author %s at addition',
    async (subject) => {
      const { service, cart, art } = fixture();
      if (subject === 'profile') art.author.is_deleted = true;
      else art.author.user.is_deleted = true;
      await expect(service.addItem(3, 7)).rejects.toMatchObject({
        status: 400,
      });
      expect(cart.art_ids).toEqual([]);
      expect(cart.save).not.toHaveBeenCalled();
    },
  );
});
