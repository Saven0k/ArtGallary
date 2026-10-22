import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsOptional,
  Matches,
  Max,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ValidatePromoCodeDto {
  @ApiProperty({ example: 'GALLERY10', pattern: '^[A-Z0-9_-]{3,32}$' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @Matches(/^[A-Z0-9_-]{3,32}$/)
  code: string;
}

export class CreatePromoCodeDto extends ValidatePromoCodeDto {
  @ApiProperty({ example: 10, minimum: 1, maximum: 100 })
  @IsInt()
  @Min(1)
  @Max(100)
  percent: number;

  @ApiPropertyOptional({ example: '2027-01-01T00:00:00.000Z', nullable: true })
  @IsOptional()
  @IsDateString()
  expiresAt?: string | null;
}

export class PromoCodeStatusDto {
  @ApiProperty()
  @IsBoolean()
  active: boolean;
}

export class PromoCodeListDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;
}
