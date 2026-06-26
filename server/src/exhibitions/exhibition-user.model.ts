import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from "sequelize-typescript";
import { Exhibition } from "./exhibition.model";
import { User } from "../users/users.model";

@Table({ tableName: 'exhibition_users', createdAt: false, updatedAt: false })
export class ExhibitionUser extends Model<ExhibitionUser> {
    @ForeignKey(() => Exhibition)
    @Column({ type: DataType.INTEGER, allowNull: false })
    exhibition_id: number;

    @ForeignKey(() => User)
    @Column({ type: DataType.INTEGER, allowNull: false })
    user_id: number;

    @BelongsTo(() => Exhibition)
    exhibition: Exhibition;

    @BelongsTo(() => User)
    user: User;
}