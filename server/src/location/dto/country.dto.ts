// src/location/dto/country.dto.ts
import { ApiProperty } from "@nestjs/swagger";

export class CountryDto {
    @ApiProperty({ example: 1, description: 'ID страны' })
    id: number;

    @ApiProperty({ example: 'Россия', description: 'Название страны' })
    name: string;

    @ApiProperty({ example: 'RU', description: 'ISO2 код страны' })
    iso2: string;
}