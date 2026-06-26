import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, IsString, IsObject } from 'class-validator';

export class ModerateExhibitionDto {
    @ApiProperty({ example: 1, description: 'ID модератора' })
    @IsNumber()
    moderator_id: number;

    @ApiProperty({ example: true, description: 'Статус модерации' })
    @IsBoolean()
    moderate: boolean;

    @ApiProperty({
        example: { "title": "Слишком длинное название", "description": "Содержит нецензурную лексику" },
        description: 'Объект с ошибками модерации',
        required: false
    })
    @IsOptional()
    @IsObject()
    errors?: Record<string, string>;

    @ApiProperty({
        example: "Исправьте название",
        description: 'Комментарий модератора',
        required: false
    })
    @IsOptional()
    @IsString()
    comment?: string;
}