// src/notifications/notification.service.ts
import { Injectable, HttpException, HttpStatus, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Notification, NotificationType, NotificationStatus } from './notification.model';
import { User } from '../users/users.model';
import { WINSTON_MODULE_PROVIDER, WinstonLogger } from 'nest-winston';
import { Op } from 'sequelize';

@Injectable()
export class NotificationService {
    constructor(
        @InjectModel(Notification) private notificationModel: typeof Notification,
        @InjectModel(User) private userModel: typeof User,
        @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: WinstonLogger,
    ) {}

    async createNotification(
        userId: number,
        type: NotificationType,
        message: string,
        link?: string,
        targetId?: number,
        metadata?: any,
    ) {
        const notification = await this.notificationModel.create({
            user_id: userId,
            type,
            message,
            link,
            target_id: targetId,
            metadata,
            status: NotificationStatus.UNREAD,
        });

        this.log('createNotification', { userId, type, message });
        return notification;
    }

    async getUserNotifications(userId: number, page: number = 1, limit: number = 20) {
        const user = await this.userModel.findByPk(userId);
        if (!user) {
            throw new HttpException('Пользователь не найден', HttpStatus.NOT_FOUND);
        }

        const offset = (page - 1) * limit;
        const { count, rows } = await this.notificationModel.findAndCountAll({
            where: { user_id: userId },
            order: [['created_at', 'DESC']],
            limit,
            offset,
        });

        return {
            data: rows,
            pagination: this.buildPagination(count, page, limit),
            unread_count: await this.getUnreadCount(userId),
        };
    }

    async markAsRead(notificationId: number, userId: number) {
        const notification = await this.notificationModel.findOne({
            where: { id: notificationId, user_id: userId }
        });

        if (!notification) {
            throw new HttpException('Уведомление не найдено', HttpStatus.NOT_FOUND);
        }

        await notification.update({ status: NotificationStatus.READ });
        return { success: true };
    }

    async markAllAsRead(userId: number) {
        await this.notificationModel.update(
            { status: NotificationStatus.READ },
            { where: { user_id: userId, status: NotificationStatus.UNREAD } }
        );
        return { success: true };
    }

    async getUnreadCount(userId: number) {
        return await this.notificationModel.count({
            where: { user_id: userId, status: NotificationStatus.UNREAD }
        });
    }

    private buildPagination(total: number, page: number, limit: number) {
        const totalPages = Math.ceil(total / limit);
        return {
            total,
            page,
            limit,
            totalPages,
            hasNextPage: page < totalPages,
            hasPreviousPage: page > 1,
        };
    }

    private log(method: string, data: any) {
        this.logger.log('info', JSON.stringify({
            message: `📋 ${method}`,
            context: 'NotificationService',
            ...data,
        }));
    }
}