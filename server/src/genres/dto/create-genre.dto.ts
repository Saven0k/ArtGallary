import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsOptional, IsString } from "class-validator";

export class CreateGenreDto {    
    @ApiProperty({ example: 'Живопись', description: 'Название жанра' })
    @IsString({message: "Название: должно быть строкой"})
    readonly title: string;

    @ApiProperty({ example: 1, description: 'ID вида искусства' })
    @IsNumber()
    art_type_id: number;
}
export class UpdateGenreDto {
    @ApiProperty({ example: 'Рок', description: 'Название жанра', required: false })
    @IsOptional()
    @IsString()
    title?: string;

    @ApiProperty({ example: 1, description: 'ID вида искусства', required: false })
    @IsOptional()
    @IsNumber()
    art_type_id?: number;
}