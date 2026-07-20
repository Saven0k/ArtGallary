// src/location/models/country.model.ts
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

  // ISO 3166-1 alpha-2 (RU, US, DE...)
  @Index({ unique: true })
  @Column({
    type: DataType.CHAR(2),
    allowNull: false,
    unique: true,
  })
  iso2: string;

  // ISO 3166-1 alpha-3 (RUS, USA, DEU...)
  @Column({
    type: DataType.CHAR(3),
    allowNull: true,
  })
  iso3: string;

  // Название на английском
  @Index
  @Column({
    type: DataType.STRING(100),
    allowNull: false,
  })
  name_en: string;

  // Название на русском (из GeoNames alternateNames)
  @Index
  @Column({
    type: DataType.STRING(100),
    allowNull: true,
  })
  name_ru: string;

  // GeoNames ID для дополнительных запросов при необходимости
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  geonames_id: number;

  // Код телефона (+7, +1...)
  @Column({
    type: DataType.STRING(20),
    allowNull: true,
  })
  phone_code: string;

  // Валюта (RUB, USD...)
  @Column({
    type: DataType.CHAR(3),
    allowNull: true,
  })
  currency: string;

  // Континент (EU, AS, NA...)
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

  // Хелпер: вернуть нужное название по языку
  getName(lang: 'ru' | 'en' = 'ru'): string {
    if (lang === 'ru') return this.name_ru || this.name_en;
    return this.name_en;
  }
}