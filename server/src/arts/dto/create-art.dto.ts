import { Transform, Type } from 'class-transformer';
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
import { ART_CURRENCIES, type CurrencyType } from '../arts.model';
import {
  formBoolean,
  formTags,
  nullableNumber,
} from '../../pipes/form-transformers';

export class CreateArtDto {
  @IsString() @IsNotEmpty() title: string;
  @IsString() description: string;
  @IsOptional()
  @Transform(nullableNumber)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  cost?: number | null;
  @IsOptional() @IsIn(ART_CURRENCIES) currency?: CurrencyType;
  @IsDateString() date_published: Date;
  @Type(() => Number) @IsInt() @Min(1) author_id: number;
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
