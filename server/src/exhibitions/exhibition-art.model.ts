import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from "sequelize-typescript";
import { Exhibition } from "./exhibition.model";
import { Art } from "../arts/arts.model";

@Table({ tableName: 'exhibition_arts', createdAt: false, updatedAt: false })
export class ExhibitionArt extends Model<ExhibitionArt> {
    @ForeignKey(() => Exhibition)
    @Column({ type: DataType.INTEGER, allowNull: false })
    exhibition_id: number;

    @ForeignKey(() => Art)
    @Column({ type: DataType.INTEGER, allowNull: false })
    art_id: number;

    @BelongsTo(() => Exhibition)
    exhibition: Exhibition;

    @BelongsTo(() => Art)
    art: Art;
}