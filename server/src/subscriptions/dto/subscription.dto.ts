import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsInt,
  IsString,
  IsIn,
  Matches,
} from 'class-validator';
import { SubscriptionPlan } from '../subscription.model';
import {
  PaymentMethod,
  HistoryEventType,
  PaymentStatus,
} from '../subscription-history.model';

export class PurchaseSubscriptionDto {
  @ApiProperty({ enum: SubscriptionPlan, example: SubscriptionPlan.PRO })
  @IsEnum(SubscriptionPlan)
  plan: SubscriptionPlan;

  @ApiProperty({
    example: 30,
    description: 'Количество дней',
    required: false,
    default: 30,
  })
  @IsOptional()
  @IsInt()
  @IsIn([30, 90, 365])
  durationDays?: number;

  @ApiProperty({
    enum: PaymentMethod,
    example: PaymentMethod.CARD,
    description: 'Метод оплаты',
  })
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;
}

export class ConfirmPaymentDto {
  @ApiProperty({ example: 'pay_123456', description: 'ID платежа' })
  @IsString()
  @Matches(/^[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}$/i)
  paymentId: string;
}

export class SubscriptionHistoryResponseDto {
  @ApiProperty({
    required: false,
    description: 'ID платежа для проверки оплаты',
  })
  paymentId?: string;
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

export class PaymentInitResponseDto {
  @ApiProperty({ example: 'pay_123456', description: 'ID платежа' })
  paymentId: string;

  @ApiProperty({
    example: 'https://yoomoney.ru/checkout/payments',
    description: 'Ссылка на оплату',
    required: false,
  })
  paymentUrl?: string;

  @ApiProperty({ example: 'qr_code_data', description: 'Данные для QR-кода' })
  qrCodeData?: string;

  @ApiProperty({ example: 500, description: 'Сумма' })
  amount: number;

  @ApiProperty({ example: 'RUB', description: 'Валюта' })
  currency: string;
}
