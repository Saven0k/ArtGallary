
import { ApiProperty } from "@nestjs/swagger";
import { IsDate, IsNumber, IsString } from "class-validator";
import { CurrencyType } from "../exhibition.model";

export class UpdateExhibitionDto {
    @ApiProperty({ example: 'Выставка посвещенная Репину', description: 'Название выставки' })
    @IsString({ message: "Должно быть строкой" })
    readonly title?: string;

    @ApiProperty({ example: 'Выставка на которой будут находится картины известного художника Репина', description: 'Описание выставки' })
    @IsString({ message: "Должно быть строкой" })
    readonly description?: string;

    @ApiProperty({ example: 'Московский проспект д8 к2', description: 'Адресс выставки' })
    @IsString({ message: "Должно быть строкой" })
    readonly address?: string;

    @ApiProperty({ example: '15.06.2026', description: 'Дата выставки' })
    @IsDate({ message: "Должно быть датой" })
    readonly date?: Date;

    @ApiProperty({ example: '800р', description: 'Цена билета на выставку' })
    @IsString({ message: "Должно быть строкой" })
    readonly cost?: string;

    @ApiProperty({ example: 'Доллары', description: 'Валюта ', required: false })
    @IsString()
    readonly currency?: CurrencyType;
    @ApiProperty({ example: 1, description: 'Колличество лайков' })
    @IsNumber()
    likes?: number;

    @ApiProperty({ example: 1, description: 'Колличество просмотров' })
    @IsNumber()
    views?: number;
    @ApiProperty({ example: '77', description: 'Количество посетителей' })
    @IsNumber()
    readonly visitors_count?: number;

    @ApiProperty({ example: '{"moderate": "true", "moderator_id": "1", "errors": {"error": "error"}}', description: 'Модерация выставки' })
    @IsString({ message: "Должно быть строкой" })
    readonly moderate?: string;

    @ApiProperty({ example: '/path/to/image', description: 'Картинка выставки' })
    @IsString({ message: "Должно быть строкой" })
    readonly image_path?: string;

    @ApiProperty({ example: '5', description: 'ID города' })
    @IsNumber()
    readonly city_id?: number;

    @ApiProperty({ example: '3', description: 'ID страны' })
    @IsNumber()
    readonly country_id?: number;

    @ApiProperty({ example: [1, 2, 3], description: 'Массив ID картин на выставке', required: false })
    readonly art_ids?: number[];

    @ApiProperty({ example: [1, 2, 3], description: 'Массив ID артистов-участников' })
    readonly artist_ids?: number[];

    @ApiProperty({ example: '1', description: 'ID жанра' })
    @IsNumber()
    readonly genre_id?: number;

    // Art Type Art Form сделать TODO
    // @ApiProperty({ example: '1', description: 'ID жанра' })
    // readonly genre_id?: number;
}