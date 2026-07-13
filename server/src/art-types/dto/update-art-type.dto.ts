import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsOptional } from "class-validator";

export class UpdateArtTypeDto {
    @ApiProperty({ example: 'Живопись', description: 'Название вида искусства', required: false })
    @IsOptional()
    @IsString()
    name?: string;

    @ApiProperty({ example: 'Искусство создания изображений с помощью красок', description: 'Описание вида искусства', required: false })
    @IsOptional()
    @IsString()
    description?: string;
}