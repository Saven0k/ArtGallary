import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Min,
  ValidateIf,
} from 'class-validator';
import { nullableNumber, nullableString } from '../../pipes/form-transformers';

export class UpdateAuthorDto {
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() @Length(8, 25) password?: string;
  @IsOptional() @IsString() @IsNotEmpty() name?: string;
  @IsOptional() @IsString() @IsNotEmpty() surname?: string;
  @IsOptional() @IsString() second_name?: string;
  @ValidateIf((_, value: unknown) => value !== undefined)
  @IsDateString()
  date_birthday?: Date;
  @IsOptional() @IsString() biography?: string;
  @IsOptional() @Transform(nullableNumber) @IsInt() @Min(1) profession_id?:
    | number
    | null;
  @IsOptional() @Transform(nullableNumber) @IsInt() @Min(1) country_id?:
    | number
    | null;
  @IsOptional() @Transform(nullableNumber) @IsInt() @Min(1) city_id?:
    | number
    | null;
  @Transform(nullableString) @IsOptional() @IsString() avatar_path?:
    | string
    | null;
}
