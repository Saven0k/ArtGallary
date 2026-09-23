// src/cart-history/dto/cart-history.dto.ts
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsOptional } from "class-validator";
import { OrderStatus } from "../cart-history.model";

export class HistoryFilterDto {
    @ApiPropertyOptional({
        enum: ["delivered", "in_transit", "cancelled"],
        description: "Фильтр по статусу. Если не указан — все заказы.",
    })
    @IsOptional()
    @IsEnum(["delivered", "in_transit", "cancelled"])
    status?: OrderStatus;
}

export class UpdateStatusDto {
    @ApiProperty({
        enum: ["delivered", "in_transit", "cancelled"],
        example: "delivered",
    })
    @IsEnum(["delivered", "in_transit", "cancelled"])
    status: OrderStatus;
}