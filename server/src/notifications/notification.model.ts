// src/notifications/notification.model.ts
import { ApiProperty } from "@nestjs/swagger";
import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from "sequelize-typescript";
import { User } from "../users/users.model";

export enum NotificationType {
    ART_LIKE = 'art_like',
    AUTHOR_LIKE = 'author_like',
    NEW_FOLLOWER = 'new_follower',
    NEW_ART = 'new_art',
}

export enum NotificationStatus {
    UNREAD = 'unread',
    READ = 'read',
}

@Table({
    tableName: 'notifications',
    indexes: [
        { fields: ['user_id', 'created_at'] },
        { fields: ['user_id', 'status'] },
    ]
})
export class Notification extends Model<Notification> {
    @ApiProperty({ example: 1, description: 'ID уведомления' })
    @Column({ type: DataType.INTEGER, autoIncrement: true, primaryKey: true })
    id: number;

    @ApiProperty({ example: 1, description: 'ID пользователя' })
    @ForeignKey(() => User)
    @Column({ type: DataType.INTEGER, allowNull: false })
    user_id: number;

    @BelongsTo(() => User)
    user: User;

    @ApiProperty({ enum: NotificationType, example: 'art_like' })
    @Column({ type: DataType.ENUM(...Object.values(NotificationType)), allowNull: false })
    type: NotificationType;

    @ApiProperty({ example: 'Михаил Гаганов оценил вашу картину "Лилии"' })
    @Column({ type: DataType.TEXT, allowNull: false })
    message: string;

    @ApiProperty({ example: '/arts/1' })
    @Column({ type: DataType.STRING, allowNull: true })
    link: string;

    @ApiProperty({ example: 1 })
    @Column({ type: DataType.INTEGER, allowNull: true })
    target_id: number;

    @ApiProperty({ enum: NotificationStatus, example: 'unread' })
    @Column({ type: DataType.ENUM(...Object.values(NotificationStatus)), defaultValue: NotificationStatus.UNREAD })
    status: NotificationStatus;

    @ApiProperty({ example: { author_id: 1, art_id: 2 } })
    @Column({ type: DataType.JSON, allowNull: true })
    metadata: any;

    @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
    @Column({ type: DataType.DATE, defaultValue: DataType.NOW })
    created_at: Date;
}