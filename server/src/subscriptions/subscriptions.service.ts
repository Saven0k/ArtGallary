import { Injectable, HttpException, HttpStatus, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Subscription, SubscriptionPlan } from './subscription.model';
import { SubscriptionHistory, HistoryEventType, PaymentMethod, PaymentStatus } from './subscription-history.model';
import {
    PurchaseSubscriptionDto,
    SubscriptionResponseDto,
    PaymentInitResponseDto,
    ConfirmPaymentDto,
    SubscriptionHistoryResponseDto
} from './dto/subscription.dto';
import { WINSTON_MODULE_PROVIDER, WinstonLogger } from 'nest-winston';
import { Transaction, Op } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import { AuthorProfile } from 'src/authors/author.model';

@Injectable()
export class SubscriptionService {
    private readonly PLAN_PRICES = {
        [SubscriptionPlan.FREE]: 0,
        [SubscriptionPlan.PRO]: 500,
        [SubscriptionPlan.VIP]: 1000,
    };

    private readonly PLAN_DURATIONS = {
        monthly: 30,
        quarterly: 90,
        yearly: 365,
    };

    private readonly CURRENCY = 'RUB';

    constructor(
        @InjectModel(Subscription) private subscriptionModel: typeof Subscription,
        @InjectModel(SubscriptionHistory) private historyModel: typeof SubscriptionHistory,
        @InjectModel(AuthorProfile) private artistProfileModel: typeof AuthorProfile,
        @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: WinstonLogger,
    ) { }

    // ==================== ПУБЛИЧНЫЕ МЕТОДЫ ====================

    // 1. Инициировать покупку (создаем платеж)
    async initiatePurchase(
        userId: number,
        dto: PurchaseSubscriptionDto
    ): Promise<PaymentInitResponseDto> {
        const profile = await this.artistProfileModel.findOne({
            where: { user_id: userId }
        });

        if (!profile) {
            throw new HttpException('Профиль артиста не найден', HttpStatus.NOT_FOUND);
        }

        // Проверяем активную платную подписку
        const currentSubscription = await this.getActiveSubscription(profile.id);
        if (currentSubscription && currentSubscription.plan !== SubscriptionPlan.FREE) {
            throw new HttpException(
                `У вас уже активна подписка ${currentSubscription.plan}. Сначала отмените её.`,
                HttpStatus.BAD_REQUEST
            );
        }

        const duration = dto.durationDays || this.PLAN_DURATIONS.monthly;
        const amount = this.calculatePrice(dto.plan, duration);

        // Генерируем ID платежа
        const paymentId = `pay_${uuidv4().replace(/-/g, '').slice(0, 16)}`;

        // Сохраняем в историю как PENDING
        const history = await this.historyModel.create({
            subscription_id: currentSubscription?.id || 0,
            event_type: HistoryEventType.PURCHASE,
            payment_method: dto.paymentMethod,
            payment_status: PaymentStatus.PENDING,
            amount: amount,
            currency: this.CURRENCY,
            old_plan: currentSubscription?.plan || SubscriptionPlan.FREE,
            new_plan: dto.plan,
            old_expires_at: currentSubscription?.expires_at || null,
            description: `Инициация оплаты подписки ${dto.plan} на ${duration} дней`,
            metadata: {
                paymentId: paymentId,
                duration: duration,
                userId: userId,
                authorId: profile.id
            }
        });

        // Генерируем данные для оплаты
        const paymentData = this.generatePaymentData(paymentId, amount, dto.paymentMethod);

        this.logger.log('info', JSON.stringify({
            message: '🔄 Инициирована покупка подписки',
            context: 'SubscriptionService',
            userId,
            plan: dto.plan,
            amount,
            paymentId,
            paymentMethod: dto.paymentMethod,
        }));

        return {
            paymentId: paymentId,
            paymentUrl: paymentData.paymentUrl,
            qrCodeData: paymentData.qrCodeData,
            amount: amount,
            currency: this.CURRENCY,
        };
    }

