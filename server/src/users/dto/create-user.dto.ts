import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsInt,
  Min,
  IsString,
  Length,
} from 'class-validator';
import { Transform } from 'class-transformer';

import { nullableNumber } from '../../pipes/form-transformers';

export enum Gender {
  MALE = 'M',
  FEMALE = 'F',
}

export class CreateUserDto {
  @ApiProperty({ example: 'user@main.ru', description: 'Почта' })
  @IsString({ message: 'Должно быть строкой' })
  @IsEmail({}, { message: 'Некорректный адрес электронной почты' })
  readonly email: string;

  @ApiProperty({ example: 'qwerty12345', description: 'Пароль' })
  @Length(8, 25, { message: 'Должно быть от 8 до 25 символов' })
  readonly password: string;

  @ApiProperty({ example: 'Максим', description: 'Фамилия' })
  @IsString({ message: 'Должно быть строкой' })
  readonly name: string;

  @ApiProperty({ example: 'Петров', description: 'Фамилия' })
  @IsString({ message: 'Должно быть строкой' })
  readonly surname: string;

  @ApiProperty({ example: 'Васильев', description: 'Отчество' })
  @IsOptional()
  @IsString({ message: 'Должно быть строкой' })
  readonly second_name?: string;

  @ApiProperty({ example: '1990-01-01', description: 'Дата рождения' })
  @IsDateString()
  readonly date_birthday: Date;

  @ApiProperty({ enum: Gender, example: Gender.MALE, description: 'Пол' })
  @IsEnum(Gender, { message: 'Пол должен быть M или F' })
  readonly gender: Gender;

  @ApiProperty({
    example: 1,
    description: 'ID страны из таблицы countries',
    required: false,
  })
  @IsOptional()
  @Transform(nullableNumber)
  @IsInt()
  @Min(1)
  country_id?: number | null;

  @ApiProperty({
    example: 42,
    description: 'ID города из таблицы cities',
    required: false,
  })
  @IsOptional()
  @Transform(nullableNumber)
  @IsInt()
  @Min(1)
  city_id?: number | null;
}
