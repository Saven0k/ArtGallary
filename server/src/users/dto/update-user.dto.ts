import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsEmail,
  IsOptional,
  IsInt,
  Min,
  IsString,
  Length,
} from 'class-validator';

import { nullableNumber } from '../../pipes/form-transformers';

export class UpdateuserDto {
  @ApiProperty({ example: 'user@main.ru', description: 'Почта' })
  @IsString({ message: 'Должно быть строкой' })
  @IsEmail({}, { message: 'Некорректный адрес электронной почты' })
  @IsOptional()
  readonly email?: string;

  @ApiProperty({ example: 'qwerty12345', description: 'Пароль' })
  @Length(8, 25, { message: 'Должно быть от 8 до 25 символов' })
  @IsOptional()
  readonly password?: string;

  @ApiProperty({ example: 'Максим', description: 'Фамилия' })
  @IsString({ message: 'Должно быть строкой' })
  @IsOptional()
  readonly name?: string;

  @ApiProperty({ example: 'Петров', description: 'Фамилия' })
  @IsString({ message: 'Должно быть строкой' })
  @IsOptional()
  readonly surname?: string;

  @ApiProperty({ example: 'Васиьев', description: 'Отчество' })
  @IsString({ message: 'Должно быть строкой' })
  @IsOptional()
  readonly second_name?: string;

  @ApiProperty({ example: '1990-01-01', description: 'Дата рождения' })
  @IsDateString()
  @IsOptional()
  readonly date_birthday?: Date;

  @ApiProperty({
    example: 1,
    description: 'ID страны (countries.id)',
    required: false,
  })
  @IsOptional()
  @Transform(nullableNumber)
  @IsInt()
  @Min(1)
  country_id?: number | null;

  @ApiProperty({
    example: 42,
    description: 'ID города (cities.id)',
    required: false,
  })
  @IsOptional()
  @Transform(nullableNumber)
  @IsInt()
  @Min(1)
  city_id?: number | null;
}
