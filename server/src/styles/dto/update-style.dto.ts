import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsOptional } from "class-validator";

export class UpdateStyleDto {
    @ApiProperty({ example: 'Импрессионизм', description: 'Название стиля', required: false })
    @IsOptional()
    @IsString()
    name?: string;

    @ApiProperty({ example: 'Направление в искусстве, характеризующееся передачей мимолетных впечатлений', description: 'Описание стиля', required: false })
    @IsOptional()
    @IsString()
    description?: string;
}