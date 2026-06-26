// exhibition.model.ts
import { ApiProperty } from "@nestjs/swagger";
import { BelongsTo, BelongsToMany, Column, DataType, ForeignKey, HasMany, Model, Table } from "sequelize-typescript";
import { Art } from "../arts/arts.model";
import { ExhibitionArt } from "./exhibition-art.model";
import { Genre } from "../genres/genre.model";
import { ArtistProfile } from "../artists/artist.model";
import { User } from "../users/users.model";
import { ExhibitionArtist } from "./exhibition-artist.model";

export type CurrencyType = "USD" | "EUR" | "RUB" | "UAH" | null;

export interface ExhibitionCreationAttrs {
    title: string;
    description: string;
    address: string;
    date: Date;
    cost: string;
    moderate?: string;
    currency?: CurrencyType;
    city_id?: number;
    country_id?: number;
    type_id?: number;
    image_path?: string | null;
    genre_id?: number;
    owner_id: number;
    likes?: number,
    views?: number,
}

@Table({ tableName: 'exhibitions' })
export class Exhibition extends Model<Exhibition, ExhibitionCreationAttrs> {
    @ApiProperty({ example: 'Выставка посвященная Репину', description: 'Название выставки' })
    @Column({ type: DataType.STRING, allowNull: false })
    title: string;

    @ApiProperty({ example: 'Выставка на которой будут находится картины известного художника Репина', description: 'Описание выставки' })
    @Column({ type: DataType.TEXT, allowNull: false })
    description: string;

    @ApiProperty({ example: '/path/to/image', description: 'Картинка выставки' })
    @Column({ type: DataType.STRING, allowNull: true })
    image_path: string;

    @ApiProperty({ example: 'Московский проспект д8 к2', description: 'Адрес выставки' })
    @Column({ type: DataType.STRING, allowNull: false })
    address: string;

    @ApiProperty({ example: '2025-06-15', description: 'Дата выставки' })
    @Column({ type: DataType.DATE, allowNull: false })
    date: Date;

    @ApiProperty({ example: '500р', description: 'Цена выставки' })
    @Column({ type: DataType.STRING, allowNull: false })
    cost: string;

    @ApiProperty({ example: '$', description: 'Валюта' })
    @Column({ type: DataType.STRING, allowNull: true })
    currency: string | null;

    @ApiProperty({ example: '5', description: 'Количество посетителей выставки' })
    @Column({ type: DataType.INTEGER, allowNull: true, defaultValue: 0 })
    visitors_count: number;

    @ApiProperty({ example: 1, description: 'ID владельца выставки (художника)' })
    @ForeignKey(() => ArtistProfile)
    @Column({ type: DataType.INTEGER, allowNull: false })
    owner_id: number;

    @BelongsTo(() => ArtistProfile, { foreignKey: 'owner_id' })
    owner: ArtistProfile;

    @ApiProperty({ example: '{"moderate": true, "moderator_id": 1, "errors": {"title": "Слишком длинное название"}, "moderated_at": "2025-01-01T00:00:00.000Z"}', description: 'Модерация выставки в формате JSON' })
    @Column({ type: DataType.TEXT, allowNull: true })
    moderate: string;

    @ApiProperty({ example: '5', description: 'ID города' })
    @Column({ type: DataType.INTEGER, allowNull: true })
    city_id: number;

    @ApiProperty({ example: '5', description: 'ID страны' })
    @Column({ type: DataType.INTEGER, allowNull: true })
    country_id: number;

    @ApiProperty({ example: '0', description: 'Количество лайков' })
    @Column({ type: DataType.INTEGER, defaultValue: 0 })
    likes: number;

    @ApiProperty({ example: '0', description: 'Количество просмотров' })
    @Column({ type: DataType.INTEGER, defaultValue: 0 })
    views: number;

    @ApiProperty({ example: '5', description: 'ID жанра выставки' })
    @ForeignKey(() => Genre)
    @Column({ type: DataType.INTEGER, allowNull: true })
    genre_id: number;

    @BelongsTo(() => Genre)
    genre: Genre;

    @BelongsToMany(() => ArtistProfile, () => ExhibitionArtist)
    artists: ArtistProfile[];

    @BelongsToMany(() => Art, () => ExhibitionArt)
    arts: Art[];
}