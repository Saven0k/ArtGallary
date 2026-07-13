// src/location/dto/city.dto.ts
import { ApiProperty } from "@nestjs/swagger";

export class CityDto {
    @ApiProperty({ example: 1, description: 'ID города' })
    id: number;

    @ApiProperty({ example: 'Москва', description: 'Название города' })
    name: string;

    @ApiProperty({ example: 1, description: 'ID страны' })
    country_id: number;
}