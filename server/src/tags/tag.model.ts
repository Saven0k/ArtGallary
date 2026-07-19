import { ApiProperty } from "@nestjs/swagger";
import { Column, DataType, Model, Table, BelongsToMany } from "sequelize-typescript";
import { Art } from "../arts/arts.model";
import { ArtTag } from "./art-tag.model";

interface TagCreationAttrs {
    name: string;
}

@Table({ tableName: 'tags' })
export class Tag extends Model<Tag, TagCreationAttrs> {
    @ApiProperty({ example: 1, description: 'ID тега' })
    @Column({
        type: DataType.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    })
    id: number;

    @ApiProperty({ example: 'пейзаж', description: 'Название тега' })
    @Column({ type: DataType.STRING, unique: true, allowNull: false })
    name: string;

    @ApiProperty({ example: 10, description: 'Количество использований' })
    @Column({ type: DataType.INTEGER, defaultValue: 0 })
    usage_count: number;

    @BelongsToMany(() => Art, () => ArtTag)
    arts: Art[];
}