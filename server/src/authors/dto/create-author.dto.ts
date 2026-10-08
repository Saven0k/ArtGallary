import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsEmail,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Min,
} from 'class-validator';
import { nullableNumber } from '../../pipes/form-transformers';

export class CreateAuthorDto {
  @IsEmail() email: string;
  @IsString() @Length(8, 25) password: string;
  @IsString() @IsNotEmpty() name: string;
  @IsString() @IsNotEmpty() surname: string;
  @IsOptional() @IsString() second_name?: string;
  @IsIn(['M', 'F']) gender: 'M' | 'F';
  @IsDateString() date_birthday: Date;
  @IsOptional() @IsString() biography: string;
  @IsOptional()
  @Transform(nullableNumber)
  @IsInt()
  @Min(1)
  profession_id: number;
  @IsOptional() @Transform(nullableNumber) @IsInt() @Min(1) country_id?:
    | number
    | null;
  @IsOptional() @Transform(nullableNumber) @IsInt() @Min(1) city_id?:
    | number
    | null;
}
