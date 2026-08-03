// src/notifications/notification.module.ts
import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Notification } from './notification.model';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { User } from '../users/users.model';

@Module({
    imports: [SequelizeModule.forFeature([Notification, User])],
    controllers: [NotificationController],
    providers: [NotificationService],
    exports: [NotificationService],
})
export class NotificationModule {}