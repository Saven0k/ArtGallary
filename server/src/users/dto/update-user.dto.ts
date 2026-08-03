import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsDateString, IsEmail, IsOptional, IsPhoneNumber, IsString, Length } from "class-validator";

export class UpdateuserDto {

    @ApiProperty({ example: 'user@main.ru', description: 'Почта' })
    @IsString({ message: "Должно быть строкой" })
    @IsEmail({}, { message: "Некорректный адрес электронной почты" })
    @IsOptional()
    readonly email?: string;

    @ApiProperty({ example: 'qwerty12345', description: 'Пароль' })
    @Length(8, 25, { message: "Должно быть от 8 до 25 символов" })
    @IsOptional()
    readonly password?: string;

    @ApiProperty({ example: 'Максим', description: 'Фамилия' })
    @IsString({ message: "Должно быть строкой" })
    @IsOptional()
    readonly name?: string;

    @ApiProperty({ example: 'Петров', description: 'Фамилия' })
    @IsString({ message: "Должно быть строкой" })
    @IsOptional()
    readonly surname?: string;

    @ApiProperty({ example: 'Васиьев', description: 'Отчество' })
    @IsString({ message: "Должно быть строкой" })
    @IsOptional()
    readonly second_name?: string;

    @ApiProperty({ example: 'F', description: 'Женский пол' })
    @IsOptional()
    readonly gender?: string;

    @ApiProperty({ example: '/awd/photo.png', description: 'Фотография пользователя' })
    @IsOptional()
    readonly avatar_path?: string | null;

    @ApiProperty({ example: '1990-01-01', description: 'Дата рождения' })
    @IsDateString()
    @IsOptional()
    readonly date_birthday?: Date;

    @ApiProperty({ example: 1, description: 'ID страны (countries.id)', required: false })
    @Type(() => Number)
    country_id?: number;

    @ApiProperty({ example: 42, description: 'ID города (cities.id)', required: false })
    @Type(() => Number)
    city_id?: number;
}