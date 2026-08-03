// src/events/dto/update-event.dto.ts
import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsOptional } from "class-validator";

export class UpdateEventDto {
    @ApiProperty({ example: 'Художница Тилинина Маргарита создала новую коллекцию картин', description: 'Название события', required: false })
    @IsString()
    @IsOptional()
    title?: string;

    @ApiProperty({ example: 'С другой стороны, глубокий уровень погружения...', description: 'Описание события', required: false })
    @IsString()
    @IsOptional()
    description?: string;
}