import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsPhoneNumber, IsString, Length } from "class-validator";

export class AuthUserDto {

    @ApiProperty({ example: 'user@main.ru', description: 'Почта' })
    readonly email: string;

    @ApiProperty({ example: 'qwerty12345', description: 'Пароль' })
    readonly password: string;
}