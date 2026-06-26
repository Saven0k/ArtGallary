import { ApiProperty } from "@nestjs/swagger";
import { Column, DataType, HasMany, Model, Table } from "sequelize-typescript";
import { Genre } from "../genres/genre.model";

interface ArtTypeCreationAttrs {
    name: string;
}

@Table({ tableName: 'art_types' })
export class ArtType extends Model<ArtType, ArtTypeCreationAttrs> {
    @ApiProperty({ example: 'Живопись', description: 'Название вида искусства' })
    @Column({ type: DataType.STRING, unique: true, allowNull: false })
    name: string;

    @HasMany(() => Genre)
    genres: Genre[];
}