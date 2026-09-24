// src/auth/dto/delete-account.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class ConfirmDeleteAccountDto {
    @ApiProperty({ example: '482193' })
    @IsString()
    @Length(6, 6)
    code: string;
}