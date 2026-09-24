import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Length } from 'class-validator';

export class RequestCodeDto {
    @ApiProperty({ example: 'user@mail.ru' })
    @IsEmail()
    email: string;
}


export class VerifyCodeDto {
    @ApiProperty({ example: 'user@mail.ru' })
    @IsEmail()
    email: string;

    @ApiProperty({ example: '482193' })
    @IsString()
    @Length(6, 6)
    code: string;
}