    // 2. Подтвердить оплату (получаем результат от фронта)
    async confirmPayment(confirmDto: ConfirmPaymentDto): Promise<{ success: boolean; message: string }> {
        // Находим запись в истории по paymentId
        const history = await this.historyModel.findOne({
            where: {
                metadata: { paymentId: confirmDto.paymentId }
            },
            include: [Subscription]
        });

        if (!history) {
            throw new HttpException('Платеж не найден', HttpStatus.NOT_FOUND);
        }

        // Проверяем, не обработана ли уже транзакция
        if (history.payment_status === PaymentStatus.SUCCESS) {
            return {
                success: true,
                message: 'Подписка уже активирована'
            };
        }

        if (confirmDto.status === 'success') {
            // Успешная оплата
            return this.processSuccessfulPayment(history, confirmDto);
        } else {
            // Неудачная оплата
            await history.update({
                payment_status: PaymentStatus.FAILED,
                description: `Оплата не прошла: ${confirmDto.metadata?.error || 'неизвестная ошибка'}`
            });

            return {
                success: false,
                message: 'Оплата не прошла'
            };
        }
    }

    // 3. Получить информацию о подписке
    async getSubscriptionInfo(userId: number): Promise<SubscriptionResponseDto> {
        const profile = await this.artistProfileModel.findOne({
            where: { user_id: userId }
        });

        if (!profile) {
            throw new HttpException('Профиль артиста не найден', HttpStatus.NOT_FOUND);
        }

        // Проверяем и обновляем истекшие подписки
        await this.updateExpiredSubscriptions(profile.id);

        let subscription = await this.subscriptionModel.findOne({
            where: { author_id: profile.id },
            include: [{
                model: SubscriptionHistory,
                limit: 10,
                order: [['created_at', 'DESC']]
            }]
        });

        const history = subscription?.history || [];
        const historyResponse: SubscriptionHistoryResponseDto[] = history.map(h => ({
            id: h.id,
            eventType: h.event_type,
            paymentMethod: h.payment_method,
            paymentStatus: h.payment_status,
            amount: h.amount,
            currency: h.currency,
            oldPlan: h.old_plan,
            newPlan: h.new_plan,
            description: h.description,
            createdAt: h.created_at,
        }));

        if (!subscription) {
            // Создаем бесплатную подписку
            subscription = await this.subscriptionModel.create({
                author_id: profile.id,
                plan: SubscriptionPlan.FREE,
                expires_at: null,
                is_active: true
            });

            await this.historyModel.create({
                subscription_id: subscription.id,
                event_type: HistoryEventType.PURCHASE,
                payment_method: null,
                payment_status: PaymentStatus.SUCCESS,
                amount: 0,
                currency: this.CURRENCY,
                new_plan: SubscriptionPlan.FREE,
                description: 'Активация бесплатного плана'
            });
        }

        return {
            plan: subscription.plan,
            expiresAt: subscription.expires_at,
            isActive: subscription.isActive(),
            planWeight: subscription.getWeight(),
            daysLeft: subscription.getDaysLeft(),
            features: subscription.getFeatures(),
            history: historyResponse,
        };
    }

