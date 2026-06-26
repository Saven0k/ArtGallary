import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsOptional } from "class-validator";

export class CreateArtTypeDto {
    @ApiProperty({ example: 'Живопись', description: 'Название вида искусства' })
    @IsString()
    name: string;
}

export class UpdateArtTypeDto {
    @ApiProperty({ example: 'Живопись', description: 'Название вида искусства' })
    @IsOptional()
    @IsString()
    name?: string;
}