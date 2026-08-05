import { ApiProperty } from "@nestjs/swagger";
import { BelongsTo, Column, DataType, ForeignKey, HasMany, HasOne, Model, Table } from "sequelize-typescript";
import { User } from "../users/users.model";
import { Art } from "../arts/arts.model";
import { Profession } from "src/professions/profession.model";
import { Subscription } from "src/subscriptions/subscription.model";
import { AuthorLike } from "./author-like.model";
import { AuthorView } from "./author-view.model";
import { AuthorFollow } from "./author-follow.model";

export interface AuthorCreationAttrs {
    user_id: number,
    biography: string,
    moderate: string,
    profession_id: number,
    is_deleted?: boolean;
    deleted_at?: Date | null;
}

@Table({ tableName: "author_profiles" })
export class AuthorProfile extends Model<AuthorProfile, AuthorCreationAttrs> {

    @ApiProperty({ example: '1', description: 'ID пользователя' })
    @ForeignKey(() => User)
    @Column({ type: DataType.INTEGER, unique: true, allowNull: false, primaryKey: true })
    user_id: number;

    @BelongsTo(() => User, {
        foreignKey: 'user_id',
        as: 'user'
    })
    user: User;

    @ApiProperty({ example: 'Биография автора...', description: 'Биография автора' })
    @Column({ type: DataType.TEXT('long'), allowNull: true })
    biography: string;

    @ApiProperty({ example: '{"moderate": false, "moderator_id": null, "errors": {}}', description: 'Статус модерации' })
    @Column({ type: DataType.TEXT, allowNull: true })
    moderate: string;

    @ApiProperty({ example: 1, description: 'ID профессии' })
    @ForeignKey(() => Profession)
    @Column({ type: DataType.INTEGER, allowNull: true })
    profession_id: number;

    @BelongsTo(() => Profession)
    profession: Profession;


    @ApiProperty({ example: false, description: 'Флаг удаления автора' })
    @Column({ type: DataType.BOOLEAN, defaultValue: false })
    is_deleted: boolean;

    @ApiProperty({ example: '2024-01-01T00:00:00.000Z', description: 'Дата удаления' })
    @Column({ type: DataType.DATE, allowNull: true })
    deleted_at: Date | null;

    @HasMany(() => Art)
    arts: Art[];

    @HasOne(() => Subscription, { foreignKey: 'artist_id' })
    subscription: Subscription;


    @HasMany(() => AuthorLike)
    likes: AuthorLike[];

    @HasMany(() => AuthorView)
    views: AuthorView[];

    @ApiProperty({ example: 0, description: 'Количество поделившихся' })
    @Column({ type: DataType.INTEGER, defaultValue: 0 })
    shares: number;

    @HasMany(() => AuthorFollow, { foreignKey: 'author_id' })
    followers: AuthorFollow[];
}