    // 4. Отменить подписку
    async cancelSubscription(userId: number): Promise<{ success: boolean; message: string }> {
        const profile = await this.artistProfileModel.findOne({
            where: { user_id: userId }
        });

        if (!profile) {
            throw new HttpException('Профиль артиста не найден', HttpStatus.NOT_FOUND);
        }

        const subscription = await this.getActiveSubscription(profile.id);
        if (!subscription || subscription.plan === SubscriptionPlan.FREE) {
            throw new HttpException('Нет активной платной подписки', HttpStatus.BAD_REQUEST);
        }

        // Сохраняем старые данные для истории
        const oldPlan = subscription.plan;
        const oldExpiresAt = subscription.expires_at;

        // Отменяем подписку
        subscription.is_active = false;
        await subscription.save();

        // Записываем в историю
        await this.historyModel.create({
            subscription_id: subscription.id,
            event_type: HistoryEventType.CANCELLATION,
            payment_status: PaymentStatus.SUCCESS,
            old_plan: oldPlan,
            new_plan: SubscriptionPlan.FREE,
            old_expires_at: oldExpiresAt,
            description: `Отмена подписки ${oldPlan}`,
            metadata: {
                cancelled_at: new Date(),
                reason: 'user_cancelled'
            }
        });

        // Создаем бесплатную подписку
        const freeSubscription = await this.subscriptionModel.create({
            author_id: profile.id,
            plan: SubscriptionPlan.FREE,
            expires_at: null,
            is_active: true
        });

        await this.historyModel.create({
            subscription_id: freeSubscription.id,
            event_type: HistoryEventType.PLAN_CHANGE,
            payment_status: PaymentStatus.SUCCESS,
            old_plan: oldPlan,
            new_plan: SubscriptionPlan.FREE,
            description: `Переход на бесплатный план после отмены ${oldPlan}`
        });

        this.logger.log('info', JSON.stringify({
            message: '⛔ Подписка отменена',
            context: 'SubscriptionService',
            userId,
            plan: oldPlan,
        }));

        return {
            success: true,
            message: `Подписка ${oldPlan} отменена. Доступ сохранится до ${oldExpiresAt?.toLocaleDateString()}`,
        };
    }

    // 5. Получить активную подписку (используется в ArtistsService)
    async getActiveSubscription(authorId: number): Promise<Subscription | null> {
        await this.updateExpiredSubscriptions(authorId);

        return this.subscriptionModel.findOne({
            where: {
                author_id: authorId,
                is_active: true,
                expires_at: { [Op.gt]: new Date() }
            },
            order: [['expires_at', 'DESC']]
        });
    }

    // 6. Получить доступные планы
    getAvailablePlans() {
        return {
            plans: Object.values(SubscriptionPlan).map(plan => ({
                name: plan,
                price: this.PLAN_PRICES[plan],
                features: this.getPlanFeatures(plan),
                weight: this.getPlanWeight(plan),
                durationOptions: [
                    { label: 'Месяц', value: this.PLAN_DURATIONS.monthly, price: this.PLAN_PRICES[plan] },
                    { label: '3 месяца', value: this.PLAN_DURATIONS.quarterly, price: Math.round(this.PLAN_PRICES[plan] * 2.7) },
                    { label: 'Год', value: this.PLAN_DURATIONS.yearly, price: Math.round(this.PLAN_PRICES[plan] * 10) },
                ]
            })),
            currency: this.CURRENCY,
            paymentMethods: [
                { value: 'card', label: 'Банковская карта' },
                { value: 'qr_code', label: 'QR-код' },
            ]
        };
    }

    // src/subscriptions/subscriptions.service.ts

