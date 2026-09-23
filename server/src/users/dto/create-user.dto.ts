import { ApiProperty } from "@nestjs/swagger";
import { IsDateString, IsEmail, IsEnum, IsPhoneNumber, IsString, Length } from "class-validator";
import { Type } from "class-transformer";

export enum Gender {
    MALE = 'M',
    FEMALE = 'F'
}


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

    @ApiProperty({ example: '1990-01-01', description: 'Дата рождения' })
    @IsDateString()
    readonly date_birthday: Date;

    @ApiProperty({ enum: Gender, example: Gender.MALE, description: 'Пол' })
    @IsEnum(Gender, { message: "Пол должен быть M или F" })
    readonly gender: Gender;

    @ApiProperty({ example: 1, description: 'ID страны из таблицы countries', required: false })
    @Type(() => Number)
    country_id?: number;

    @ApiProperty({ example: 42, description: 'ID города из таблицы cities', required: false })
    @Type(() => Number)
    city_id?: number;
}