// src/site/dto/site.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class TrackVisitDto {
    @ApiProperty({ example: '/', required: false })
    @IsOptional()
    @IsString()
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