import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsOptional, IsNumber, Min } from "class-validator";

export enum SubscriptionPlan {
    FREE = 'free',
    PRO = 'pro',
    VIP = 'vip'
}

export class PurchaseSubscriptionDto {
    @ApiProperty({ enum: SubscriptionPlan, example: 'pro', description: 'План подписки' })
    @IsEnum(SubscriptionPlan)
    plan: SubscriptionPlan;

    @ApiProperty({ example: 30, description: 'Количество дней подписки', required: false, default: 30 })
    @IsOptional()
    @IsNumber()
    @Min(1)
    durationDays?: number;
}

export class SubscriptionResponseDto {
    @ApiProperty({ example: 'free', enum: SubscriptionPlan })
    plan: string;

    @ApiProperty({ example: '2025-12-31T23:59:59.999Z', description: 'Дата окончания подписки' })
    expiresAt: Date | null;

    @ApiProperty({ example: true, description: 'Активна ли подписка' })
    isActive: boolean;

    @ApiProperty({ example: 50, description: 'Вес плана для скор' })
    planWeight: number;

    @ApiProperty({ example: 30, description: 'Дней до окончания' })
    daysLeft: number | null;

    @ApiProperty({ example: ['🔓 Базовый профиль', '🖼️ Добавление работ'], description: 'Доступные фичи' })
    features: string[];
}