import { ApiProperty } from "@nestjs/swagger";
import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from "sequelize-typescript";
import { User } from "../users/users.model";

interface ModeratorCreationAttrs {
    user_id: number;
    assigned_by: number;
}

@Table({ tableName: 'moderators', timestamps: true })
export class Moderator extends Model<Moderator, ModeratorCreationAttrs> {
    @ApiProperty({ example: 1, description: 'ID модератора' })
    @Column({ type: DataType.INTEGER, autoIncrement: true, primaryKey: true })
    id: number;

    @ApiProperty({ example: 1, description: 'ID пользователя' })
    @ForeignKey(() => User)
    @Column({ type: DataType.INTEGER, unique: true, allowNull: false })
    user_id: number;

    @BelongsTo(() => User)
    user: User;

    @ApiProperty({ example: 1, description: 'ID администратора, назначившего модератора' })
    @Column({ type: DataType.INTEGER, allowNull: true })
    assigned_by: number;
}