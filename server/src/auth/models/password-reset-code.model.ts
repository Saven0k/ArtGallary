// src/auth/models/password-reset-code.model.ts
import { Column, DataType, ForeignKey, Model, Table, BelongsTo } from 'sequelize-typescript';
import { User } from '../../users/users.model';

@Table({
    tableName: 'password_reset_codes',
    timestamps: false,
    indexes: [{ fields: ['user_id'] }, { fields: ['expires_at'] }],
})
export class PasswordResetCode extends Model {
    @Column({ type: DataType.INTEGER, autoIncrement: true, primaryKey: true })
    id: number;

    @ForeignKey(() => User)
    @Column({ type: DataType.INTEGER, allowNull: false })
    user_id: number;

    @BelongsTo(() => User, { foreignKey: 'user_id' })
    user: User;

    @Column({ type: DataType.STRING, allowNull: false })
    code_hash: string;

    @Column({ type: DataType.DATE, allowNull: false })
    expires_at: Date;

    @Column({ type: DataType.INTEGER, defaultValue: 0 })
    attempts: number;
}