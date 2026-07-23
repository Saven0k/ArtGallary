import {
  Table,
  Column,
  Model,
  DataType,
  BelongsTo,
  ForeignKey,
  Index,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';
import { Country } from './country.model';

@Table({
  tableName: 'cities',
  timestamps: true,
})
export class City extends Model {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number;

  @Index({ unique: true })
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    unique: true,
  })
  geonames_id: number;

  @Index
  @Column({
    type: DataType.STRING(200),
    allowNull: false,
  })
  name_en: string;

  @Index
  @Column({
    type: DataType.STRING(200),
    allowNull: true,
  })
  name_ru: string;

  @ForeignKey(() => Country)
  @Index
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  country_id: number;

  @BelongsTo(() => Country)
  country: Country;

  @Index
  @Column({
    type: DataType.CHAR(2),
    allowNull: false,
  })
  country_code: string;

  @Column({
    type: DataType.STRING(200),
    allowNull: true,
  })
  region: string;

  @Column({
    type: DataType.DECIMAL(9, 6),
    allowNull: true,
  })
  latitude: number;

  @Column({
    type: DataType.DECIMAL(9, 6),
    allowNull: true,
  })
  longitude: number;

  @Index
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    defaultValue: 0,
  })
  population: number;

  @Column({
    type: DataType.STRING(50),
    allowNull: true,
  })
  timezone: string;

  @CreatedAt
  created_at: Date;

  @UpdatedAt
  updated_at: Date;

  getName(lang: 'ru' | 'en' = 'ru'): string {
    if (lang === 'ru') return this.name_ru || this.name_en;
    return this.name_en;
  }
}