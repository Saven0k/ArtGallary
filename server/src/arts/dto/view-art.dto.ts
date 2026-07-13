import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsNotEmpty } from "class-validator";

export class ViewArtDto {
    @ApiProperty({ example: 1, description: 'ID произведения искусства' })
    @IsInt()
    @IsNotEmpty()
    art_id: number;
}