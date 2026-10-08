import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { type CurrencyType } from '../arts.model';
import {
  formBoolean,
  formTags,
  nullableNumber,
} from '../../pipes/form-transformers';

export class UpdateArtDTO {
  @IsOptional() @IsString() @IsNotEmpty() title?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @Transform(nullableNumber) @IsNumber() @Min(0) cost?:
    | number
    | null;
  @IsOptional() @IsIn(['USD', 'EUR', 'RUB', 'UAH']) currency?: CurrencyType;
  @IsOptional() @IsDateString() date_published?: Date;
  @IsOptional() @Transform(nullableNumber) @IsInt() @Min(1) city_id?:
    | number
    | null;
  @IsOptional() @Transform(nullableNumber) @IsInt() @Min(1) country_id?:
    | number
    | null;
  @IsOptional() @Transform(nullableNumber) @IsInt() @Min(1) genre_id?:
    | number
    | null;
  @IsOptional() @Transform(nullableNumber) @IsInt() @Min(1) style_id?:
    | number
    | null;
  @IsOptional() @IsString() specifications?: string;
  @IsOptional() @Transform(formBoolean) @IsBoolean() is_adult?: boolean;
  @IsOptional()
  @Transform(formTags)
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  tags?: string[];
}
