import {
  Table,
  Column,
  Model,
  DataType,
  HasMany,
  Index,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';
import { City } from './city.model';

@Table({
  tableName: 'countries',
  timestamps: true,
})
export class Country extends Model {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number;

  @Index({ unique: true })
  @Column({
    type: DataType.CHAR(2),
    allowNull: false,
    unique: true,
  })
  iso2: string;

  @Column({
    type: DataType.CHAR(3),
    allowNull: true,
  })
  iso3: string;

  @Index
  @Column({
    type: DataType.STRING(100),
    allowNull: false,
  })
  name_en: string;

  @Index
  @Column({
    type: DataType.STRING(100),
    allowNull: true,
  })
  name_ru: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  geonames_id: number;

  @Column({
    type: DataType.STRING(20),
    allowNull: true,
  })
  phone_code: string;

  @Column({
    type: DataType.CHAR(3),
    allowNull: true,
  })
  currency: string;

  @Column({
    type: DataType.CHAR(2),
    allowNull: true,
  })
  continent: string;

  @HasMany(() => City)
  cities: City[];

  @CreatedAt
  created_at: Date;

  @UpdatedAt
  updated_at: Date;

  getName(lang: 'ru' | 'en' = 'ru'): string {
    if (lang === 'ru') return this.name_ru || this.name_en;
    return this.name_en;
  }
}