// arts.model.ts
import { ApiProperty } from "@nestjs/swagger";
import { Column, DataType, HasOne, Model, Table, ForeignKey, BelongsTo, BelongsToMany } from "sequelize-typescript";
import { ArtistProfile } from "../artists/artist.model";
import { ExhibitionArt } from "../exhibitions/exhibition-art.model";
import { Exhibition } from "../exhibitions/exhibition.model";
import { Genre } from "../genres/genre.model";
import { Style } from "src/styles/styles.model";

export type CurrencyType = "USD" | "EUR" | "RUB" | "UAH" | null;
export interface ArtCreationAttrs {
    title: string,
    description: string,
    cost?: number | null,
    currency?: CurrencyType,
    image_path: string,
    likes?: number,
    views?: number,
    date_published: Date,
    artist_id?: number,
    city_id?: number,
    moderate: string,
    genre_id?: number,
    specifications: string,
    country_id?: number,
    style_id?: number,
    is_adult?: boolean,
}

@Table({ tableName: 'arts' })
export class Art extends Model<Art, ArtCreationAttrs> {

    @ApiProperty({ example: 'Мишки в лесу', description: 'Название объекта' })
    @Column({ type: DataType.STRING, allowNull: false })
    title: string;

    @ApiProperty({ example: 'Картина была нарисована в 1804 году', description: 'Описание картины' })
    @Column({ type: DataType.TEXT, allowNull: false })
    description: string;

    @ApiProperty({ example: '4500$', description: 'цена' })
    @Column({ type: DataType.FLOAT, allowNull: true })
    cost: number;

    @ApiProperty({ example: '$', description: 'Валюта' })
    @Column({ type: DataType.STRING, allowNull: true })
    currency: string | null;

    @ApiProperty({ example: '/backend/images/1.jpg', description: 'Путь к картинке на сервере' })
    @Column({ type: DataType.STRING })
    image_path: string;

    @ApiProperty({ example: '0', description: 'Количество лайков' })
    @Column({ type: DataType.INTEGER, defaultValue: 0 })
    likes: number;

    @ApiProperty({ example: '0', description: 'Количество просмотров' })
    @Column({ type: DataType.INTEGER, defaultValue: 0 })
    views: number;

    @ApiProperty({ example: '{"size": "120x120", "type": "jpg"}', description: 'MetaData values' })
    @Column({ type: DataType.TEXT })
    specifications: string;

    @ApiProperty({ example: '12.15.1941', description: 'Дата создания объекта' })
    @Column({ type: DataType.DATE, defaultValue: "2020-01-01" })
    date_published: Date;

    @ApiProperty({ example: '{}', description: 'Прошел ли объект модерацию' })
    @Column({ type: DataType.TEXT, allowNull: true })
    moderate: string;

    @ApiProperty({ example: '2', description: 'ID автора' })
    @ForeignKey(() => ArtistProfile)
    @Column({ type: DataType.INTEGER, allowNull: true })
    artist_id: number;

    @BelongsTo(() => ArtistProfile)
    artist: ArtistProfile;

    @ApiProperty({ example: false, description: 'Контент 18+' })
    @Column({ type: DataType.BOOLEAN, defaultValue: false })
    is_adult: boolean;

    @ApiProperty({ example: '3', description: 'ID города' })
    @Column({ type: DataType.INTEGER, allowNull: true })
    city_id: number;

    @ApiProperty({ example: '5', description: 'ID страны' })
    @Column({ type: DataType.INTEGER, allowNull: true })
    country_id: number;

    @ApiProperty({ example: '1', description: 'ID жанра' })
    @ForeignKey(() => Genre)
    @Column({ type: DataType.INTEGER, allowNull: true })
    genre_id: number;

    @BelongsTo(() => Genre)
    genre: Genre;

    @ApiProperty({ example: '1', description: 'ID стиля' })
    @ForeignKey(() => Style)
    @Column({ type: DataType.INTEGER, allowNull: true })
    style_id: number;

    @BelongsTo(() => Style)
    style: Style;

    @BelongsToMany(() => Exhibition, () => ExhibitionArt)
    exhibitions: Exhibition[];
}