import { ApiProperty } from "@nestjs/swagger";
import { BelongsTo, Column, DataType, ForeignKey, HasMany, Model, Table } from "sequelize-typescript";
import { User } from "../users/users.model";
import { Art } from "../arts/arts.model";
import { Profession } from "src/professions/profession.model";

export type planTypes = 'free' | 'pro' | 'vip';

export interface ArtistCreationAttrs {
    user_id: number,
    date_birthday: Date,
    biography: string,
    moderate: string,
    city_id?: string,
    country_id?: string,
    likes?: number,
    views?: number,
    plan: planTypes,
    planExpiresAt: Date | null,
    planStatus: boolean,
    profession_id: number,
    is_deleted?: boolean;
    deleted_at?: Date | null;
}

@Table({ tableName: "artist_profiles" })
export class ArtistProfile extends Model<ArtistProfile, ArtistCreationAttrs> {

    @ApiProperty({ example: '1', description: 'ID пользователя' })
    @ForeignKey(() => User)
    @Column({ type: DataType.INTEGER, unique: true, allowNull: false, primaryKey: true })
    user_id: number;

    @BelongsTo(() => User, {
        foreignKey: 'user_id',
        as: 'user'
    })
    user: User;

    @ApiProperty({ example: '12.12.1212', description: 'Дата рождения' })
    @Column({ type: DataType.DATE, allowNull: true })
    date_birthday: Date;

    @ApiProperty({ example: 'Биография артиста...', description: 'Биография артиста' })
    @Column({ type: DataType.TEXT('long'), allowNull: true })
    biography: string;

    @ApiProperty({ example: '{"moderate": false, "moderator_id": null, "errors": {}}', description: 'Статус модерации' })
    @Column({ type: DataType.TEXT, allowNull: true })
    moderate: string;

    @ApiProperty({ example: 1, description: 'ID профессии' })
    @ForeignKey(() => Profession)
    @Column({ type: DataType.INTEGER, allowNull: true })
    profession_id: number;

    @BelongsTo(() => Profession)
    profession: Profession;

    @ApiProperty({ example: 'free', description: 'План подписки' })
    @Column({ type: DataType.TEXT, defaultValue: 'free' })
    plan: string;

    @ApiProperty({ example: '20.12.2027', description: 'До какого момента действует подписка' })
    @Column({ type: DataType.DATE, allowNull: true, defaultValue: null })
    planExpiresAt: Date;

    @ApiProperty({ example: 'false', description: 'Статус подписки: активна/неактивна' })
    @Column({ type: DataType.BOOLEAN, defaultValue: false })
    playStatus: boolean;

    @ApiProperty({ example: '1', description: 'ID города' })
    @Column({ type: DataType.TEXT })
    city_id: string;

    @ApiProperty({ example: '1', description: 'ID страны' })
    @Column({ type: DataType.TEXT })
    country_id: string;

    @ApiProperty({ example: '0', description: 'Количество лайков' })
    @Column({ type: DataType.INTEGER, defaultValue: 0 })
    likes: number;

    @ApiProperty({ example: '0', description: 'Количество просмотров' })
    @Column({ type: DataType.INTEGER, defaultValue: 0 })
    views: number;

    @ApiProperty({ example: false, description: 'Флаг удаления артиста' })
    @Column({ type: DataType.BOOLEAN, defaultValue: false })
    is_deleted: boolean;

    @ApiProperty({ example: '2024-01-01T00:00:00.000Z', description: 'Дата удаления' })
    @Column({ type: DataType.DATE, allowNull: true })
    deleted_at: Date | null;

    @HasMany(() => Art)
    arts: Art[];

    isSubscriptionActive(): boolean {
        if (!this.planExpiresAt) return false;
        return new Date(this.planExpiresAt) > new Date() && this.playStatus === true;
    }

    getPlanWeight(): number {
        const weights = {
            free: 0,
            pro: 50,
            vip: 100,
        };
        return weights[this.plan as keyof typeof weights] || 0;
    }

    getAvailableFeatures(): string[] {
        const features = {
            free: ['🔓 Базовый профиль', '🖼️ Добавление работ', '📊 Базовая статистика'],
            pro: ['🔓 Базовый профиль', '🖼️ Добавление работ', '📊 Расширенная статистика',
                '⚡ Приоритетная загрузка'],
            vip: ['🔓 Базовый профиль', '🖼️ Добавление работ', '📊 Расширенная статистика',
                '⚡ Приоритетная загрузка', '👑 VIP-значок',
                '🌟 Приоритетная поддержка', '🎯 Продвижение работ'],
        };
        return features[this.plan as keyof typeof features] || features.free;
    }
    async updateSubscriptionStatus(): Promise<void> {
        const now = new Date();
        const isActive = this.planExpiresAt ? new Date(this.planExpiresAt) > now : false;

        if (this.playStatus !== isActive) {
            this.playStatus = isActive;
            await this.save();
        }
    }
    async extendSubscription(days: number): Promise<void> {
        const now = new Date();
        const currentExpiry = this.planExpiresAt ? new Date(this.planExpiresAt) : now;

        const startDate = currentExpiry > now ? currentExpiry : now;
        const newExpiry = new Date(startDate);
        newExpiry.setDate(newExpiry.getDate() + days);

        this.planExpiresAt = newExpiry;
        this.playStatus = true;
        await this.save();
    }
    async cancelSubscription(): Promise<void> {
        this.playStatus = false;
        await this.save();
    }
    getDaysLeft(): number | null {
        if (!this.planExpiresAt) return null;
        const now = new Date();
        const expiry = new Date(this.planExpiresAt);
        if (expiry <= now) return 0;

        const diffTime = expiry.getTime() - now.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
}