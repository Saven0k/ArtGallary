import { Column, DataType, Model, Table } from 'sequelize-typescript';

interface PromoCodeCreationAttrs {
  code: string;
  percent: number;
  expiresAt: Date | null;
}

@Table({ tableName: 'promo_codes', timestamps: true })
export class PromoCode extends Model<PromoCode, PromoCodeCreationAttrs> {
  declare id: number;

  @Column({ type: DataType.STRING(32), allowNull: false, unique: true })
  code: string;

  @Column({ type: DataType.INTEGER, allowNull: false })
  percent: number;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: true })
  active: boolean;

  @Column({ type: DataType.DATE, allowNull: true })
  expiresAt: Date | null;

  declare createdAt: Date;
}
