import { Transaction } from 'sequelize';
import { Art, ART_STATUS } from '../arts/arts.model';
import { Cart } from '../cart/cart.model';
import { CartHistory, CartHistoryCreationAttrs } from './cart-history.model';
import { CartHistoryService } from './cart-history.service';
import { PromoCodesService } from '../promo-codes/promo-codes.service';
import { PromoCode } from '../promo-codes/promo-code.model';

function fixture() {
  const promo = {
    code: 'GALLERY10',
    percent: 10,
    active: true,
    expiresAt: null as Date | null,
  };
  const promoModel = {
    findOne: jest.fn(({ where }: { where: { code: string } }) =>
      Promise.resolve(where.code === promo.code ? promo : null),
    ),
  };
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
    new PromoCodesService(promoModel as unknown as typeof PromoCode),
  );
  return {
    service,
    cart: cartRow,
    art,
    artModel,
    cartModel,
    historyModel,
    transaction,
    promo,
    promoModel,
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
    const { service, art } = fixture();
    Object.assign(art.author.user, { name: 'Anna', surname: 'Ivanova' });
    Object.assign(art, { specifications: 'Oil, canvas, 50 × 70' });
    const order = await service.checkout(3, {
      items: [{ artId: 7, quantity: 3 }],
      promoCode: 'GALLERY10',
    });
    expect(order).toMatchObject({
      subtotal: 300,
      discount: 30,
      total: 270,
      currency: 'RUB',
      promoCode: 'GALLERY10',
      items: [
        {
          artId: 7,
          price: 100,
          quantity: 3,
          total: 300,
          authorName: 'Ivanova Anna',
          specifications: 'Oil, canvas, 50 × 70',
        },
      ],
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

  it.each(['RUB', 'USD', 'CNY'])(
    'calculates percentage discounts to cents in %s using the server price',
    async (currency) => {
      const { service, art, promoModel, transaction } = fixture();
      art.currency = currency;
      art.cost = 100.55;
      const order = await service.checkout(3, { promoCode: ' gallery10 ' });
      expect(order).toMatchObject({
        subtotal: 100.55,
        discount: 10.06,
        total: 90.49,
        currency,
        promoCode: 'GALLERY10',
      });
      expect(promoModel.findOne).toHaveBeenCalledWith({
        where: { code: 'GALLERY10' },
        transaction,
        lock: 'UPDATE',
      });
    },
  );

  it.each(['disabled', 'expired'])(
    'rechecks a previously validated %s promo at checkout and leaves the cart intact',
    async (scenario) => {
      const { service, cart, promo, promoModel, historyModel } = fixture();
      const codes = new PromoCodesService(
        promoModel as unknown as typeof PromoCode,
      );
      await codes.getValid('GALLERY10');
      if (scenario === 'disabled') promo.active = false;
      else promo.expiresAt = new Date(Date.now() - 1);
      await expect(
        service.checkout(3, { promoCode: 'GALLERY10' }),
      ).rejects.toMatchObject({ message: 'PROMO_CODE_INVALID' });
      expect(cart.art_ids).toEqual([7]);
      expect(historyModel.create).not.toHaveBeenCalled();
      expect(cart.save).not.toHaveBeenCalled();
    },
  );

  it('supports a 100 percent discount without a negative total', async () => {
    const { service, promo } = fixture();
    promo.percent = 100;
    expect(await service.checkout(3, { promoCode: 'GALLERY10' })).toMatchObject(
      { subtotal: 100, discount: 100, total: 0 },
    );
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

describe('purchase history snapshots', () => {
  const row = (pricing: unknown = null) => ({
    id: 2,
    user_id: 3,
    art_ids: [7],
    status: 'delivered',
    created_at: new Date('2026-10-22T09:00:00Z'),
    pricing,
  });
  const snapshot = {
    artId: 7,
    title: 'Purchased title',
    imagePath: '/purchased.png',
    authorName: 'Original author',
    specifications: 'Original size',
    price: 100,
    total: 200,
    quantity: 2,
    currency: 'USD',
  };

  function historyFixture(pricing: unknown) {
    const { art, artModel } = fixture();
    const historyModel = {
      findAll: jest.fn().mockResolvedValue([row(pricing)]),
    };
    const service = new CartHistoryService(
      historyModel as unknown as typeof CartHistory,
      {} as typeof Cart,
      artModel as unknown as typeof Art,
      new PromoCodesService({} as typeof PromoCode),
    );
    return { service, art, artModel, historyModel };
  }

  it('scopes history to the authenticated user and preserves the complete snapshot without querying current art', async () => {
    const { service, artModel, historyModel } = historyFixture({
      items: [snapshot],
      total: 200,
      currency: 'USD',
    });
    const result = await service.getHistory(3, 'delivered');
    expect(historyModel.findAll).toHaveBeenCalledWith({
      where: { user_id: 3, status: 'delivered' },
      order: [['created_at', 'DESC']],
    });
    expect(result).toMatchObject({
      total: 1,
      items: [{ items: [snapshot], total: 200, currency: 'USD' }],
    });
    expect(artModel.findAll).not.toHaveBeenCalled();
  });

  it('fills missing legacy metadata once while keeping the recorded title, price and currency', async () => {
    const oldSnapshot: Partial<typeof snapshot> = { ...snapshot };
    delete oldSnapshot.authorName;
    delete oldSnapshot.specifications;
    const { service, art, artModel } = historyFixture({ items: [oldSnapshot] });
    Object.assign(art, {
      title: 'Changed title',
      cost: 9999,
      specifications: 'Current size',
    });
    Object.assign(art.author.user, { name: 'Anna', surname: 'Ivanova' });
    const result = await service.getHistory(3);
    expect(artModel.findAll).toHaveBeenCalledTimes(1);
    expect(result.items[0].items).toEqual([
      {
        ...oldSnapshot,
        authorName: 'Ivanova Anna',
        specifications: 'Current size',
      },
    ]);
  });

  it('never invents a purchase price for legacy orders, including deleted works', async () => {
    const { service, artModel, historyModel } = historyFixture(null);
    historyModel.findAll.mockResolvedValue([
      { ...row(), art_ids: [7, 8] },
      { ...row(), id: 3 },
    ]);
    const result = await service.getHistory(3);
    expect(artModel.findAll).toHaveBeenCalledTimes(1);
    expect(result.items[0].items).toEqual([
      expect.objectContaining({
        artId: 7,
        title: 'Art',
        price: null,
        total: null,
      }),
      expect.objectContaining({
        artId: 8,
        title: '',
        imagePath: '',
        price: null,
        total: null,
      }),
    ]);
  });
});
