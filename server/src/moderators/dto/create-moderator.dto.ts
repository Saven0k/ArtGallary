import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  IsIn,
  IsNumber,
  IsDateString,
} from 'class-validator';
import { Gender } from 'src/users/users.model';

export class CreateModeratorDto {
  @ApiProperty({ example: 'moderator@email.ru' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'Иван' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Петров' })
  @IsString()
  surname: string;

  @ApiProperty({ example: 'Иванович', required: false })
  @IsOptional()
  @IsString()
  second_name?: string;

  @ApiProperty({ example: 'M', enum: ['M', 'F'] })
  @IsIn(['M', 'F'])
  gender: Gender;

  @ApiProperty({ example: '1990-01-01' })
  @IsDateString()
  date_birthday: string;

  @ApiProperty({
    example: 1,
    description: 'ID админа, назначившего модератора',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  assigned_by?: number;
}

export class UpdateModeratorDto {
  @ApiProperty({
    example: 1,
    description: 'ID администратора, назначившего модератора',
  })
  @IsOptional()
  assigned_by?: number;
}
