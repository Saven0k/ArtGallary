// dto/create-artist.dto.ts
import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsEmail, IsString, IsDateString, IsNumber, MinLength, IsOptional, IsPhoneNumber, isString } from "class-validator";

export class UpdateArtistDto {
    @ApiProperty({ example: 'email@email.ru', description: 'Почта' })
    @IsEmail()
    email?: string;

    @ApiProperty({ example: 'password123', description: 'Пароль' })
    @IsString()
    @MinLength(6)
    password?: string;

    @ApiProperty({ example: 'Иван', description: 'Имя' })
    @IsString()
    name?: string;

    @ApiProperty({ example: 'Петров', description: 'Фамилия' })
    @IsString()
    surname?: string;

    @ApiProperty({ example: 'Иванович', description: 'Отчество', required: false })
    @IsString()
    @IsOptional()
    second_name?: string;

    @ApiProperty({ example: '+79999999999', description: 'Номер телефона' })
    @IsPhoneNumber()
    phone_number?: string;

    @ApiProperty({ example: '1990-01-01', description: 'Дата рождения' })
    @IsDateString()
    date_birthday?: Date;

    @ApiProperty({ example: 'Известный художник...', description: 'Биография' })
    @IsString()
    biography?: string;

    @ApiProperty({ example: '{"moderate": "true", "moderator_id": "1", "errors": {"error": "error"}"}', description: 'Модерация аккаунта' })
    @IsString()
    moderate?: string;


    @ApiProperty({ example: '5', description: 'Вид професии артиста' })
    @IsString()
    profession_id?: number;


    @ApiProperty({ example: '/awd/photo.png', description: 'Фотография пользователя' })
    readonly avatar_path?: string | null;

    @ApiProperty({ example: 1, description: 'Колличество лайков' })
    @IsNumber()
    likes?: number;

    @ApiProperty({ example: 1, description: 'Колличество просмотров' })
    @IsNumber()
    views?: number;

    @ApiProperty({ example: 1, description: 'ID страны (countries.id)', required: false })
    @IsOptional()
    @Type(() => Number)
    country_id?: number;

    @ApiProperty({ example: 42, description: 'ID города (cities.id)', required: false })
    @IsOptional()
    @Type(() => Number)
    city_id?: number;
}