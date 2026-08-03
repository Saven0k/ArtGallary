// src/subscriptions/dto/subscription.dto.ts
import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsOptional, IsNumber, Min, IsString, IsIn } from "class-validator";
import { SubscriptionPlan } from "../subscription.model";
import { PaymentMethod, HistoryEventType, PaymentStatus } from "../subscription-history.model";

// DTO для покупки
export class PurchaseSubscriptionDto {
    @ApiProperty({ enum: SubscriptionPlan, example: SubscriptionPlan.PRO })
    @IsEnum(SubscriptionPlan)
    plan: SubscriptionPlan;

    @ApiProperty({ example: 30, description: 'Количество дней', required: false, default: 30 })
    @IsOptional()
    @IsNumber()
    @Min(1)
    durationDays?: number;

    @ApiProperty({ enum: PaymentMethod, example: PaymentMethod.CARD, description: 'Метод оплаты' })
    @IsEnum(PaymentMethod)
    paymentMethod: PaymentMethod;
}

// DTO для подтверждения оплаты (получаем от фронта)
export class ConfirmPaymentDto {
    @ApiProperty({ example: 'pay_123456', description: 'ID платежа' })
    @IsString()
    paymentId: string;

    @ApiProperty({ example: 'success', description: 'Статус платежа' })
    @IsString()
    @IsIn(['success', 'failed', 'pending'])
    status: string;

    @ApiProperty({ example: 500, description: 'Сумма' })
    @IsNumber()
    amount: number;

    @ApiProperty({ example: 'RUB', description: 'Валюта' })
    @IsString()
    currency: string;

    @ApiProperty({ enum: PaymentMethod, example: PaymentMethod.CARD })
    @IsEnum(PaymentMethod)
    paymentMethod: PaymentMethod;

    @ApiProperty({ example: { card_last4: '4242' }, description: 'Данные платежа', required: false })
    @IsOptional()
    metadata?: any;
}

// История подписки
export class SubscriptionHistoryResponseDto {
    @ApiProperty({ example: 1 })
    id: number;

    @ApiProperty({ enum: HistoryEventType })
    eventType: HistoryEventType;

    @ApiProperty({ enum: PaymentMethod })
    paymentMethod?: PaymentMethod;

    @ApiProperty({ enum: PaymentStatus })
    paymentStatus?: PaymentStatus;

    @ApiProperty({ example: 500 })
    amount?: number;

    @ApiProperty({ example: 'RUB' })
    currency?: string;

    @ApiProperty({ enum: SubscriptionPlan })
    oldPlan?: SubscriptionPlan;

    @ApiProperty({ enum: SubscriptionPlan })
    newPlan?: SubscriptionPlan;

    @ApiProperty({ example: 'Подписка PRO на 30 дней' })
    description?: string;

    @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
    createdAt: Date;
}
// Ответ с информацией о подписке
export class SubscriptionResponseDto {
    @ApiProperty({ enum: SubscriptionPlan })
    plan: SubscriptionPlan;

    @ApiProperty({ example: '2025-12-31T23:59:59.999Z' })
    expiresAt: Date | null;

    @ApiProperty({ example: true })
    isActive: boolean;

    @ApiProperty({ example: 50 })
    planWeight: number;

    @ApiProperty({ example: 30 })
    daysLeft: number | null;

    @ApiProperty({ example: ['🔓 Базовый профиль', '🖼️ Добавление работ'] })
    features: string[];

    @ApiProperty({ type: [SubscriptionHistoryResponseDto] })
    history: SubscriptionHistoryResponseDto[];
}
// Инициирование оплаты
export class PaymentInitResponseDto {
    @ApiProperty({ example: 'pay_123456', description: 'ID платежа' })
    paymentId: string;

    @ApiProperty({ example: 'https://payment.example.com/pay/123', description: 'Ссылка на оплату' })
    paymentUrl?: string;

    @ApiProperty({ example: 'qr_code_data', description: 'Данные для QR-кода' })
    qrCodeData?: string;

    @ApiProperty({ example: 500, description: 'Сумма' })
    amount: number;

    @ApiProperty({ example: 'RUB', description: 'Валюта' })
    currency: string;
}