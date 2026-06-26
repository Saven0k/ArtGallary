import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsPhoneNumber, IsString, Length } from "class-validator";

export class UpdateuserDto {

    @ApiProperty({ example: 'user@main.ru', description: 'Почта' })
    @IsString({ message: "Должно быть строкой" })
    @IsEmail({}, { message: "Некорректный адрес электронной почты" })
    readonly email?: string;

    @ApiProperty({ example: 'qwerty12345', description: 'Пароль' })
    @Length(8, 25, { message: "Должно быть от 8 до 25 символов" })
    readonly password?: string;

    @ApiProperty({ example: 'Максим', description: 'Фамилия' })
    @IsString({ message: "Должно быть строкой" })
    readonly name?: string;

    @ApiProperty({ example: 'Петров', description: 'Фамилия' })
    @IsString({ message: "Должно быть строкой" })
    readonly surname?: string;

    @ApiProperty({ example: 'Васиьев', description: 'Отчество' })
    @IsString({ message: "Должно быть строкой" })
    readonly second_name?: string;

    @ApiProperty({ example: '+79876543211', description: 'Номер телефона' })
    @IsPhoneNumber()
    readonly phone_number?: string;

    @ApiProperty({ example: '/awd/photo.png', description: 'Фотография пользователя' })
    @IsPhoneNumber()
    readonly avatar_path?: string | null;
}