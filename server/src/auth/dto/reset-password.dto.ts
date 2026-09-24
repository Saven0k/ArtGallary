// src/auth/dto/reset-password.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength, Matches } from 'class-validator';

export class ResetPasswordDto {
    @ApiProperty({ description: 'Токен, полученный после проверки кода' })
    @IsString()
    resetToken: string;

    @ApiProperty({ example: 'newStrongPass1' })
    @IsString()
    @MinLength(8, { message: 'Пароль должен содержать минимум 8 символов' })
    @MaxLength(25, { message: 'Пароль не должен превышать 25 символов' })
    @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
        message: 'Пароль должен содержать хотя бы одну букву и одну цифру',
    })
    newPassword: string;
}