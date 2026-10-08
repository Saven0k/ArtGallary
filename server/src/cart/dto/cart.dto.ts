import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class AddToCartDto {
  @ApiProperty({ example: 12, description: 'ID картины' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  artId: number;
}
