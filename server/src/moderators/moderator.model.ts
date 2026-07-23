import { ApiProperty } from "@nestjs/swagger";
import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from "sequelize-typescript";
import { User } from "../users/users.model";

interface ModeratorCreationAttrs {
    user_id: number;
    assigned_by: number;
}

@Table({ tableName: 'moderators', timestamps: true })
export class Moderator extends Model<Moderator, ModeratorCreationAttrs> {
 
    @ApiProperty({ example: 1 })
    @Column({ type: DataType.INTEGER, autoIncrement: true, primaryKey: true })
    id: number;
 
    @ApiProperty({ example: 1, description: 'ID пользователя' })
    @ForeignKey(() => User)
    @Column({ type: DataType.INTEGER, unique: true, allowNull: false })
    user_id: number;
 
    // ✅ Связь — include: [{ model: User }] даст полные данные пользователя
    @BelongsTo(() => User, { foreignKey: 'user_id', as: 'user' })
    user: User;
 
    @ApiProperty({ example: 1, description: 'ID админа, назначившего модератора' })
    @Column({ type: DataType.INTEGER, allowNull: true })
    assigned_by: number | null;
}