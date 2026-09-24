// src/auth/models/email-change-code.model.ts
import { Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { User } from '../../users/users.model';

@Table({
    tableName: 'email_change_codes',
    timestamps: false,
    indexes: [
        { fields: ['user_id'] },
        { fields: ['expires_at'] },
    ],
})
export class EmailChangeCode extends Model {
    @Column({ type: DataType.INTEGER, autoIncrement: true, primaryKey: true })
    id: number;

    @ForeignKey(() => User)
    @Column({ type: DataType.INTEGER, allowNull: false })
    user_id: number;

    /** Email, на который ушёл код (новый) */
    @Column({ type: DataType.STRING, allowNull: false })
    new_email: string;

    /** bcrypt-хэш 6-значного кода */
    @Column({ type: DataType.STRING, allowNull: false })
    code_hash: string;

    @Column({ type: DataType.DATE, allowNull: false })
    expires_at: Date;

    /** Счётчик неудачных попыток ввода */
    @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
    attempts: number;
}