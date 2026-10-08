import {
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { User } from '../users/users.model';

@Table({
  tableName: 'push_subscriptions',
  timestamps: false,
  indexes: [{ fields: ['user_id'] }],
})
export class BrowserPushSubscription extends Model<BrowserPushSubscription> {
  @Column({ type: DataType.STRING(64), primaryKey: true })
  id: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false })
  user_id: number;

  @Column({ type: DataType.TEXT, allowNull: false })
  endpoint: string;

  @Column({ type: DataType.STRING(88), allowNull: false })
  p256dh: string;

  @Column({ type: DataType.STRING(24), allowNull: false })
  auth: string;
}