    async purchaseSubscription(
        userId: number,
        dto: PurchaseSubscriptionDto
    ): Promise<SubscriptionResponseDto> {
        try {
            // 1. Проверяем профиль
            const profile = await this.artistProfileModel.findOne({
                where: { user_id: userId }
            });

            if (!profile) {
                throw new HttpException('Профиль артиста не найден', HttpStatus.NOT_FOUND);
            }

            // 2. Проверяем активную подписку
            const currentSubscription = await this.getActiveSubscription(profile.id);
            if (currentSubscription && currentSubscription.plan !== SubscriptionPlan.FREE) {
                throw new HttpException(
                    `У вас уже активна подписка ${currentSubscription.plan}`,
                    HttpStatus.BAD_REQUEST
                );
            }

            // 3. Рассчитываем стоимость и длительность
            const duration = dto.durationDays || this.PLAN_DURATIONS.monthly;
            const amount = this.calculatePrice(dto.plan, duration);

            // 4. Генерируем ID платежа
            const paymentId = `pay_${uuidv4().replace(/-/g, '').slice(0, 16)}`;

            // 5. Создаем запись в истории (pending)
            const history = await this.historyModel.create({
                subscription_id: currentSubscription?.id || 0,
                event_type: HistoryEventType.PURCHASE,
                payment_method: dto.paymentMethod,
                payment_status: PaymentStatus.PENDING,
                amount: amount,
                currency: this.CURRENCY,
                old_plan: currentSubscription?.plan || SubscriptionPlan.FREE,
                new_plan: dto.plan,
                old_expires_at: currentSubscription?.expires_at || null,
                description: `Покупка подписки ${dto.plan} на ${duration} дней`,
                metadata: {
                    paymentId: paymentId,
                    duration: duration,
                    userId: userId,
                    authorId: profile.id
                }
            });

            // 6. Генерируем данные для оплаты
            const paymentData = this.generatePaymentData(paymentId, amount, dto.paymentMethod);

            this.logger.log('info', JSON.stringify({
                message: '🔄 Инициирована покупка подписки',
                context: 'SubscriptionService',
                userId,
                plan: dto.plan,
                amount,
                paymentId,
            }));

            // 7. В реальном проекте здесь вы ждете webhook от платежной системы
            // Для демонстрации создаем имитацию успешной оплаты
            // В продакшене это должно быть через webhook или подтверждение от пользователя

            // Имитация успешной оплаты
            const confirmDto: ConfirmPaymentDto = {
                paymentId: paymentId,
                status: 'success',
                amount: amount,
                currency: this.CURRENCY,
                paymentMethod: dto.paymentMethod,
                metadata: {
                    card_last4: '4242',
                    payment_system: 'yookassa'
                }
            };

            // Подтверждаем платеж
            await this.confirmPayment(confirmDto);

            // Возвращаем информацию о подписке
            return this.getSubscriptionInfo(userId);

        } catch (error: any) {
            this.logger.log('error', JSON.stringify({
                message: '❌ Ошибка при покупке подписки',
                context: 'SubscriptionService',
                userId,
                error: error.message,
            }));
            throw error;
        }
    }

    // ==================== ПРИВАТНЫЕ МЕТОДЫ ====================

    // Обработка успешного платежа
    private async processSuccessfulPayment(
        history: SubscriptionHistory,
        confirmDto: ConfirmPaymentDto
    ): Promise<{ success: boolean; message: string }> {
        const metadata = history.metadata || {};
        const authorId = metadata.authorId;
        const newPlan = history.new_plan as SubscriptionPlan;
        const duration = metadata.duration || 30;

        // Обновляем запись в истории
        await history.update({
            payment_status: PaymentStatus.SUCCESS,
            amount: confirmDto.amount,
            currency: confirmDto.currency,
            payment_method: confirmDto.paymentMethod,
            description: `Оплата подписки ${newPlan} на ${duration} дней успешно завершена`,
            metadata: {
                ...metadata,
                confirmed_at: new Date(),
                ...confirmDto.metadata
            }
        });

        // Отключаем старую подписку (если была)
        await this.subscriptionModel.update(
            { is_active: false },
            { where: { author_id: authorId, is_active: true } }
        );

        // Создаем или обновляем подписку
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + duration);

        let subscription = await this.subscriptionModel.findOne({
            where: { author_id: authorId }
        });

        if (subscription) {
            subscription.plan = newPlan;
            subscription.expires_at = expiryDate;
            subscription.is_active = true;
            await subscription.save();
        } else {
            subscription = await this.subscriptionModel.create({
                author_id: authorId,
                plan: newPlan,
                expires_at: expiryDate,
                is_active: true
            });
        }

        // Обновляем связь с историей
        await history.update({
            subscription_id: subscription.id,
            new_expires_at: expiryDate
        });

        // Создаем запись об активации
        await this.historyModel.create({
            subscription_id: subscription.id,
            event_type: HistoryEventType.PURCHASE,
            payment_method: confirmDto.paymentMethod,
            payment_status: PaymentStatus.SUCCESS,
            amount: confirmDto.amount,
            currency: confirmDto.currency,
            new_plan: newPlan,
            new_expires_at: expiryDate,
            description: `Активация подписки ${newPlan} на ${duration} дней`,
            metadata: {
                paymentId: confirmDto.paymentId,
                activated_at: new Date()
            }
        });

        this.logger.log('info', JSON.stringify({
            message: '✅ Подписка успешно оплачена и активирована',
            context: 'SubscriptionService',
            authorId,
            plan: newPlan,
            amount: confirmDto.amount,
            duration,
        }));

