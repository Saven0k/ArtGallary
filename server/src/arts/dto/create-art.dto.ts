import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsOptional, IsString } from "class-validator";
import { type CurrencyType } from "../arts.model";

export class CreateArtDto {
    @ApiProperty({ example: 'Шишкин Лес', description: 'Название картины' })
    readonly title: string;
    @ApiProperty({ example: 'Очень инетересная картина', description: 'Описание ' })
    readonly description: string;
    @ApiProperty({ example: '4500', description: 'Цена ', required: false })
    @IsOptional()
    @IsNumber()
    readonly cost?: number;
    @ApiProperty({ example: 'Доллары', description: 'Валюта ', required: false })
    @IsOptional()
    @IsString()
    readonly currency?: CurrencyType;
    @ApiProperty({ example: 'Путь до файла', description: 'Путь до файла на сервере' })
    readonly image_path: string;
    @ApiProperty({ example: '10', description: 'Колличество лайков на картинке' })
    readonly likes?: number;
    @ApiProperty({ example: '12.10.1911', description: 'Дата создания' })
    readonly date_published: Date;
    @ApiProperty({ example: '5', description: 'ID художника' })
    readonly artist_id: number;
    @ApiProperty({ example: '2', description: 'ID города' })
    readonly city_id: number;
    @ApiProperty({ example: '3', description: 'ID страны' })
    readonly country_id: number;
    @ApiProperty({ example: '3', description: 'ID жанра' })
    readonly genre_id: number;
    @ApiProperty({ example: '3', description: 'ID типа' })
    readonly style_id: number;
    @ApiProperty({ example: '{"key": "120x120", "value": "jpg"}', description: 'Характеристики картины в формате json ' })
    readonly specifications: string;
    @ApiProperty({ required: false, default: false })
    @IsOptional()
    is_adult?: boolean;
}