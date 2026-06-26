import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class CreateStyleDto {
    @ApiProperty({ example: '3d model', description: 'Название типа' })
    @IsString({ message: "Должно быть строкой" })
    readonly name: string;
}


export class UpdateStyleDto {
    @ApiProperty({ example: 'Живопись', description: 'Название типа', required: false })
    @IsOptional()
    @IsString()
    name?: string;
}