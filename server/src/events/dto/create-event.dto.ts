// src/events/dto/create-event.dto.ts
import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNotEmpty } from "class-validator";

export class CreateEventDto {
    @ApiProperty({ example: 'Художница Тилинина Маргарита создала новую коллекцию картин', description: 'Название события' })
    @IsString()
    @IsNotEmpty()
    title: string;

    @ApiProperty({ example: 'С другой стороны, глубокий уровень погружения обеспечивает актуальность...', description: 'Описание события' })
    @IsString()
    @IsNotEmpty()
    description: string;
}