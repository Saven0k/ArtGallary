import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, MinLength, MaxLength, Matches, IsNotEmpty } from "class-validator";

export class AuthUserDto {
    @ApiProperty({ example: 'user@main.ru', description: 'Почта' })
    @IsEmail({}, { message: 'Некорректный формат email' })
    @IsNotEmpty({ message: 'Email обязателен' })
    readonly email: string;

    @ApiProperty({ example: 'qwerty12345', description: 'Пароль' })
    @IsString({ message: 'Пароль должен быть строкой' })
    @IsNotEmpty({ message: 'Пароль обязателен' })
    @MinLength(6, { message: 'Пароль должен содержать минимум 6 символов' })
    @MaxLength(20, { message: 'Пароль должен содержать максимум 20 символов' })
    // Опционально: проверка на сложность пароля
    @Matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d!@#$%^&*()_+={}\[\]:;"'<>,.?\/\\|`~-]{6,20}$/, {
        message: 'Пароль должен содержать как минимум одну букву и одну цифру'
    })
    readonly password: string;
}