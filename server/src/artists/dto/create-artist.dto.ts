import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsEmail, IsString, IsNumber, MinLength, IsOptional, IsPhoneNumber, isNumber } from "class-validator";

export class CreateArtistDto {
    @ApiProperty({ example: 'email@email.ru', description: 'Почта' })
    @IsEmail()
    email: string;

    @ApiProperty({ example: 'password123', description: 'Пароль' })
    @IsString()
    @MinLength(6)
    password: string;

    @ApiProperty({ example: 'Иван', description: 'Имя' })
    @IsString()
    name: string;

    @ApiProperty({ example: 'Петров', description: 'Фамилия' })
    @IsString()
    surname: string;

    @ApiProperty({ example: 'Иванович', description: 'Отчество', required: false })
    @IsString()
    second_name: string;

    @ApiProperty({ example: 'F', description: 'Девушка', required: false })
    @IsString()
    gender: "M" | "F";

    @ApiProperty({ example: '+79999999999', description: 'Номер телефона' })
    phone_number: string;

    @ApiProperty({ example: '1990-01-01', description: 'Дата рождения' })
    date_birthday: Date;

    @ApiProperty({ example: 'Известный художник...', description: 'Биография' })
    @IsString()
    biography: string;

    @ApiProperty({ example: '5', description: 'Вид професии артиста' })
    @IsNumber()
    profession_id: number;

    @ApiProperty({ example: 1, description: 'ID страны (countries.id)', required: false })
    @IsOptional()
    @Type(() => Number)
    country_id?: number;

    @ApiProperty({ example: 42, description: 'ID города (cities.id)', required: false })
    @IsOptional()
    @Type(() => Number)
    city_id?: number;

    @ApiProperty({ example: '/awd/photo.png', description: 'Фотография пользователя' })
    readonly avatar_path?: string | null;
}