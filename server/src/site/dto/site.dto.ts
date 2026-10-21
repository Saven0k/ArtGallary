import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class TrackVisitDto {
  @ApiProperty({ example: '/', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Matches(/^\/[^?#]*$/)
  path?: string;
}

export class RateSiteDto {
  @ApiProperty({ example: 5, minimum: 1, maximum: 5 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  value: number;
}
