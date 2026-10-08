import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import axios from 'axios';
import { randomUUID } from 'node:crypto';
import { Transaction } from 'sequelize';
import { AuthorProfile } from '../authors/author.model';
import { Subscription, SubscriptionPlan } from './subscription.model';
import {
  HistoryEventType,
  PaymentMethod,
  PaymentStatus,
  SubscriptionHistory,
} from './subscription-history.model';
import {
  ConfirmPaymentDto,
  PaymentInitResponseDto,
  PurchaseSubscriptionDto,
  SubscriptionResponseDto,
} from './dto/subscription.dto';

interface ProviderPayment {
  id: string;
  status: 'pending' | 'waiting_for_capture' | 'succeeded' | 'canceled';
  paid: boolean;
  test: boolean;
  amount: { value: string; currency: string };
  recipient: { account_id: string };
  metadata: { order_id: string; user_id: string; author_id: string };
  confirmation?: { confirmation_url?: string };
}

@Injectable()
export class SubscriptionService {
  private readonly prices = { free: 0, pro: 500, vip: 1000 };
  private readonly durations = [30, 90, 365];
  private readonly multipliers = [1, 2.7, 10];
  private readonly currency = 'RUB';

  constructor(
    @InjectModel(Subscription) private subscriptionModel: typeof Subscription,
    @InjectModel(SubscriptionHistory)
    private historyModel: typeof SubscriptionHistory,
    @InjectModel(AuthorProfile)
    private authorProfileModel: typeof AuthorProfile,
  ) {}

