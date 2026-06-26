import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, MinLength, IsOptional, IsPhoneNumber } from "class-validator";

export class CreateModeratorDto {
    @ApiProperty({ example: 'moderator@email.ru', description: 'Почта' })
    @IsEmail()
    email: string;

    @ApiProperty({ example: 'password123', description: 'Пароль' })
    @IsString()
    @MinLength(6)
    password: string;

    @ApiProperty({ example: 'Иван', description: 'Имя' })
    @IsString()
    name: string;

    @ApiProperty({ example: 'Петров', description: 'Фамилия' })
    @IsString()
    surname: string;

    @ApiProperty({ example: 'Иванович', description: 'Отчество', required: false })
    @IsOptional()
    @IsString()
    second_name?: string;

    @ApiProperty({ example: '+79999999999', description: 'Номер телефона' })
    @IsPhoneNumber()
    phone_number: string;
}

export class UpdateModeratorDto {
    @ApiProperty({ example: 1, description: 'ID администратора, назначившего модератора' })
    @IsOptional()
    assigned_by?: number;
}