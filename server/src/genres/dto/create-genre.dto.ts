import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional } from 'class-validator';

export class CreateGenreDto {
  @ApiProperty({ example: 'Пейзаж', description: 'Название жанра' })
  @IsString()
  title: string;

  @ApiProperty({
    example: 'Описание жанра',
    description: 'Описание жанра',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 1, description: 'ID вида искусства' })
  @IsNumber()
  art_type_id: number;
}
