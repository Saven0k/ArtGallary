// src/auth/dto/email-change.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Length, MinLength } from 'class-validator';

export class VerifyCurrentEmailDto {
    @ApiProperty({ example: 'user@mail.ru' })
    @IsEmail()
    email: string;
}

export class RequestEmailChangeCodeDto {
    @ApiProperty({ example: 'new@mail.ru' })
    @IsEmail()
    newEmail: string;
}

export class ConfirmEmailChangeDto {
    @ApiProperty({ example: 'new@mail.ru' })
    @IsEmail()
    newEmail: string;

    @ApiProperty({ example: '482193' })
    @IsString()
    @Length(6, 6)
    code: string;

    @ApiProperty({ example: 'myPassword123' })
    @IsString()
    @MinLength(6)
    password: string;
}

export class VerifyPasswordDto {
    @ApiProperty({ example: 'myPassword123' })
    @IsString()
    @MinLength(6)
    password: string;
}