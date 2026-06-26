// dto/create-artist.dto.ts
import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, IsDateString, IsNumber, MinLength, IsOptional, IsPhoneNumber } from "class-validator";

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

        
    @ApiProperty({ example: 'photographer', description: 'Вид професии артиста' })
    @IsString()
    profession?: string;

    @ApiProperty({ example: 1, description: 'ID города' })
    @IsNumber()
    city_id?: number;

    @ApiProperty({ example: 1, description: 'ID страны' })
    @IsNumber()
    country_id?: number;

    @ApiProperty({ example: '/awd/photo.png', description: 'Фотография пользователя' })
    readonly avatar_path?: string | null;

    @ApiProperty({ example: 1, description: 'Колличество лайков' })
    @IsNumber()
    likes?: number;

    @ApiProperty({ example: 1, description: 'Колличество просмотров' })
    @IsNumber()
    views?: number;
}