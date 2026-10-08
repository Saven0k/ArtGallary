import { Transaction } from 'sequelize';
import { Art, ART_STATUS } from '../arts/arts.model';
import { Cart } from '../cart/cart.model';
import { CartHistory, CartHistoryCreationAttrs } from './cart-history.model';
import { CartHistoryService } from './cart-history.service';

function fixture() {
  const transaction = { LOCK: { UPDATE: 'UPDATE' } } as Transaction;
  const cart = { user_id: 3, art_ids: [7] };
  const save = jest.fn(() => Promise.resolve(cart));
  const cartRow = { ...cart, save };
  const art = {
    author: {
      user_id: 8,
      is_deleted: false,
      user: { id: 8, is_deleted: false },
    },
    id: 7,
    title: 'Art',
    image_path: '/static/art.png',
    cost: 100,
    currency: 'RUB',
    moderate: '{"moderate":true}',
    status: ART_STATUS.ON_SALE,
    update: jest.fn(() => Promise.resolve()),
  };
  let queue = Promise.resolve();
  const transactionMock = jest.fn(
    <T>(work: (tx: Transaction) => Promise<T>): Promise<T> => {
      const run = queue.then(async () => {
        const previousIds = [...cartRow.art_ids];
        try {
          return await work(transaction);
        } catch (error) {
          cartRow.art_ids = previousIds;
          throw error;
        }
      });
      queue = run.then<void, void>(
        () => undefined,
        () => undefined,
      );
      return run;
    },
  );
  const cartModel = {
    sequelize: { transaction: transactionMock },
    findByPk: jest.fn(() => Promise.resolve(cartRow)),
  };
  const artModel = { findAll: jest.fn(() => Promise.resolve([art])) };
  const historyModel = {
    create: jest.fn((values: CartHistoryCreationAttrs) =>
      Promise.resolve({ ...values, id: 2, created_at: new Date() }),
    ),
  };
  const service = new CartHistoryService(
    historyModel as unknown as typeof CartHistory,
    cartModel as unknown as typeof Cart,
    artModel as unknown as typeof Art,
  );
  return {
    service,
    cart: cartRow,
    art,
    artModel,
    cartModel,
    historyModel,
    transaction,
  };
}

describe('atomic checkout', () => {
  it('creates one order for concurrent checkout requests', async () => {
    const { service, cart, cartModel, historyModel, transaction } = fixture();
    const results = await Promise.allSettled([
      service.checkout(3),
      service.checkout(3),
    ]);
    expect(
      results.filter((result) => result.status === 'fulfilled'),
    ).toHaveLength(1);
    expect(historyModel.create).toHaveBeenCalledTimes(1);
    expect(cart.art_ids).toEqual([]);
    expect(cartModel.findByPk).toHaveBeenCalledWith(3, {
      transaction,
      lock: 'UPDATE',
    });
    expect(cart.save).toHaveBeenCalledWith({ transaction });
  });

  it('stores quantities, current prices and promo discounts in the order snapshot', async () => {
    const { service } = fixture();
    const order = await service.checkout(3, {
      items: [{ artId: 7, quantity: 3 }],
      promoCode: 'SALE10',
    });
    expect(order).toMatchObject({
      subtotal: 300,
      discount: 30,
      total: 270,
      currency: 'RUB',
      promoCode: 'SALE10',
      items: [{ artId: 7, price: 100, quantity: 3, total: 300 }],
    });
  });

  it.each([
    'missing',
    'unmoderated',
    'sold',
    'invalidPrice',
    'quantity',
    'mismatchedCart',
    'promo',
    'deletedProfile',
    'deletedAccount',
  ])('rejects %s without creating an order', async (scenario) => {
    const { service, art, artModel, historyModel, cart } = fixture();
    if (scenario === 'missing') artModel.findAll.mockResolvedValue([]);
    if (scenario === 'unmoderated') art.moderate = '{"moderate":false}';
    if (scenario === 'sold') art.status = ART_STATUS.SOLD as typeof art.status;
    if (scenario === 'invalidPrice') art.cost = -1;
    if (scenario === 'deletedProfile') art.author.is_deleted = true;
    if (scenario === 'deletedAccount') art.author.user.is_deleted = true;
    const dto = {
      items: [
        {
          artId: scenario === 'mismatchedCart' ? 8 : 7,
          quantity: scenario === 'quantity' ? 0 : 1,
        },
      ],
      promoCode: scenario === 'promo' ? 'constructor' : undefined,
    };
    await expect(
      service.checkout(3, dto as Parameters<CartHistoryService['checkout']>[1]),
    ).rejects.toMatchObject({ status: 400 });
    expect(historyModel.create).not.toHaveBeenCalled();
    expect(cart.art_ids).toEqual([7]);
  });

  it('rejects mixing currencies', async () => {
    const { service, cart, art, artModel, historyModel } = fixture();
    cart.art_ids = [7, 8];
    artModel.findAll.mockResolvedValue([
      art,
      { ...art, id: 8, currency: 'USD' },
    ]);
    await expect(service.checkout(3)).rejects.toMatchObject({ status: 400 });
    expect(historyModel.create).not.toHaveBeenCalled();
  });

  it('keeps the cart when order creation fails', async () => {
    const { service, cart, historyModel } = fixture();
    historyModel.create.mockRejectedValueOnce(
      new Error('database unavailable'),
    );
    await expect(service.checkout(3)).rejects.toThrow('database unavailable');
    expect(cart.art_ids).toEqual([7]);
    expect(cart.save).not.toHaveBeenCalled();
  });

  it('uses the same transaction for the order and sold original', async () => {
    const { service, art, historyModel, transaction } = fixture();
    art.cost = 6000;
    await service.checkout(3);
    expect(art.update).toHaveBeenCalledWith(
      { status: ART_STATUS.SOLD },
      { transaction },
    );
    expect(historyModel.create).toHaveBeenCalledWith(expect.anything(), {
      transaction,
    });
  });
});
