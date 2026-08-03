import { ApiProperty } from "@nestjs/swagger";
import { BelongsTo, Column, DataType, ForeignKey, HasMany, Model, Table } from "sequelize-typescript";
import { SubscriptionHistory } from "./subscription-history.model";
import { AuthorProfile } from "src/authors/author.model";

export enum SubscriptionPlan {
    FREE = 'free',
    PRO = 'pro',
    VIP = 'vip'
}

export interface SubscriptionCreationAttrs {
    author_id: number;
    plan: SubscriptionPlan;
    expires_at: Date;
    is_active: boolean;
}

@Table({ tableName: 'subscriptions' })
export class Subscription extends Model<Subscription, SubscriptionCreationAttrs> {
    @ApiProperty({ example: 1, description: 'ID подписки' })
    @Column({ type: DataType.INTEGER, autoIncrement: true, primaryKey: true })
    id: number;

    @ApiProperty({ example: 1, description: 'ID автора' })
    @ForeignKey(() => AuthorProfile)
    @Column({ type: DataType.INTEGER, allowNull: false, unique: true })
    author_id: number;

    @BelongsTo(() => AuthorProfile, { foreignKey: 'author_id' })
    author: AuthorProfile;

    @ApiProperty({ enum: SubscriptionPlan, example: 'pro', description: 'План подписки' })
    @Column({ type: DataType.STRING, defaultValue: SubscriptionPlan.FREE })
    plan: SubscriptionPlan;

    @ApiProperty({ example: '2025-12-31T23:59:59.999Z', description: 'Дата окончания подписки' })
    @Column({ type: DataType.DATE, allowNull: true })
    expires_at: Date;

    @ApiProperty({ example: true, description: 'Активна ли подписка' })
    @Column({ type: DataType.BOOLEAN, defaultValue: true })
    is_active: boolean;

    @HasMany(() => SubscriptionHistory)
    history: SubscriptionHistory[];

    // Хелперы
    isActive(): boolean {
        if (!this.is_active) return false;
        if (!this.expires_at) return false;
        return new Date(this.expires_at) > new Date();
    }

    getDaysLeft(): number | null {
        if (!this.expires_at) return null;
        const now = new Date();
        const expiry = new Date(this.expires_at);
        if (expiry <= now) return 0;
        const diffTime = expiry.getTime() - now.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    getWeight(): number {
        const weights = {
            [SubscriptionPlan.FREE]: 0,
            [SubscriptionPlan.PRO]: 50,
            [SubscriptionPlan.VIP]: 100,
        };
        return weights[this.plan] || 0;
    }

    getFeatures(): string[] {
        const features = {
            [SubscriptionPlan.FREE]: ['🔓 Базовый профиль', '🖼️ Добавление работ', '📊 Базовая статистика'],
            [SubscriptionPlan.PRO]: ['🔓 Базовый профиль', '🖼️ Добавление работ', '📊 Расширенная статистика', '⚡ Приоритетная загрузка'],
            [SubscriptionPlan.VIP]: ['🔓 Базовый профиль', '🖼️ Добавление работ', '📊 Расширенная статистика', '⚡ Приоритетная загрузка', '👑 VIP-значок', '🌟 Приоритетная поддержка', '🎯 Продвижение работ'],
        };
        return features[this.plan] || features[SubscriptionPlan.FREE];
    }

    extend(days: number): void {
        const now = new Date();
        const currentExpiry = this.expires_at ? new Date(this.expires_at) : now;
        const startDate = currentExpiry > now ? currentExpiry : now;
        const newExpiry = new Date(startDate);
        newExpiry.setDate(newExpiry.getDate() + days);
        this.expires_at = newExpiry;
        this.is_active = true;
    }
}