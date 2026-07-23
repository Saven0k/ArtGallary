import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsEmail, IsString, MinLength, IsOptional, IsPhoneNumber, IsEnum, IsNumber } from "class-validator";
import { Gender } from "src/users/users.model";


export class UpdateModeratorDto {
    @ApiProperty({ example: 'new@email.ru', required: false })
    @IsOptional()
    @IsEmail()
    email?: string;
 
    @ApiProperty({ example: 'newpassword123', required: false })
    @IsOptional()
    @IsString()
    @MinLength(6)
    password?: string;
 
    @ApiProperty({ example: 'Иван', required: false })
    @IsOptional()
    @IsString()
    name?: string;
 
    @ApiProperty({ example: 'Петров', required: false })
    @IsOptional()
    @IsString()
    surname?: string;
 
    @ApiProperty({ example: 'Иванович', required: false })
    @IsOptional()
    @IsString()
    second_name?: string;
 
    @ApiProperty({ example: '+79999999999', required: false })
    @IsOptional()
    @IsPhoneNumber()
    phone_number?: string;
 
    @ApiProperty({ example: 'F', enum: ['M', 'F'], required: false })
    @IsOptional()
    @IsEnum(['M', 'F'])
    gender?: Gender;
 
    @ApiProperty({ example: 2, description: 'ID нового назначившего администратора', required: false })
    @IsOptional()
    @Type(() => Number)
    assigned_by?: number;
}