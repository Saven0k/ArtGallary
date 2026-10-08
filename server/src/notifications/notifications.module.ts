import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Notification } from './notification.model';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { User } from '../users/users.model';
import { NotificationSettings } from './notification-settings.model';
import { BrowserPushSubscription } from './push-subscription.model';
import { MailModule } from '../mail/mail.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    SequelizeModule.forFeature([
      Notification,
      User,
      NotificationSettings,
      BrowserPushSubscription,
    ]),
    MailModule,
    ScheduleModule.forRoot({ cronJobs: false }),
  ],
  controllers: [NotificationController],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationModule {}
