// src/auth/models/account-deletion-code.model.ts
import { Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { User } from '../../users/users.model';

@Table({
    tableName: 'account_deletion_codes',
    timestamps: false,
    indexes: [{ fields: ['user_id'] }, { fields: ['expires_at'] }],
})
export class AccountDeletionCode extends Model {
    @Column({ type: DataType.INTEGER, autoIncrement: true, primaryKey: true })
    id: number;

    @ForeignKey(() => User)
    @Column({ type: DataType.INTEGER, allowNull: false })
    user_id: number;

    @Column({ type: DataType.STRING, allowNull: false })
    code_hash: string;

    @Column({ type: DataType.DATE, allowNull: false })
    expires_at: Date;

    @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
    attempts: number;
}