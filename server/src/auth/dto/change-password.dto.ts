// src/auth/dto/change-password.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength, Matches } from 'class-validator';

export class ChangePasswordDto {
    @ApiProperty({ example: 'oldPassword123', description: 'Текущий пароль' })
    @IsString()
    @MinLength(6)
    currentPassword: string;

    @ApiProperty({ example: 'newStrongPass1', description: 'Новый пароль' })
    @IsString()
    @MinLength(8, { message: 'Пароль должен содержать минимум 8 символов' })
    @MaxLength(25, { message: 'Пароль не должен превышать 25 символов' })
    @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
        message: 'Пароль должен содержать хотя бы одну букву и одну цифру',
    })
    newPassword: string;
}