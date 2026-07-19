import { Column, DataType, ForeignKey, Model, Table } from "sequelize-typescript";
import { Art } from "../arts/arts.model";
import { Tag } from "./tag.model";

@Table({ tableName: 'art_tags' })
export class ArtTag extends Model<ArtTag> {
    @ForeignKey(() => Art)
    @Column({ type: DataType.INTEGER, allowNull: false })
    art_id: number;

    @ForeignKey(() => Tag)
    @Column({ type: DataType.INTEGER, allowNull: false })
    tag_id: number;
}