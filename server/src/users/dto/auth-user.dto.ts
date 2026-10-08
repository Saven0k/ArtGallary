import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsNotEmpty } from 'class-validator';

export class AuthUserDto {
  @ApiProperty({ example: 'user@main.ru', description: 'Почта' })
  @IsEmail({}, { message: 'Некорректный формат email' })
  @IsNotEmpty({ message: 'Email обязателен' })
  readonly email: string;

  @ApiProperty({ example: 'qwerty12345', description: 'Пароль' })
  @IsString({ message: 'Пароль должен быть строкой' })
  @IsNotEmpty({ message: 'Пароль обязателен' })
  readonly password: string;
}
