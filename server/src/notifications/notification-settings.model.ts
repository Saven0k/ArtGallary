import {
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { User } from '../users/users.model';

@Table({ tableName: 'notification_settings', timestamps: false })
export class NotificationSettings extends Model<NotificationSettings> {
  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, primaryKey: true })
  user_id: number;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  email_enabled: boolean;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  push_enabled: boolean;

  @Column({ type: DataType.STRING, allowNull: false, defaultValue: 'ru' })
  language: 'ru' | 'en' | 'zh';

  @Column({ type: DataType.DATE, allowNull: true })
  last_test_at: Date | null;
}
