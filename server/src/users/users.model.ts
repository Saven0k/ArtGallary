import { ApiProperty } from "@nestjs/swagger";
import { BelongsTo, Column, DataType, ForeignKey, HasOne, Model, Table } from "sequelize-typescript";
import { ArtistProfile } from "../artists/artist.model";
import { Country } from "src/location/models/country.model";
import { City } from "src/location/models/city.model";

export type Gender = "M" | "F";

export interface UserCreationAttrs {
    email: string,
    password: string,
    surname: string,
    name: string,
    second_name: string,
    phone_number: string,
    avatar_path: string;
    role: "user" | "artist" | "moderator" | "admin",
    gender: Gender,
    is_deleted?: boolean;
    deleted_at?: Date | null;
    city_id?: number | null;
    country_id?: number | null;
}

@Table({ tableName: 'users' })
export class User extends Model<User, UserCreationAttrs> {
    @ApiProperty({ example: 'email@email.ru', description: 'Уникальный почтовый адрес ' })
    @Column({ type: DataType.STRING, unique: true, allowNull: false })
    email: string;

    @ApiProperty({ example: '12312312312', description: 'Пароль пользователя' })
    @Column({ type: DataType.STRING, allowNull: false })
    password: string;

    @ApiProperty({ example: 'Иван', description: 'Имя пользователя' })
    @Column({ type: DataType.STRING, allowNull: false })
    name: string;

    @ApiProperty({ example: 'Петров', description: 'Фамилия пользователя' })
    @Column({ type: DataType.STRING, allowNull: false })
    surname: string;

    @ApiProperty({ example: 'Иванов', description: 'Отчество пользователя' })
    @Column({ type: DataType.STRING, allowNull: false })
    second_name: string;

    @ApiProperty({ example: '+79999999999', description: 'Номер телефона пользователя' })
    @Column({ type: DataType.STRING, allowNull: false })
    phone_number: string;

    @ApiProperty({ example: 'server/images/1.jpg', description: 'Путь к аватарке на сервере' })
    @Column({ type: DataType.STRING, allowNull: false })
    avatar_path: string;

    @ApiProperty({ example: 'Админ', description: 'Роль пользователя' })
    @Column({ type: DataType.ENUM('admin', 'visitor', 'moderator', 'artist', 'user'), allowNull: false })
    role: string;

    @ApiProperty({ example: 'F', description: 'Женский пол' })
    @Column({ type: DataType.ENUM('M', 'F'), allowNull: false })
    gender: Gender;

    @ApiProperty({ example: false, description: 'Флаг удаления пользователя' })
    @Column({ type: DataType.BOOLEAN, defaultValue: false })
    is_deleted: boolean;

    @ApiProperty({ example: '2024-01-01T00:00:00.000Z', description: 'Дата удаления' })
    @Column({ type: DataType.DATE, allowNull: true })
    deleted_at: Date | null;

    @ApiProperty({ example: 1, description: 'ID страны из таблицы countries' })
    @ForeignKey(() => Country)
    @Column({ type: DataType.INTEGER, allowNull: true })
    country_id: number | null;
 
    @BelongsTo(() => Country)
    country: Country;
 
    @ApiProperty({ example: 42, description: 'ID города из таблицы cities' })
    @ForeignKey(() => City)
    @Column({ type: DataType.INTEGER, allowNull: true })
    city_id: number | null;
 
    @BelongsTo(() => City)
    city: City;

    @HasOne(() => ArtistProfile, { foreignKey: 'user_id', as: 'artistProfile' })
    artistProfile: ArtistProfile;
}