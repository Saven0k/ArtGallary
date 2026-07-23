import { ApiProperty } from "@nestjs/swagger";
import { Column, DataType, Model, Table, ForeignKey, BelongsTo } from "sequelize-typescript";
import { ArtType } from "../art-types/art-type.model";

interface GenreCreationAttrs {
    title: string;
    art_type_id: number;
    description?: string;
}

@Table({ tableName: 'genres' })
export class Genre extends Model<Genre, GenreCreationAttrs> {
    @ApiProperty({ example: 'Пейзаж', description: 'Название жанра' })
    @Column({ type: DataType.STRING, allowNull: false })
    title: string;

    @ApiProperty({ example: 'Описание жанра', description: 'Описание жанра', required: false })
    @Column({ type: DataType.TEXT, allowNull: true })
    description?: string;

    @ApiProperty({ example: 1, description: 'ID вида искусства' })
    @ForeignKey(() => ArtType)
    @Column({ type: DataType.INTEGER, allowNull: false })
    art_type_id: number;

    // {
    //     onDelete: 'CASCADE'
    // }
    
    @BelongsTo(() => ArtType)
    artType: ArtType;
}