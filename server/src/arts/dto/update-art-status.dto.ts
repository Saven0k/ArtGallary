// dto/update-art-status.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty } from 'class-validator';
import { ART_STATUS, type ArtStatus } from '../arts.model';

const ALLOWED: ArtStatus[] = Object.values(ART_STATUS);

export class UpdateArtStatusDto {
    @ApiProperty({
        example: ART_STATUS.SOLD,
        enum: ALLOWED,
        description: 'Новый статус объекта',
    })
    @IsNotEmpty()
    @IsIn(ALLOWED)
    status: ArtStatus;
}