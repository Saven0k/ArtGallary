// dto/moderate-artist.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, IsString, IsObject } from 'class-validator';

export class ModerateArtistDto {
    @ApiProperty({ example: 1, description: 'ID модератора' })
    @IsNumber()
    moderator_id: number;

    @ApiProperty({ example: true, description: 'Статус модерации' })
    @IsBoolean()
    moderate: boolean;

    @ApiProperty({
        example: { "biography": "Содержит нецензурную лексику", "avatar": "Слишком откровенное изображение" },
        description: 'Объект с ошибками модерации',
        required: false
    })
    @IsOptional()
    @IsObject()
    errors?: Record<string, string>;

    @ApiProperty({
        example: "Исправьте биографию",
        description: 'Комментарий модератора',
        required: false
    })
    @IsOptional()
    @IsString()
    comment?: string;
}