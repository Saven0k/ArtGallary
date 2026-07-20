import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsPhoneNumber, IsString, Length } from "class-validator";
import { Gender } from "../users.model";
import { Type } from "class-transformer";

export class CreateUserDto {

    @ApiProperty({ example: 'user@main.ru', description: 'Почта' })
    @IsString({ message: "Должно быть строкой" })
    @IsEmail({}, { message: "Некорректный адрес электронной почты" })
    readonly email: string;

    @ApiProperty({ example: 'qwerty12345', description: 'Пароль' })
    @Length(8, 25, { message: "Должно быть от 8 до 25 символов" })
    readonly password: string;

    @ApiProperty({ example: 'Максим', description: 'Фамилия' })
    @IsString({ message: "Должно быть строкой" })
    readonly name: string;

    @ApiProperty({ example: 'Петров', description: 'Фамилия' })
    @IsString({ message: "Должно быть строкой" })
    readonly surname: string;

    @ApiProperty({ example: 'Васильев', description: 'Отчество' })
    @IsString({ message: "Должно быть строкой" })
    readonly second_name: string;

    @ApiProperty({ example: '+79876543211', description: 'Номер телефона' })
    readonly phone_number: string;

    @ApiProperty({ example: 'F', description: 'Женский пол' })
    readonly gender: Gender;

    @ApiProperty({ example: '/awd/photo.png', description: 'Фотография пользователя' })
    readonly avatar_path: string;

    @ApiProperty({ example: 1, description: 'ID страны из таблицы countries', required: false })
    @Type(() => Number)
    country_id?: number;

    @ApiProperty({ example: 42, description: 'ID города из таблицы cities', required: false })
    @Type(() => Number)
    city_id?: number;
}