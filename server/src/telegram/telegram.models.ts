import { Column, DataType, Index, Model, Table } from 'sequelize-typescript';
import { ModerationKind } from '../shared/helpers/moderation-revision';

@Table({ tableName: 'telegram_accounts', timestamps: false })
export class TelegramAccount extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    references: { model: 'users', key: 'id' },
    onDelete: 'CASCADE',
  })
  declare user_id: number;

  @Column({ type: DataType.STRING(20), unique: true })
  declare telegram_id: string | null;

  @Column({ type: DataType.STRING(64), unique: true })
  declare link_hash: string | null;

  @Column(DataType.DATE)
  declare link_expires_at: Date | null;

  @Column(DataType.INTEGER)
  declare pending_delivery_id: number | null;

  @Column(DataType.BOOLEAN)
  declare pending_approved: boolean | null;

  @Column(DataType.INTEGER)
  declare pending_prompt_id: number | null;

  @Column(DataType.DATE)
  declare pending_expires_at: Date | null;
}

@Table({ tableName: 'telegram_moderation_deliveries', timestamps: false })
export class TelegramDelivery extends Model {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  declare id: number;

  @Index({ name: 'telegram_delivery_revision', unique: true })
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    references: { model: 'telegram_accounts', key: 'user_id' },
    onDelete: 'CASCADE',
  })
  declare user_id: number;

  @Index({ name: 'telegram_delivery_revision', unique: true })
  @Column({ type: DataType.STRING(10), allowNull: false })
  declare kind: ModerationKind;

  @Index({ name: 'telegram_delivery_revision', unique: true })
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare entity_id: number;

  @Index({ name: 'telegram_delivery_revision', unique: true })
  @Column({ type: DataType.STRING(64), allowNull: false })
  declare revision: string;

  @Column(DataType.INTEGER)
  declare message_id: number | null;
}

@Table({ tableName: 'telegram_bot_state', timestamps: false })
export class TelegramBotState extends Model {
  @Column({ type: DataType.INTEGER, primaryKey: true })
  declare id: number;

  @Column({ type: DataType.BIGINT, allowNull: false, defaultValue: 0 })
  declare offset: string;
}
