import { ApiProperty } from "@nestjs/swagger";
import { BelongsTo, BelongsToMany, Column, DataType, ForeignKey, HasMany, Model, Table } from "sequelize-typescript";
import { User } from "../users/users.model";
import { Exhibition } from "../exhibitions/exhibition.model";
import { ExhibitionArtist } from "../exhibitions/exhibition-artist.model";
import { Art } from "../arts/arts.model";

export type planTypes = 'free' | 'pro' | 'vip' ;

export type profession = "sculptor" | "painter" | "photographer" | "graphic" | "digital"

interface ArtistCreationAttrs {
    user_id: number,
    date_birthday: Date,
    biography: string,
    moderate: string,
    city_id?: number,
    country_id?: number,
    likes?: number,
    views?: number,
    plan: planTypes,
    planExpiresAt: Date | null,
    playStatus: boolean,
    profession: string
}

@Table({ tableName: "artist_profiles" })
export class ArtistProfile extends Model<ArtistProfile, ArtistCreationAttrs> {

    @ApiProperty({ example: '1', description: 'ID пользователя' })
    @ForeignKey(() => User)
    @Column({ type: DataType.INTEGER, unique: true, allowNull: false, primaryKey: true })
    user_id: number;

    @BelongsTo(() => User, {
        foreignKey: 'user_id',
        as: 'user'
    })
    user: User;

    @ApiProperty({ example: '12.12.1212', description: 'Дата рождения' })
    @Column({ type: DataType.DATE, allowNull: true })
    date_birthday: Date;

    @ApiProperty({ example: 'Биография артиста...', description: 'Биография артиста' })
    @Column({ type: DataType.TEXT('long'), allowNull: true })
    biography: string;

    @ApiProperty({ example: '{"moderate": false, "moderator_id": null, "errors": {}}', description: 'Статус модерации' })
    @Column({ type: DataType.TEXT, allowNull: true })
    moderate: string;

    @ApiProperty({ example: 'photographer', description: 'Вид професии артиста' })
    @Column({ type: DataType.TEXT})
    profession: string;

    @ApiProperty({ example: 'free', description: 'План подписки' })
    @Column({ type: DataType.TEXT, defaultValue: 'free' })
    plan: string;

    @ApiProperty({ example: '20.12.2027', description: 'До какого момента действует подписка' })
    @Column({ type: DataType.DATE, allowNull: true, defaultValue: null })
    planExpiresAt: Date;
    
    @ApiProperty({ example: '12.12.1212', description: 'Статус подписки: активна/неактивна' })
    @Column({ type: DataType.BOOLEAN, defaultValue: false })
    playStatus: boolean;
    
    @ApiProperty({ example: '1', description: 'ID города' })
    @Column({ type: DataType.INTEGER })
    city_id: number;
    
    @ApiProperty({ example: '1', description: 'ID страны' })
    @Column({ type: DataType.INTEGER })
    country_id: number;
    
    @ApiProperty({ example: '0', description: 'Количество лайков' })
    @Column({ type: DataType.INTEGER, defaultValue: 0 })
    likes: number;
    
    @ApiProperty({ example: '0', description: 'Количество просмотров' })
    @Column({ type: DataType.INTEGER, defaultValue: 0 })
    views: number;

    @HasMany(() => Art)
    arts: Art[];

    @BelongsToMany(() => Exhibition, () => ExhibitionArtist)
    exhibitions: Exhibition[];
}