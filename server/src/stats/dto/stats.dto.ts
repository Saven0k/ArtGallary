import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsDateString,
  IsEnum,
  IsNumber,
  IsInt,
  IsIn,
  Min,
  Max,
} from 'class-validator';

export class StatsFilterDto {
  @IsOptional()
  @IsIn(['ru', 'en', 'zh'])
  lang?: 'ru' | 'en' | 'zh';

  @ApiProperty({
    example: '2024-01-01',
    description: 'Начальная дата',
    required: false,
  })
  @IsOptional()
  @IsDateString({ strict: true })
  startDate?: string;

  @ApiProperty({
    example: '2024-12-31',
    description: 'Конечная дата',
    required: false,
  })
  @IsOptional()
  @IsDateString({ strict: true })
  endDate?: string;

  @ApiProperty({ enum: ['M', 'F'], description: 'Пол', required: false })
  @IsOptional()
  @IsEnum(['M', 'F'])
  gender?: 'M' | 'F';

  @ApiProperty({ example: 18, description: 'Возраст от', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(120)
  ageFrom?: number;

  @ApiProperty({ example: 99, description: 'Возраст до', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(120)
  ageTo?: number;

  @ApiProperty({ example: 1, description: 'ID города', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  cityId?: number;

  @ApiProperty({ example: 1, description: 'ID страны', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
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
