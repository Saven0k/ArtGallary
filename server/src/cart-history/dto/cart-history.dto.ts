import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { OrderStatus } from '../cart-history.model';

export class HistoryFilterDto {
  @ApiPropertyOptional({
    enum: ['delivered', 'in_transit', 'cancelled'],
    description: 'Фильтр по статусу. Если не указан — все заказы.',
  })
  @IsOptional()
  @IsEnum(['delivered', 'in_transit', 'cancelled'])
  status?: OrderStatus;
}

export class UpdateStatusDto {
  @ApiProperty({
    enum: ['delivered', 'in_transit', 'cancelled'],
    example: 'delivered',
  })
  @IsEnum(['delivered', 'in_transit', 'cancelled'])
  status: OrderStatus;
}

export class CheckoutItemDto {
  @ApiProperty({ example: 12 })
  @IsInt()
  @Min(1)
  artId: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  @Max(999)
  quantity: number;
}

export class CheckoutDto {
  @ApiPropertyOptional({ type: [CheckoutItemDto] })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(999)
  @ValidateNested({ each: true })
  @Type(() => CheckoutItemDto)
  items?: CheckoutItemDto[];

  @ApiPropertyOptional({ enum: ['SALE10', 'SALE15', 'ART20'] })
  @IsOptional()
  @IsIn(['SALE10', 'SALE15', 'ART20'])
  promoCode?: 'SALE10' | 'SALE15' | 'ART20';
}
