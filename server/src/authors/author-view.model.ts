import { ApiProperty } from "@nestjs/swagger";
import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from "sequelize-typescript";
import { AuthorProfile } from "./author.model";
import { User } from "../users/users.model";
import { City } from "../location/models/city.model";
import { Country } from "../location/models/country.model";

@Table({ tableName: 'author_views' })
export class AuthorView extends Model<AuthorView> {
    @ApiProperty({ example: 1, description: 'ID просмотра' })
    @Column({ type: DataType.INTEGER, autoIncrement: true, primaryKey: true })
    id: number;

    @ApiProperty({ example: 1, description: 'ID автора' })
    @ForeignKey(() => AuthorProfile)
    @Column({ type: DataType.INTEGER, allowNull: false })
    author_id: number;

    @BelongsTo(() => AuthorProfile)
    author: AuthorProfile;

    @ApiProperty({ example: 1, description: 'ID пользователя (если авторизован)' })
    @ForeignKey(() => User)
    @Column({ type: DataType.INTEGER, allowNull: true })
    user_id: number;

    @BelongsTo(() => User)
    user: User;

    @ApiProperty({ example: 'M', description: 'Пол пользователя' })
    @Column({ type: DataType.STRING(1), allowNull: true })
    user_gender: string;

    @ApiProperty({ example: '25', description: 'Возраст пользователя' })
    @Column({ type: DataType.INTEGER, allowNull: true })
    user_age: number;

    @ApiProperty({ example: 1, description: 'ID города пользователя' })
    @ForeignKey(() => City)
    @Column({ type: DataType.INTEGER, allowNull: true })
    city_id: number;

    @BelongsTo(() => City)
    city: City;

    @ApiProperty({ example: 1, description: 'ID страны пользователя' })
    @ForeignKey(() => Country)
    @Column({ type: DataType.INTEGER, allowNull: true })
    country_id: number;

    @BelongsTo(() => Country)
    country: Country;

    @ApiProperty({ example: '192.168.1.1', description: 'IP адрес' })
    @Column({ type: DataType.STRING, allowNull: true })
    ip_address: string;

    @ApiProperty({ example: 'Mozilla/5.0...', description: 'User Agent' })
    @Column({ type: DataType.TEXT, allowNull: true })
    user_agent: string;

    @ApiProperty({ example: '2024-01-01T00:00:00.000Z', description: 'Дата просмотра' })
    @Column({ type: DataType.DATE, defaultValue: DataType.NOW })
    created_at: Date;

    // Индексы
    static indexes = [
        { fields: ['author_id', 'created_at'] },
        { fields: ['user_id'] },
        { fields: ['author_id', 'user_id'] },
    ];
}
