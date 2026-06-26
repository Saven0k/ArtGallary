import {
    Table,
    Column,
    Model,
    DataType,
    ForeignKey,
    BelongsTo,
    CreatedAt,
    Index,
} from 'sequelize-typescript';
import { User } from '../../users/users.model';

@Table({
    tableName: 'refresh_tokens',
    timestamps: true,
    updatedAt: false,
})
export class RefreshToken extends Model {

    @Column({
        type: DataType.UUID,
        defaultValue: DataType.UUIDV4,
        primaryKey: true
    })
    declare id: string;

    @ForeignKey(() => User)
    @Index
    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        onDelete: 'CASCADE',
    })
    userId: number;

    @BelongsTo(() => User)
    user: User;

    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
    tokenHash: string;

    @Column({
        type: DataType.STRING,
        allowNull: true,
    })
    userAgent: string | null;

    @Column({
        type: DataType.STRING,
        allowNull: true,
    })
    ip: string | null;

    @Column({
        type: DataType.DATE,
        allowNull: false,
    })
    expiresAt: Date;
}