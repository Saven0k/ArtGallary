import { ApiProperty } from "@nestjs/swagger";
import { type CurrencyType } from "../arts.model";

export class UpdateArtDTO {
    @ApiProperty({ example: 'Шишкин Лес', description: 'Название картины' })
    readonly title?: string;

    @ApiProperty({ example: 'Очень инетересная картина', description: 'Описание ' })
    readonly description?: string;

    @ApiProperty({ example: '4500', description: 'Цена ' })
    readonly cost?: number;

    @ApiProperty({ example: 'Доллары', description: 'Валюта ' })
    readonly currency?: CurrencyType;

    @ApiProperty({ example: 'Путь до файла', description: 'Путь до файла на сервере' })
    readonly image_path?: string;

    @ApiProperty({ example: 1, description: 'Колличество лайков' })
    likes?: number;

    @ApiProperty({ example: 1, description: 'Колличество просмотров' })
    views?: number;

    @ApiProperty({ example: '12.10.1911', description: 'Дата создания' })
    readonly date_published?: Date;

    @ApiProperty({ example: '5', description: 'ID художника' })
    readonly artist_id?: number;

    @ApiProperty({ example: '2', description: 'ID города' })
    readonly city_id?: number;

    @ApiProperty({ example: '{"moderate": "true", "moderator_id": "1", "errors": {"error": "error"}}', description: 'Объект модерации' })
    readonly moderate?: string;

    @ApiProperty({ example: '3', description: 'ID страны' })
    readonly country_id?: number;

    @ApiProperty({ example: '3', description: 'ID жанра' })
    readonly genre_id?: number;

    @ApiProperty({ example: '3', description: 'ID стиля' })
    readonly style_id?: number;

    @ApiProperty({ example: '{"size": "120x120", "type": "jpg"}', description: 'Характеристики картины в формате json ' })
    readonly specifications?: string;
    
    @ApiProperty({ required: false, default: false })
    is_adult?: boolean;
}