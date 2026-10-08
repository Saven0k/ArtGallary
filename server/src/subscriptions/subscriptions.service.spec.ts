import axios from 'axios';
import { Transaction } from 'sequelize';
import { AuthorProfile } from '../authors/author.model';
import { SubscriptionService } from './subscriptions.service';
import {
  Subscription,
  SubscriptionCreationAttrs,
  SubscriptionPlan,
} from './subscription.model';
import {
  PaymentMethod,
  PaymentStatus,
  SubscriptionHistory,
  SubscriptionHistoryCreationAttrs,
} from './subscription-history.model';

jest.mock('axios');
const http = jest.mocked(axios);
const paymentId = '2419a771-000f-5000-9000-1edaf29243f2';

function fixture() {
  const transaction = { LOCK: { UPDATE: 'UPDATE' } } as Transaction;
  const subscription = Object.assign(
    Object.create(Subscription.prototype) as Subscription,
    {
      id: 5,
      author_id: 3,
      plan: SubscriptionPlan.FREE,
      expires_at: null,
      is_active: true,
    },
  );
  const updateSubscription = jest.fn((values: Partial<Subscription>) => {
    Object.assign(subscription, values);
    return Promise.resolve(subscription);
  });
  subscription.update = updateSubscription;
  const history = Object.assign(
    Object.create(SubscriptionHistory.prototype) as SubscriptionHistory,
    {
      id: 9,
      subscription_id: 5,
      amount: 500,
      currency: 'RUB',
      new_plan: SubscriptionPlan.PRO,
      payment_method: PaymentMethod.CARD,
      payment_status: PaymentStatus.PENDING,
      created_at: new Date(),
      metadata: {
        paymentId,
        userId: 3,
        authorId: 3,
        duration: 30,
        idempotencyKey: 'test-key',
      },
    },
  );
  const updateHistory = jest.fn((values: Partial<SubscriptionHistory>) => {
    Object.assign(history, values);
    return Promise.resolve(history);
  });
  history.update = updateHistory;
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
    findOne: jest.fn(() => Promise.resolve(subscription)),
    findOrCreate: jest.fn(() => Promise.resolve([subscription, false])),
    build: jest.fn((values: SubscriptionCreationAttrs) =>
      Object.assign(
        Object.create(Subscription.prototype) as Subscription,
        values,
      ),
    ),
  };
  const historyModel = {
    findOne: jest.fn(() => Promise.resolve(history)),
    findByPk: jest.fn(() => Promise.resolve(history)),
    findAll: jest.fn(() => Promise.resolve([history])),
    create: jest.fn((values: SubscriptionHistoryCreationAttrs) => {
      Object.assign(history, values);
      return Promise.resolve(history);
    }),
  };
  const authorModel = {
    findOne: jest.fn(() => Promise.resolve({ user_id: 3 })),
    findByPk: jest.fn(() => Promise.resolve({ user_id: 3 })),
  };
  const service = new SubscriptionService(
    model as unknown as typeof Subscription,
    historyModel as unknown as typeof SubscriptionHistory,
    authorModel as unknown as typeof AuthorProfile,
  );
  const payment = {
    id: paymentId,
    status: 'succeeded',
    paid: true,
    test: false,
    amount: { value: '500.00', currency: 'RUB' },
    recipient: { account_id: 'shop' },
    metadata: { order_id: '9', user_id: '3', author_id: '3' },
    confirmation: { confirmation_url: 'https://yoomoney.ru/checkout/test' },
  };
  http.get.mockResolvedValue({ data: payment });
  http.post.mockResolvedValue({ data: payment });
  return {
    service,
    subscription,
    history,
    model,
    historyModel,
    authorModel,
    payment,
    transaction,
    updateSubscription,
    updateHistory,
  };
}