  async initiatePurchase(
    userId: number,
    dto: PurchaseSubscriptionDto,
  ): Promise<PaymentInitResponseDto> {
    const duration = dto.durationDays ?? 30;
    const method = dto.paymentMethod ?? PaymentMethod.CARD;
    const amount = this.calculatePrice(dto.plan, duration);
    if (!amount || !Object.values(PaymentMethod).includes(method)) {
      throw new BadRequestException(
        'Бесплатный план уже доступен. Для платного плана выберите способ оплаты.',
      );
    }
    const config = this.providerConfig();
    const history = await this.subscriptionModel.sequelize.transaction(
      async (transaction) => {
        const profile = await this.lockProfile(userId, transaction);
        const subscription = await this.ensureSubscription(
          Number(profile.user_id),
          transaction,
        );
        if (
          subscription.plan !== SubscriptionPlan.FREE &&
          subscription.isActive()
        ) {
          throw new BadRequestException(
            'Платная подписка уже действует. Дождитесь окончания оплаченного периода.',
          );
        }
        const pending = await this.historyModel.findOne({
          where: {
            subscription_id: subscription.id,
            payment_status: PaymentStatus.PENDING,
          },
          transaction,
          lock: transaction.LOCK.UPDATE,
          order: [['id', 'DESC']],
        });
        if (pending) {
          if (
            pending.new_plan !== dto.plan ||
            pending.metadata?.duration !== duration ||
            pending.payment_method !== method ||
            !pending.metadata?.idempotencyKey ||
            Date.now() - new Date(pending.created_at).getTime() >=
              24 * 60 * 60 * 1000
          ) {
            throw new ConflictException(
              'Сначала проверьте или завершите предыдущий платеж.',
            );
          }
          return pending;
        }
        return this.historyModel.create(
          {
            subscription_id: subscription.id,
            event_type: HistoryEventType.PURCHASE,
            payment_method: method,
            payment_status: PaymentStatus.PENDING,
            amount,
            currency: this.currency,
            old_plan: subscription.plan,
            new_plan: dto.plan,
            old_expires_at: subscription.expires_at,
            description: `Оплата подписки ${dto.plan} на ${duration} дней`,
            metadata: {
              idempotencyKey: randomUUID(),
              duration,
              userId,
              authorId: Number(profile.user_id),
              returnUrl: config.returnUrl,
            },
          },
          { transaction },
        );
      },
    );
    let payment: ProviderPayment;
    try {
      if (history.metadata.paymentId) {
        const response = await axios.get<ProviderPayment>(
          `https://api.yookassa.ru/v3/payments/${encodeURIComponent(history.metadata.paymentId)}`,
          config.request,
        );
        payment = response.data;
      } else {
        const response = await axios.post<ProviderPayment>(
          'https://api.yookassa.ru/v3/payments',
          {
            amount: {
              value: Number(history.amount).toFixed(2),
              currency: history.currency,
            },
            capture: true,
            payment_method_data: {
              type: method === PaymentMethod.QR_CODE ? 'sbp' : 'bank_card',
            },
            confirmation: {
              type: 'redirect',
              return_url: history.metadata.returnUrl,
            },
            description: history.description,
            metadata: {
              order_id: String(history.id),
              user_id: String(userId),
              author_id: String(history.metadata.authorId),
            },
          },
          {
            ...config.request,
            headers: { 'Idempotence-Key': history.metadata.idempotencyKey },
          },
        );
        payment = response.data;
      }
    } catch {
      throw new ServiceUnavailableException(
        'Платежный сервис недоступен. Повторите запрос позже.',
      );
    }
    this.verifyPayment(payment, history, config.shopId);
    const paymentUrl =
      payment.confirmation?.confirmation_url ?? history.metadata.paymentUrl;
    if (paymentUrl) {
      try {
        if (new URL(paymentUrl).protocol !== 'https:') throw new Error();
      } catch {
        throw new ServiceUnavailableException(
          'Платежный сервис не вернул безопасную ссылку на оплату.',
        );
      }
    } else if (payment.status === 'pending')
      throw new ServiceUnavailableException(
        'Платежный сервис не вернул ссылку на оплату.',
      );
    await this.subscriptionModel.sequelize.transaction(async (transaction) => {
      await this.lockProfile(userId, transaction);
      const current = await this.historyModel.findByPk(history.id, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      await current.update(
        {
          metadata: { ...current.metadata, paymentId: payment.id, paymentUrl },
          ...(payment.status === 'canceled'
            ? { payment_status: PaymentStatus.FAILED }
            : {}),
        },
        { transaction },
      );
    });
    if (payment.status === 'canceled')
      throw new BadRequestException('Платеж отменен. Повторите покупку.');
    return {
      paymentId: payment.id,
      paymentUrl,
      amount: Number(history.amount),
      currency: history.currency,
    };
  }

  purchaseSubscription(
    userId: number,
    dto: PurchaseSubscriptionDto,
  ): Promise<PaymentInitResponseDto> {
    return this.initiatePurchase(userId, dto);
  }

  async confirmPayment(
    userId: number,
    dto: ConfirmPaymentDto,
  ): Promise<{ success: boolean; message: string }> {
    const history = await this.historyModel.findOne({
      where: { 'metadata.paymentId': dto.paymentId },
    });
    if (!history) throw new NotFoundException('Платеж не найден');
    if (history.metadata?.userId !== userId)
      throw new ForbiddenException('Платеж принадлежит другому пользователю');
    if (history.payment_status === PaymentStatus.SUCCESS)
      return { success: true, message: 'Подписка уже активирована' };
    const config = this.providerConfig();
    let payment: ProviderPayment;
    try {
      const response = await axios.get<ProviderPayment>(
        `https://api.yookassa.ru/v3/payments/${encodeURIComponent(dto.paymentId)}`,
        config.request,
      );
      payment = response.data;
    } catch {
      throw new ServiceUnavailableException(
        'Не удалось проверить оплату. Повторите запрос позже.',
      );
    }
    this.verifyPayment(payment, history, config.shopId);
    return this.subscriptionModel.sequelize.transaction(async (transaction) => {
      const profile = await this.lockProfile(userId, transaction);
      if (profile.user_id !== history.metadata.authorId)
        throw new ForbiddenException('Платеж принадлежит другому автору');
      const subscription = await this.ensureSubscription(
        Number(profile.user_id),
        transaction,
      );
      const current = await this.historyModel.findByPk(history.id, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (current.payment_status === PaymentStatus.SUCCESS)
        return { success: true, message: 'Подписка уже активирована' };
      if (payment.status === 'canceled') {
        await current.update(
          { payment_status: PaymentStatus.FAILED },
          { transaction },
        );
        return { success: false, message: 'Оплата отменена' };
      }
      if (payment.status !== 'succeeded' || !payment.paid)
        return { success: false, message: 'Оплата еще не завершена' };
      const duration = current.metadata.duration;
      this.calculatePrice(current.new_plan, duration);
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + duration);
      await subscription.update(
        { plan: current.new_plan, expires_at: expiry, is_active: true },
        { transaction },
      );
      await current.update(
        {
          subscription_id: subscription.id,
          payment_status: PaymentStatus.SUCCESS,
          new_expires_at: expiry,
          metadata: {
            ...current.metadata,
            confirmedAt: new Date().toISOString(),
          },
        },
        { transaction },
      );
      return {
        success: true,
        message: `Подписка ${current.new_plan} активирована на ${duration} дней`,
      };
    });
  }

  async getSubscriptionInfo(userId: number): Promise<SubscriptionResponseDto> {
    const profile = await this.authorProfileModel.findOne({
      where: { user_id: userId },
    });
    if (!profile) throw new NotFoundException('Профиль артиста не найден');
    const current = await this.subscriptionModel.findOne({
      where: { author_id: Number(profile.user_id) },
    });
    const subscription =
      current && (current.plan === SubscriptionPlan.FREE || current.isActive())
        ? current
        : this.subscriptionModel.build({
            author_id: Number(profile.user_id),
            plan: SubscriptionPlan.FREE,
            expires_at: null,
            is_active: true,
          });
    const history = current
      ? await this.historyModel.findAll({
          where: { subscription_id: current.id },
          limit: 10,
          order: [['created_at', 'DESC']],
        })
      : [];
    return {
      plan: subscription.plan,
      expiresAt: subscription.expires_at,
      isActive: subscription.isActive(),
      planWeight: subscription.getWeight(),
      daysLeft: subscription.getDaysLeft(),
      features: subscription.getFeatures(),
      history: history.map((item) => ({
        id: item.id,
        eventType: item.event_type,
        paymentMethod: item.payment_method,
        paymentStatus: item.payment_status,
        amount: item.amount,
        currency: item.currency,
        oldPlan: item.old_plan,
        newPlan: item.new_plan,
        description: item.description,
        createdAt: item.created_at,
        paymentId: item.metadata?.paymentId,
      })),
    };
  }

  async cancelSubscription(
    userId: number,
  ): Promise<{ success: boolean; message: string }> {
    return this.subscriptionModel.sequelize.transaction(async (transaction) => {
      const profile = await this.lockProfile(userId, transaction);
      const subscription = await this.ensureSubscription(
        Number(profile.user_id),
        transaction,
      );
      if (subscription.plan === SubscriptionPlan.FREE)
        throw new BadRequestException('Нет активной платной подписки');
      const cancellation = await this.historyModel.findOne({
        where: {
          subscription_id: subscription.id,
          event_type: HistoryEventType.CANCELLATION,
          old_expires_at: subscription.expires_at,
        },
        transaction,
      });
      if (!cancellation)
        await this.historyModel.create(
          {
            subscription_id: subscription.id,
            event_type: HistoryEventType.CANCELLATION,
            old_plan: subscription.plan,
            new_plan: SubscriptionPlan.FREE,
            old_expires_at: subscription.expires_at,
            description: 'Отмена продления. Оплаченный период сохраняется.',
            metadata: { cancelledAt: new Date().toISOString() },
          },
          { transaction },
        );
      return {
        success: true,
        message: `Доступ сохранится до ${subscription.expires_at.toLocaleDateString('ru-RU')}`,
      };
    });
  }

  async getActiveSubscription(authorId: number): Promise<Subscription | null> {
    const subscription = await this.subscriptionModel.findOne({
      where: { author_id: authorId },
    });
    return subscription?.isActive() ? subscription : null;
  }

  getAvailablePlans() {
    return {
      plans: Object.values(SubscriptionPlan).map((plan) => {
        const subscription = this.subscriptionModel.build({
          author_id: 0,
          plan,
          is_active: true,
          expires_at: new Date(Date.now() + 86400000),
        });
        return {
          name: plan,
          price: this.prices[plan],
          features: subscription.getFeatures(),
          weight: subscription.getWeight(),
          durationOptions: this.durations.map((value, index) => ({
            label: ['Месяц', '3 месяца', 'Год'][index],
            value,
            price: this.calculatePrice(plan, value),
          })),
        };
      }),
      currency: this.currency,
      paymentMethods: [
        { value: PaymentMethod.CARD, label: 'Банковская карта' },
        { value: PaymentMethod.QR_CODE, label: 'QR-код' },
      ],
    };
  }

  private calculatePrice(plan: SubscriptionPlan, days: number): number {
    const index = this.durations.indexOf(days);
    if (!Object.values(SubscriptionPlan).includes(plan) || index === -1)
      throw new BadRequestException(
        'Выберите тариф и срок: 30, 90 или 365 дней.',
      );
    return Math.round(this.prices[plan] * this.multipliers[index]);
  }

  private async lockProfile(
    userId: number,
    transaction: Transaction,
  ): Promise<AuthorProfile> {
    const profile = await this.authorProfileModel.findOne({
      where: { user_id: userId },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!profile) throw new NotFoundException('Профиль артиста не найден');
    return profile;
  }

  private async ensureSubscription(
    authorId: number,
    transaction: Transaction,
  ): Promise<Subscription> {
    const [subscription, created] = await this.subscriptionModel.findOrCreate({
      where: { author_id: authorId },
      defaults: {
        author_id: authorId,
        plan: SubscriptionPlan.FREE,
        expires_at: null,
        is_active: true,
      },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (created)
      await this.historyModel.create(
        {
          subscription_id: subscription.id,
          event_type: HistoryEventType.PLAN_CHANGE,
          new_plan: SubscriptionPlan.FREE,
          amount: 0,
          currency: this.currency,
          description: 'Активация бесплатного плана',
        },
        { transaction },
      );
    if (
      subscription.plan !== SubscriptionPlan.FREE &&
      !subscription.isActive()
    ) {
      await this.historyModel.create(
        {
          subscription_id: subscription.id,
          event_type: HistoryEventType.EXPIRATION,
          old_plan: subscription.plan,
          new_plan: SubscriptionPlan.FREE,
          old_expires_at: subscription.expires_at,
          description: 'Оплаченный период подписки закончился',
        },
        { transaction },
      );
      await subscription.update(
        { plan: SubscriptionPlan.FREE, expires_at: null, is_active: true },
        { transaction },
      );
    }
    return subscription;
  }

  private providerConfig() {
    const shopId = process.env.YOOKASSA_SHOP_ID;
    const password = process.env.YOOKASSA_SECRET_KEY;
    const returnUrl = process.env.YOOKASSA_RETURN_URL;
    if (!shopId || !password || !returnUrl)
      throw new ServiceUnavailableException('Оплата подписок не настроена.');
    try {
      const url = new URL(returnUrl);
      if (
        !['http:', 'https:'].includes(url.protocol) ||
        url.username ||
        url.password
      )
        throw new Error();
    } catch {
      throw new ServiceUnavailableException(
        'Неверно настроен адрес возврата после оплаты.',
      );
    }
    return {
      shopId,
      returnUrl,
      request: {
        auth: { username: shopId, password },
        timeout: 15000,
        maxRedirects: 0,
      },
    };
  }

  private verifyPayment(
    payment: ProviderPayment,
    history: SubscriptionHistory,
    shopId: string,
  ): void {
    if (
      !/^[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}$/i.test(
        payment?.id ?? '',
      ) ||
      !['pending', 'waiting_for_capture', 'succeeded', 'canceled'].includes(
        payment.status,
      ) ||
      typeof payment.paid !== 'boolean' ||
      (history.metadata.paymentId &&
        payment.id !== history.metadata.paymentId) ||
      payment.amount?.value !== Number(history.amount).toFixed(2) ||
      payment.amount?.currency !== history.currency ||
      payment.recipient?.account_id !== shopId ||
      payment.metadata?.order_id !== String(history.id) ||
      payment.metadata?.user_id !== String(history.metadata.userId) ||
      payment.metadata?.author_id !== String(history.metadata.authorId) ||
      (process.env.NODE_ENV === 'production' &&
        payment.test &&
        process.env.YOOKASSA_ALLOW_TEST_PAYMENTS !== 'true')
    )
      throw new BadRequestException('Данные платежа не соответствуют заказу.');
  }
}
