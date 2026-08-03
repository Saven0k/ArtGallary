// src/subscriptions/subscription-history.model.ts
import { ApiProperty } from "@nestjs/swagger";
import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from "sequelize-typescript";
import { Subscription, SubscriptionPlan } from "./subscription.model";

export enum HistoryEventType {
    PURCHASE = 'purchase',        // Покупка подписки
    RENEWAL = 'renewal',          // Автопродление
    CANCELLATION = 'cancellation', // Отмена подписки
    EXPIRATION = 'expiration',    // Истечение срока
    PLAN_CHANGE = 'plan_change',   // Смена плана
}

export enum PaymentMethod {
    CARD = 'card',
    QR_CODE = 'qr_code',
}

export enum PaymentStatus {
    SUCCESS = 'success',
    FAILED = 'failed',
    PENDING = 'pending',
}

export interface SubscriptionHistoryCreationAttrs {
    subscription_id: number;
    event_type: HistoryEventType;
    payment_method?: PaymentMethod;
    payment_status?: PaymentStatus;
    amount?: number;
    currency?: string;
    old_plan?: SubscriptionPlan;
    new_plan?: SubscriptionPlan;
    old_expires_at?: Date;
    new_expires_at?: Date;
    description?: string;
    metadata?: any;
}

@Table({ tableName: 'subscription_history' })
export class SubscriptionHistory extends Model<SubscriptionHistory, SubscriptionHistoryCreationAttrs> {
    @ApiProperty({ example: 1, description: 'ID записи' })
    @Column({ type: DataType.INTEGER, autoIncrement: true, primaryKey: true })
    id: number;

    @ApiProperty({ example: 1, description: 'ID подписки' })
    @ForeignKey(() => Subscription)
    @Column({ type: DataType.INTEGER, allowNull: false })
    subscription_id: number;

    @BelongsTo(() => Subscription)
    subscription: Subscription;

    @ApiProperty({ enum: HistoryEventType, example: 'purchase', description: 'Тип события' })
    @Column({ type: DataType.ENUM(...Object.values(HistoryEventType)), allowNull: false })
    event_type: HistoryEventType;

    @ApiProperty({ enum: PaymentMethod, example: 'card', description: 'Метод оплаты', required: false })
    @Column({ type: DataType.ENUM(...Object.values(PaymentMethod)), allowNull: true })
    payment_method: PaymentMethod;

    @ApiProperty({ enum: PaymentStatus, example: 'success', description: 'Статус оплаты', required: false })
    @Column({ type: DataType.ENUM(...Object.values(PaymentStatus)), allowNull: true })
    payment_status: PaymentStatus;

    @ApiProperty({ example: 500, description: 'Сумма оплаты', required: false })
    @Column({ type: DataType.FLOAT, allowNull: true })
    amount: number;

    @ApiProperty({ example: 'RUB', description: 'Валюта', required: false })
    @Column({ type: DataType.STRING, allowNull: true })
    currency: string;

    @ApiProperty({ enum: SubscriptionPlan, example: 'free', description: 'Старый план', required: false })
    @Column({ type: DataType.STRING, allowNull: true })
    old_plan: SubscriptionPlan;

    @ApiProperty({ enum: SubscriptionPlan, example: 'pro', description: 'Новый план', required: false })
    @Column({ type: DataType.STRING, allowNull: true })
    new_plan: SubscriptionPlan;

    @ApiProperty({ example: '2024-01-01T00:00:00.000Z', description: 'Старая дата окончания', required: false })
    @Column({ type: DataType.DATE, allowNull: true })
    old_expires_at: Date;

    @ApiProperty({ example: '2025-01-01T00:00:00.000Z', description: 'Новая дата окончания', required: false })
    @Column({ type: DataType.DATE, allowNull: true })
    new_expires_at: Date;

    @ApiProperty({ example: 'Подписка PRO на 30 дней', description: 'Описание' })
    @Column({ type: DataType.TEXT, allowNull: true })
    description: string;

    @ApiProperty({ example: { paymentId: 'pay_123' }, description: 'Метаданные', required: false })
    @Column({ type: DataType.JSON, allowNull: true })
    metadata: any;

    @ApiProperty({ example: '2024-01-01T00:00:00.000Z', description: 'Дата создания' })
    @Column({ type: DataType.DATE, defaultValue: DataType.NOW })
    created_at: Date;
}