        return {
            success: true,
            message: `Подписка ${newPlan} успешно активирована на ${duration} дней`
        };
    }

    // Проверка и обновление истекших подписок
    private async updateExpiredSubscriptions(authorId?: number): Promise<void> {
        const where: any = {
            is_active: true,
            expires_at: { [Op.lt]: new Date() }
        };

        if (authorId) {
            where.author_id = authorId;
        }

        const expired = await this.subscriptionModel.findAll({ where });

        for (const subscription of expired) {
            // Отключаем истекшую подписку
            subscription.is_active = false;
            await subscription.save();

            // Записываем в историю
            await this.historyModel.create({
                subscription_id: subscription.id,
                event_type: HistoryEventType.EXPIRATION,
                payment_status: PaymentStatus.SUCCESS,
                old_plan: subscription.plan,
                old_expires_at: subscription.expires_at,
                description: `Подписка ${subscription.plan} истекла`
            });

            // Создаем бесплатную подписку
            const freeSubscription = await this.subscriptionModel.create({
                author_id: subscription.author_id,
                plan: SubscriptionPlan.FREE,
                expires_at: null,
                is_active: true
            });

            await this.historyModel.create({
                subscription_id: freeSubscription.id,
                event_type: HistoryEventType.PLAN_CHANGE,
                payment_status: PaymentStatus.SUCCESS,
                old_plan: subscription.plan,
                new_plan: SubscriptionPlan.FREE,
                description: `Автоматический переход на бесплатный план после истечения ${subscription.plan}`
            });

            this.logger.log('info', JSON.stringify({
                message: '⏰ Подписка истекла, переход на бесплатный план',
                context: 'SubscriptionService',
                authorId: subscription.author_id,
                oldPlan: subscription.plan,
            }));
        }
    }

    // Генерация данных для оплаты
    private generatePaymentData(paymentId: string, amount: number, method: PaymentMethod): {
        paymentUrl?: string;
        qrCodeData?: string;
    } {
        // Здесь должна быть интеграция с платежной системой
        // Для примера возвращаем заглушки

        const baseUrl = 'https://payment.example.com';

        if (method === PaymentMethod.CARD) {
            return {
                paymentUrl: `${baseUrl}/pay/${paymentId}?amount=${amount}&currency=${this.CURRENCY}`,
            };
        } else {
            return {
                qrCodeData: `payment:${paymentId}:${amount}:${this.CURRENCY}`,
                paymentUrl: `${baseUrl}/qr/${paymentId}`,
            };
        }
    }

    // Расчет цены
    private calculatePrice(plan: SubscriptionPlan, days: number): number {
        const basePrice = this.PLAN_PRICES[plan];
        const monthPrice = (days / this.PLAN_DURATIONS.monthly) * basePrice;
        return Math.round(monthPrice * 100) / 100;
    }

    // Получение фич плана
    private getPlanFeatures(plan: SubscriptionPlan): string[] {
        const features = {
            [SubscriptionPlan.FREE]: ['🔓 Базовый профиль', '🖼️ Добавление работ', '📊 Базовая статистика'],
            [SubscriptionPlan.PRO]: ['🔓 Базовый профиль', '🖼️ Добавление работ', '📊 Расширенная статистика', '⚡ Приоритетная загрузка'],
            [SubscriptionPlan.VIP]: ['🔓 Базовый профиль', '🖼️ Добавление работ', '📊 Расширенная статистика', '⚡ Приоритетная загрузка', '👑 VIP-значок', '🌟 Приоритетная поддержка', '🎯 Продвижение работ'],
        };
        return features[plan] || features[SubscriptionPlan.FREE];
    }

    // Вес плана
    private getPlanWeight(plan: SubscriptionPlan): number {
        const weights = {
            [SubscriptionPlan.FREE]: 0,
            [SubscriptionPlan.PRO]: 50,
            [SubscriptionPlan.VIP]: 100,
        };
        return weights[plan] || 0;
    }
}