import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsDateString,
  IsEnum,
  IsNumber,
  Min,
  Max,
} from 'class-validator';

export class StatsFilterDto {
  @ApiProperty({
    example: '2024-01-01',
    description: 'Начальная дата',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({
    example: '2024-12-31',
    description: 'Конечная дата',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ enum: ['M', 'F'], description: 'Пол', required: false })
  @IsOptional()
  @IsEnum(['M', 'F'])
  gender?: 'M' | 'F';

  @ApiProperty({ example: 18, description: 'Возраст от', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  ageFrom?: number;

  @ApiProperty({ example: 99, description: 'Возраст до', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Max(120)
  ageTo?: number;

  @ApiProperty({ example: 1, description: 'ID города', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  cityId?: number;

  @ApiProperty({ example: 1, description: 'ID страны', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  countryId?: number;
}

export class LikeDto {
  @ApiProperty({ example: 1, description: 'ID артиста или картины' })
  @Type(() => Number)
  @IsNumber()
  targetId: number;
}

export class ViewDto {
  @ApiProperty({ example: 1, description: 'ID артиста или картины' })
  @Type(() => Number)
  @IsNumber()
  targetId: number;
}
