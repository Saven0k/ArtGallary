import { Injectable, HttpException, HttpStatus, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ArtistProfile } from './artist.model';
import { SubscriptionResponseDto, PurchaseSubscriptionDto } from './dto/subscription.dto';
import { WINSTON_MODULE_PROVIDER, WinstonLogger } from 'nest-winston';
import { Transaction } from 'sequelize';

@Injectable()
export class SubscriptionService {
    private readonly PLAN_PRICES = {
        free: 0,
        pro: 500,
        vip: 1000,
    };

    private readonly PLAN_DURATIONS = {
        monthly: 30,
        quarterly: 90,
        yearly: 365,
    };

    constructor(
        @InjectModel(ArtistProfile) private artistProfileModel: typeof ArtistProfile,
        @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: WinstonLogger
    ) { }

    async getSubscriptionInfo(userId: number): Promise<SubscriptionResponseDto> {
        const profile = await this.artistProfileModel.findOne({ where: { user_id: userId } });
        if (!profile) throw new HttpException('Профиль артиста не найден', HttpStatus.NOT_FOUND);
        await profile.updateSubscriptionStatus();
        return {
            plan: profile.plan,
            expiresAt: profile.planExpiresAt,
            isActive: profile.isSubscriptionActive(),
            planWeight: profile.getPlanWeight(),
            daysLeft: profile.getDaysLeft(),
            features: profile.getAvailableFeatures(),
        };
    }

    async purchaseSubscription(
        userId: number,
        dto: PurchaseSubscriptionDto,
        transaction?: Transaction
    ): Promise<SubscriptionResponseDto> {
        const profile = await this.artistProfileModel.findOne({ where: { user_id: userId }, transaction });

        if (!profile) throw new HttpException('Профиль артиста не найден', HttpStatus.NOT_FOUND);

        if (profile.plan === dto.plan && profile.isSubscriptionActive()) {
            throw new HttpException(
                `У вас уже активна подписка ${dto.plan}`,
                HttpStatus.BAD_REQUEST
            );
        }

        const duration = dto.durationDays || this.PLAN_DURATIONS.monthly;
        profile.plan = dto.plan;
        await profile.extendSubscription(duration);
        await profile.save({ transaction });
        this.logger.log('info', JSON.stringify({
            message: '✅ Подписка приобретена',
            context: 'SubscriptionService',
            userId,
            plan: dto.plan,
            duration,
        }));

        return this.getSubscriptionInfo(userId);
    }

    async cancelSubscription(userId: number): Promise<{ success: boolean; message: string }> {
        const profile = await this.artistProfileModel.findOne({ where: { user_id: userId } });
        if (!profile) throw new HttpException('Профиль артиста не найден', HttpStatus.NOT_FOUND);
        if (!profile.isSubscriptionActive()) throw new HttpException('Подписка не активна', HttpStatus.BAD_REQUEST);
        await profile.cancelSubscription();
        this.logger.log('info', JSON.stringify({
            message: '⛔ Подписка отменена',
            context: 'SubscriptionService',
            userId,
            plan: profile.plan,
        }));

        return {
            success: true,
            message: `Подписка ${profile.plan} отменена. Доступ сохранится до ${profile.planExpiresAt?.toLocaleDateString()}`,
        };
    }

    async checkAllSubscriptions(): Promise<void> {
        const profiles = await this.artistProfileModel.findAll();

        for (const profile of profiles) {
            await profile.updateSubscriptionStatus();

            if (!profile.isSubscriptionActive() && profile.plan !== 'free') {
                profile.plan = 'free';
                await profile.save();

                this.logger.log('info', JSON.stringify({
                    message: '🔄 Подписка сброшена на free',
                    context: 'SubscriptionService',
                    userId: profile.user_id,
                    previousPlan: profile.plan,
                }));
            }
        }

        this.logger.log('info', JSON.stringify({
            message: '✅ Проверка подписок завершена',
            context: 'SubscriptionService',
            processed: profiles.length,
        }));
    }

    getAvailablePlans() {
        return {
            plans: Object.keys(this.PLAN_PRICES).map(plan => ({
                name: plan,
                price: this.PLAN_PRICES[plan as keyof typeof this.PLAN_PRICES],
                features: this.getPlanFeatures(plan),
            })),
            durations: [
                { label: 'Месяц', value: this.PLAN_DURATIONS.monthly },
                { label: '3 месяца', value: this.PLAN_DURATIONS.quarterly },
                { label: 'Год', value: this.PLAN_DURATIONS.yearly },
            ],
        };
    }

    private getPlanFeatures(plan: string): string[] {
        const features = {
            free: ['🔓 Базовый профиль', '🖼️ Добавление работ', '📊 Базовая статистика'],
            pro: ['🔓 Базовый профиль', '🖼️ Добавление работ', '📊 Расширенная статистика',
                '⚡ Приоритетная загрузка'],
            vip: ['🔓 Базовый профиль', '🖼️ Добавление работ', '📊 Расширенная статистика',
                '⚡ Приоритетная загрузка', '👑 VIP-значок',
                '🌟 Приоритетная поддержка', '🎯 Продвижение работ'],
        };
        return features[plan as keyof typeof features] || features.free;
    }
}