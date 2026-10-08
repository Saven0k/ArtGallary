import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class CreateArtTypeDto {
  @ApiProperty({ example: 'Живопись', description: 'Название вида искусства' })
  @IsString()
  name: string;

  @ApiProperty({
    example: 'Искусство создания изображений с помощью красок',
    description: 'Описание вида искусства',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;
}