describe('subscription payment integrity', () => {
  const originalEnv = { ...process.env };
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.YOOKASSA_SHOP_ID = 'shop';
    process.env.YOOKASSA_SECRET_KEY = 'mock-secret';
    process.env.YOOKASSA_RETURN_URL =
      'https://gallery.example/profile?section=tariff';
  });
  afterAll(() => {
    process.env = originalEnv;
  });

  it('returns 503 before creating payments when unconfigured', async () => {
    const { service, historyModel } = fixture();
    delete process.env.YOOKASSA_SECRET_KEY;
    await expect(
      service.purchaseSubscription(3, { plan: SubscriptionPlan.PRO }),
    ).rejects.toMatchObject({ status: 503 });
    expect(historyModel.create).not.toHaveBeenCalled();
    expect(http.post.mock.calls).toHaveLength(0);
  });

  it('uses the author profile user_id primary key for subscription ownership', async () => {
    const { service, model, authorModel } = fixture();
    await service.getSubscriptionInfo(3);
    await service.getActiveSubscription(3);
    expect(authorModel.findOne).toHaveBeenCalledWith({ where: { user_id: 3 } });
    expect(model.findOne).toHaveBeenCalledWith({ where: { author_id: 3 } });
    expect(model.findOrCreate).not.toHaveBeenCalled();
  });

  it('returns free subscription info without creating records when missing', async () => {
    const { service, model, historyModel } = fixture();
    model.findOne.mockResolvedValueOnce(null);
    expect(await service.getSubscriptionInfo(3)).toMatchObject({
      plan: SubscriptionPlan.FREE,
      expiresAt: null,
      isActive: true,
      planWeight: 0,
      history: [],
    });
    expect(model.findOrCreate).not.toHaveBeenCalled();
    expect(model.sequelize.transaction).not.toHaveBeenCalled();
    expect(historyModel.findAll).not.toHaveBeenCalled();
    expect(historyModel.create).not.toHaveBeenCalled();
  });

  it('rejects subscription info requests without an author profile', async () => {
    const { service, model, authorModel } = fixture();
    authorModel.findOne.mockResolvedValueOnce(null);
    await expect(service.getSubscriptionInfo(3)).rejects.toMatchObject({
      status: 404,
    });
    expect(model.findOne).not.toHaveBeenCalled();
  });

  it.each(['missing', 'expired', 'disabled', 'free', 'paid'])(
    'reads a %s subscription without creating or changing records',
    async (state) => {
      const { service, model, subscription, historyModel, updateSubscription } =
        fixture();
      if (state === 'missing') model.findOne.mockResolvedValueOnce(null);
      if (state === 'expired' || state === 'paid') {
        subscription.plan = SubscriptionPlan.PRO;
        subscription.expires_at = new Date(
          Date.now() + (state === 'paid' ? 86400000 : -1000),
        );
      }
      if (state === 'disabled') subscription.is_active = false;
      const result = await service.getActiveSubscription(3);
      expect(result).toBe(
        state === 'free' || state === 'paid' ? subscription : null,
      );
      expect(model.findOne).toHaveBeenCalledWith({ where: { author_id: 3 } });
      expect(model.findOrCreate).not.toHaveBeenCalled();
      expect(model.sequelize.transaction).not.toHaveBeenCalled();
      expect(historyModel.create).not.toHaveBeenCalled();
      expect(updateSubscription).not.toHaveBeenCalled();
    },
  );

  it('ignores caller success claims until the provider has settled payment', async () => {
    const { service, subscription, history, payment, updateSubscription } =
      fixture();
    payment.status = 'pending';
    payment.paid = false;
    const forged = { paymentId, status: 'success', amount: 0, currency: 'XXX' };
    expect((await service.confirmPayment(3, forged)).success).toBe(false);
    expect(subscription.plan).toBe(SubscriptionPlan.FREE);
    expect(history.payment_status).toBe(PaymentStatus.PENDING);
    expect(updateSubscription).not.toHaveBeenCalled();
  });

  it('denies another user before querying the provider', async () => {
    const { service } = fixture();
    await expect(
      service.confirmPayment(4, { paymentId }),
    ).rejects.toMatchObject({ status: 403 });
    expect(http.get.mock.calls).toHaveLength(0);
  });

  it.each(['amount', 'currency', 'shop', 'order', 'user', 'author'])(
    'rejects provider %s mismatches',
    async (field) => {
      const { service, payment, updateSubscription } = fixture();
      if (field === 'amount') payment.amount.value = '0.00';
      if (field === 'currency') payment.amount.currency = 'XXX';
      if (field === 'shop') payment.recipient.account_id = 'other-shop';
      if (field === 'order') payment.metadata.order_id = '99';
      if (field === 'user') payment.metadata.user_id = '99';
      if (field === 'author') payment.metadata.author_id = '99';
      await expect(
        service.confirmPayment(3, { paymentId }),
      ).rejects.toMatchObject({ status: 400 });
      expect(updateSubscription).not.toHaveBeenCalled();
    },
  );

  it('activates the existing subscription exactly once under concurrent confirmation', async () => {
    const {
      service,
      subscription,
      historyModel,
      transaction,
      updateSubscription,
      updateHistory,
    } = fixture();
    const results = await Promise.all([
      service.confirmPayment(3, { paymentId }),
      service.confirmPayment(3, { paymentId }),
    ]);
    expect(results.every((result) => result.success)).toBe(true);
    expect(subscription.plan).toBe(SubscriptionPlan.PRO);
    expect(updateSubscription).toHaveBeenCalledTimes(1);
    expect(updateSubscription).toHaveBeenCalledWith(
      expect.objectContaining({ plan: SubscriptionPlan.PRO }),
      { transaction },
    );
    expect(updateHistory).toHaveBeenCalledWith(
      expect.objectContaining({
        subscription_id: 5,
        payment_status: PaymentStatus.SUCCESS,
      }),
      { transaction },
    );
    expect(historyModel.create).not.toHaveBeenCalled();
  });

  it('preserves paid access when cancelling', async () => {
    const { service, subscription, historyModel, updateSubscription } =
      fixture();
    subscription.plan = SubscriptionPlan.VIP;
    subscription.expires_at = new Date(Date.now() + 86400000);
    historyModel.findOne.mockResolvedValueOnce(null);
    await service.cancelSubscription(3);
    await service.cancelSubscription(3);
    expect(subscription.isActive()).toBe(true);
    expect(subscription.plan).toBe(SubscriptionPlan.VIP);
    expect(updateSubscription).not.toHaveBeenCalled();
    expect(historyModel.create).toHaveBeenCalledTimes(1);
  });

  it('returns free info for expired paid access without changing records', async () => {
    const { service, subscription, historyModel, updateSubscription } =
      fixture();
    subscription.plan = SubscriptionPlan.PRO;
    subscription.expires_at = new Date(Date.now() - 1000);
    const result = await service.getSubscriptionInfo(3);
    expect(result).toMatchObject({
      plan: SubscriptionPlan.FREE,
      expiresAt: null,
      isActive: true,
      planWeight: 0,
    });
    expect(subscription.id).toBe(5);
    expect(subscription.plan).toBe(SubscriptionPlan.PRO);
    expect(historyModel.create).not.toHaveBeenCalled();
    expect(updateSubscription).not.toHaveBeenCalled();
  });

  it('creates a nonzero history FK and uses the quoted discounted price', async () => {
    const { service, history, historyModel, payment } = fixture();
    historyModel.findOne.mockResolvedValue(null);
    payment.amount.value = '1350.00';
    payment.status = 'pending';
    payment.paid = false;
    const response = await service.initiatePurchase(3, {
      plan: SubscriptionPlan.PRO,
      durationDays: 90,
    });
    expect(response.amount).toBe(1350);
    expect(history.subscription_id).toBe(5);
    const call = http.post.mock.calls[0];
    expect(call[0]).toBe('https://api.yookassa.ru/v3/payments');
    expect(call[1]).toMatchObject({
      amount: { value: '1350.00', currency: 'RUB' },
    });
    expect(typeof call[2]?.headers?.['Idempotence-Key']).toBe('string');
  });

  it('reuses the persisted idempotency key after ambiguous provider failure', async () => {
    const { service, history, payment } = fixture();
    delete history.metadata.paymentId;
    payment.status = 'pending';
    payment.paid = false;
    http.post.mockRejectedValueOnce(new Error('timeout'));
    await expect(
      service.initiatePurchase(3, { plan: SubscriptionPlan.PRO }),
    ).rejects.toMatchObject({ status: 503 });
    await service.initiatePurchase(3, { plan: SubscriptionPlan.PRO });
    for (const call of http.post.mock.calls)
      expect(call[2]?.headers).toEqual({ 'Idempotence-Key': 'test-key' });
  });
});
