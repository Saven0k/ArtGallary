import { ApiProperty } from "@nestjs/swagger";
import { Exhibition } from "../exhibition.model";

export class UserExhibitionsResponse {
    @ApiProperty({ type: [Exhibition] })
    exhibitions: Exhibition[];
}