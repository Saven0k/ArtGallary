// src/location/dto/location-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class CountryResponseDto {
    @ApiProperty()
    id: number;

    @ApiProperty()
    name: string;

    @ApiProperty()
    iso2: string;

    @ApiProperty()
    iso3: string;

    @ApiProperty({ required: false })
    currency?: string;

    @ApiProperty()
    _translation?: {
        source: string;
        target: string;
        fromCache: boolean;
    };
}

export class CityResponseDto {
    @ApiProperty()
    id: number;

    @ApiProperty()
    name: string;

    @ApiProperty()
    country_id: number;

    @ApiProperty()
    _translation?: {
        source: string;
        target: string;
        fromCache: boolean;
    };
}