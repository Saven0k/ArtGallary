import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsOptional } from "class-validator";

export class UpdateProfessionDto {
    @ApiProperty({ example: 'Photographer', description: 'Название профессии', required: false })
    @IsOptional()
    @IsString()
    name?: string;

    @ApiProperty({ example: 'Профессиональный фотограф', description: 'Описание профессии', required: false })
    @IsOptional()
    @IsString()
    description?: string;
}