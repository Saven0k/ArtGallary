import { ApiProperty } from "@nestjs/swagger";
import { Column, DataType, Model, Table, ForeignKey, BelongsTo } from "sequelize-typescript";
import { Art } from "./arts.model";
import { User } from "../users/users.model";

@Table({ tableName: 'art_views' })
export class ArtView extends Model<ArtView> {
    @ApiProperty({ example: 1, description: 'ID просмотра' })
    @Column({
        type: DataType.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    })
    id: number;

    @ApiProperty({ example: 1, description: 'ID произведения' })
    @ForeignKey(() => Art)
    @Column({ type: DataType.INTEGER, allowNull: false })
    art_id: number;

    @BelongsTo(() => Art)
    art: Art;

    @ApiProperty({ example: 1, description: 'ID пользователя' })
    @ForeignKey(() => User)
    @Column({ type: DataType.INTEGER, allowNull: false })
    user_id: number;

    @BelongsTo(() => User)
    user: User;

    @ApiProperty({ example: '2024-01-01T00:00:00.000Z', description: 'Время просмотра' })
    @Column({ type: DataType.DATE, defaultValue: DataType.NOW })
    viewed_at: Date;
}