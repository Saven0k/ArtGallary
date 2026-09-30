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
        @InjectModel(AuthorProfile) private authorProfileModel: typeof AuthorProfile,
        @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: WinstonLogger,
    ) { }




    async initiatePurchase(
        userId: number,
        dto: PurchaseSubscriptionDto
    ): Promise<PaymentInitResponseDto> {
        const profile = await this.authorProfileModel.findOne({
            where: { user_id: userId }
        });

        if (!profile) {
            throw new HttpException('Профиль артиста не найден', HttpStatus.NOT_FOUND);
        }


        const currentSubscription = await this.getActiveSubscription(profile.id);
        if (currentSubscription && currentSubscription.plan !== SubscriptionPlan.FREE) {
            throw new HttpException(
                `У вас уже активна подписка ${currentSubscription.plan}. Сначала отмените её.`,
                HttpStatus.BAD_REQUEST
            );
        }

        const duration = dto.durationDays || this.PLAN_DURATIONS.monthly;
        const amount = this.calculatePrice(dto.plan, duration);


        const paymentId = `pay_${uuidv4().replace(/-/g, '').slice(0, 16)}`;


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


    async confirmPayment(confirmDto: ConfirmPaymentDto): Promise<{ success: boolean; message: string }> {

        const history = await this.historyModel.findOne({
            where: {
                metadata: { paymentId: confirmDto.paymentId }
            },
            include: [Subscription]
        });

        if (!history) {
            throw new HttpException('Платеж не найден', HttpStatus.NOT_FOUND);
        }


        if (history.payment_status === PaymentStatus.SUCCESS) {
            return {
                success: true,
                message: 'Подписка уже активирована'
            };
        }

        if (confirmDto.status === 'success') {

            return this.processSuccessfulPayment(history, confirmDto);
        } else {

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


    async getSubscriptionInfo(userId: number): Promise<SubscriptionResponseDto> {
        const profile = await this.authorProfileModel.findOne({
            where: { user_id: userId }
        });

        if (!profile) {
            throw new HttpException('Профиль артиста не найден', HttpStatus.NOT_FOUND);
        }


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


    async cancelSubscription(userId: number): Promise<{ success: boolean; message: string }> {
        const profile = await this.authorProfileModel.findOne({
            where: { user_id: userId }
        });

        if (!profile) {
            throw new HttpException('Профиль артиста не найден', HttpStatus.NOT_FOUND);
        }

        const subscription = await this.getActiveSubscription(profile.id);
        if (!subscription || subscription.plan === SubscriptionPlan.FREE) {
            throw new HttpException('Нет активной платной подписки', HttpStatus.BAD_REQUEST);
        }


        const oldPlan = subscription.plan;
        const oldExpiresAt = subscription.expires_at;


        subscription.is_active = false;
        await subscription.save();


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



    async purchaseSubscription(
        userId: number,
        dto: PurchaseSubscriptionDto
    ): Promise<SubscriptionResponseDto> {
        try {

            const profile = await this.authorProfileModel.findOne({
                where: { user_id: userId }
            });

            if (!profile) {
                throw new HttpException('Профиль артиста не найден', HttpStatus.NOT_FOUND);
            }


            const currentSubscription = await this.getActiveSubscription(profile.id);
            if (currentSubscription && currentSubscription.plan !== SubscriptionPlan.FREE) {
                throw new HttpException(
                    `У вас уже активна подписка ${currentSubscription.plan}`,
                    HttpStatus.BAD_REQUEST
                );
            }


            const duration = dto.durationDays || this.PLAN_DURATIONS.monthly;
            const amount = this.calculatePrice(dto.plan, duration);


            const paymentId = `pay_${uuidv4().replace(/-/g, '').slice(0, 16)}`;


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


            const paymentData = this.generatePaymentData(paymentId, amount, dto.paymentMethod);

            this.logger.log('info', JSON.stringify({
                message: '🔄 Инициирована покупка подписки',
                context: 'SubscriptionService',
                userId,
                plan: dto.plan,
                amount,
                paymentId,
            }));






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


            await this.confirmPayment(confirmDto);


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




    private async processSuccessfulPayment(
        history: SubscriptionHistory,
        confirmDto: ConfirmPaymentDto
    ): Promise<{ success: boolean; message: string }> {
        const metadata = history.metadata || {};
        const authorId = metadata.authorId;
        const newPlan = history.new_plan as SubscriptionPlan;
        const duration = metadata.duration || 30;


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


        await this.subscriptionModel.update(
            { is_active: false },
            { where: { author_id: authorId, is_active: true } }
        );


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


        await history.update({
            subscription_id: subscription.id,
            new_expires_at: expiryDate
        });


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

            subscription.is_active = false;
            await subscription.save();


            await this.historyModel.create({
                subscription_id: subscription.id,
                event_type: HistoryEventType.EXPIRATION,
                payment_status: PaymentStatus.SUCCESS,
                old_plan: subscription.plan,
                old_expires_at: subscription.expires_at,
                description: `Подписка ${subscription.plan} истекла`
            });


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


    private generatePaymentData(paymentId: string, amount: number, method: PaymentMethod): {
        paymentUrl?: string;
        qrCodeData?: string;
    } {



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


    private calculatePrice(plan: SubscriptionPlan, days: number): number {
        const basePrice = this.PLAN_PRICES[plan];
        const monthPrice = (days / this.PLAN_DURATIONS.monthly) * basePrice;
        return Math.round(monthPrice * 100) / 100;
    }


    private getPlanFeatures(plan: SubscriptionPlan): string[] {
        const features = {
            [SubscriptionPlan.FREE]: ['🔓 Базовый профиль', '🖼️ Добавление работ', '📊 Базовая статистика'],
            [SubscriptionPlan.PRO]: ['🔓 Базовый профиль', '🖼️ Добавление работ', '📊 Расширенная статистика', '⚡ Приоритетная загрузка'],
            [SubscriptionPlan.VIP]: ['🔓 Базовый профиль', '🖼️ Добавление работ', '📊 Расширенная статистика', '⚡ Приоритетная загрузка', '👑 VIP-значок', '🌟 Приоритетная поддержка', '🎯 Продвижение работ'],
        };
        return features[plan] || features[SubscriptionPlan.FREE];
    }


    private getPlanWeight(plan: SubscriptionPlan): number {
        const weights = {
            [SubscriptionPlan.FREE]: 0,
            [SubscriptionPlan.PRO]: 50,
            [SubscriptionPlan.VIP]: 100,
        };
        return weights[plan] || 0;
    }
}