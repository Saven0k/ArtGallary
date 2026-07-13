import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsOptional } from "class-validator";

export class CreateProfessionDto {
    @ApiProperty({ example: 'Photographer', description: 'Название профессии' })
    @IsString()
    name: string;

    @ApiProperty({ example: 'Профессиональный фотограф', description: 'Описание профессии', required: false })
    @IsOptional()
    @IsString()
    description?: string;
}