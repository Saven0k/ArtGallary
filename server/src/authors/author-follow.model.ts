import { ApiProperty } from "@nestjs/swagger";
import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from "sequelize-typescript";
import { User } from "../users/users.model";
import { AuthorProfile } from "./author.model";

@Table({
    tableName: 'author_follows',
    indexes: [
        { fields: ['user_id', 'author_id'], unique: true },
        { fields: ['author_id', 'created_at'] },
        { fields: ['user_id', 'created_at'] },
    ]
})
export class AuthorFollow extends Model<AuthorFollow> {
    @ApiProperty({ example: 1, description: 'ID подписки' })
    @Column({ type: DataType.INTEGER, autoIncrement: true, primaryKey: true })
    id: number;

    @ApiProperty({ example: 1, description: 'ID пользователя' })
    @ForeignKey(() => User)
    @Column({ type: DataType.INTEGER, allowNull: false })
    user_id: number;

    @BelongsTo(() => User)
    user: User;

    @ApiProperty({ example: 1, description: 'ID автора' })
    @ForeignKey(() => AuthorProfile)
    @Column({ type: DataType.INTEGER, allowNull: false })
    author_id: number;

    @BelongsTo(() => AuthorProfile)
    author: AuthorProfile;
    

    @ApiProperty({ example: '2024-01-01T00:00:00.000Z', description: 'Дата подписки' })
    @Column({ type: DataType.DATE, defaultValue: DataType.NOW })
    created_at: Date;
}