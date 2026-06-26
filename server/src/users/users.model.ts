import { ApiProperty } from "@nestjs/swagger";
import { Column, DataType, HasOne, Model, Table } from "sequelize-typescript";
import { ArtistProfile } from "../artists/artist.model";

interface UserCreationAttrs {
    email: string,
    password: string,
    surname: string,
    name: string,
    phone_number: string,
    avatar_path?: string;
    second_name: string,
    role: "admin" | "moderator" | "artist" | "user"
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
    @Column({ type: DataType.STRING, allowNull: true })
    second_name: string;

    @ApiProperty({ example: '+79999999999', description: 'Номер телефона пользователя' })
    @Column({ type: DataType.STRING, allowNull: false })
    phone_number: string;

    @ApiProperty({ example: 'server/images/1.jpg', description: 'Путь к аватарке на сервере' })
    @Column({ type: DataType.STRING, allowNull: true })
    avatar_path?: string | null;

    @ApiProperty({ example: 'Админ', description: 'Роль пользователя' })
    @Column({ type: DataType.ENUM('admin', 'visitor', 'moderator', 'artist', 'user'), allowNull: false })
    role: string;

    @HasOne(() => ArtistProfile, { foreignKey: 'user_id', as: 'artistProfile' })
    artistProfile: ArtistProfile;
    
}

