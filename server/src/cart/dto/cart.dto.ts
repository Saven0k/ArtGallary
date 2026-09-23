// src/cart/dto/cart.dto.ts
import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt } from "class-validator";

export class AddToCartDto {
    @ApiProperty({ example: 12, description: "ID картины" })
    @Type(() => Number)
    @IsInt()
    artId: number;
}