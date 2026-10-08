import {
  Injectable,
  HttpException,
  HttpStatus,
  Inject,
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import {
  Notification,
  NotificationType,
  NotificationStatus,
} from './notification.model';
import { User } from '../users/users.model';
import { WINSTON_MODULE_PROVIDER, WinstonLogger } from 'nest-winston';
import { ConfigService } from '@nestjs/config';
import { Interval } from '@nestjs/schedule';
import { createHash } from 'node:crypto';
import { Op, Transaction } from 'sequelize';
import * as webPush from 'web-push';
import { MailService } from '../mail/mail.service';
import { NotificationSettings } from './notification-settings.model';
import { BrowserPushSubscription } from './push-subscription.model';
import {
  NotificationSettingsDto,
  PushSubscriptionDto,
} from './notification-settings.dto';
import { notificationContent, notificationCopy } from './notification-content';

@Injectable()
export class NotificationService {
  private delivering = false;

  constructor(
    @InjectModel(Notification) private notificationModel: typeof Notification,
    @InjectModel(User) private userModel: typeof User,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: WinstonLogger,
    @InjectModel(NotificationSettings)
    private settingsModel: typeof NotificationSettings,
    @InjectModel(BrowserPushSubscription)
    private pushModel: typeof BrowserPushSubscription,
    private mail: MailService,
    private config: ConfigService,
  ) {}

  async createNotification(
    userId: number,
    type: NotificationType,
    message: string,
    link?: string,
    targetId?: number,
    metadata?: any,
    transaction?: Transaction,
  ) {
    const notification = await this.notificationModel.create(
      {
        user_id: userId,
        type,
        message,
        link,
        target_id: targetId,
        metadata,
        status: NotificationStatus.UNREAD,
        delivery_status: 'pending',
      },
      { transaction },
    );

    this.log('createNotification', { userId, type, message });
    setImmediate(
      () =>
        void this.deliverPending().catch(() => {
          this.logger.warn('Notification delivery unavailable');
        }),
    );
    return notification;
  }

  get pushConfigured(): boolean {
    const publicKey = this.config.get<string>('VAPID_PUBLIC_KEY', '');
    const privateKey = this.config.get<string>('VAPID_PRIVATE_KEY', '');
    const subject = this.config.get<string>('VAPID_SUBJECT', '');
    return (
      Buffer.from(publicKey, 'base64url').length === 65 &&
      Buffer.from(privateKey, 'base64url').length === 32 &&
      /^(mailto:|https:\/\/)/.test(subject)
    );
  }

  async getSettings(userId: number) {
    const settings = await this.settingsModel.findByPk(userId);
    return {
      emailEnabled: settings?.email_enabled ?? false,
      pushEnabled: settings?.push_enabled ?? false,
      language: settings?.language ?? 'ru',
      mailConfigured: this.mail.isConfigured,
      pushConfigured: this.pushConfigured,
      vapidPublicKey: this.pushConfigured
        ? this.config.get<string>('VAPID_PUBLIC_KEY')
        : null,
    };
  }

  async updateSettings(userId: number, dto: NotificationSettingsDto) {
    if (dto.emailEnabled && !this.mail.isConfigured)
      throw new ServiceUnavailableException('Почта не подключена');
    if (dto.pushEnabled && !this.pushConfigured)
      throw new ServiceUnavailableException('Push-уведомления не подключены');
    const [settings] = await this.settingsModel.findOrCreate({
      where: { user_id: userId },
      defaults: { user_id: userId },
    });
    await settings.update({
      ...(dto.emailEnabled !== undefined && {
        email_enabled: dto.emailEnabled,
      }),
      ...(dto.pushEnabled !== undefined && { push_enabled: dto.pushEnabled }),
      ...(dto.language && { language: dto.language }),
    });
    if (dto.pushEnabled === false)
      await this.pushModel.destroy({ where: { user_id: userId } });
    return this.getSettings(userId);
  }

  async subscribePush(userId: number, dto: PushSubscriptionDto) {
    if (!this.pushConfigured)
      throw new ServiceUnavailableException('Push-уведомления не подключены');
    const url = new URL(dto.endpoint);
    const host = url.hostname;
    const allowed =
      host === 'fcm.googleapis.com' ||
      host === 'updates.push.services.mozilla.com' ||
      host.endsWith('.push.apple.com') ||
      host.endsWith('.notify.windows.com');
    if (
      !allowed ||
      url.protocol !== 'https:' ||
      url.username ||
      url.password ||
      (url.port && url.port !== '443')
    )
      throw new BadRequestException('Некорректный адрес push-сервиса');
    const key = Buffer.from(dto.keys.p256dh, 'base64url');
    if (
      key.length !== 65 ||
      key[0] !== 4 ||
      Buffer.from(dto.keys.auth, 'base64url').length !== 16
    )
      throw new BadRequestException('Некорректные ключи подписки');
    await this.pushModel.upsert({
      id: this.endpointId(dto.endpoint),
      user_id: userId,
      endpoint: dto.endpoint,
      p256dh: dto.keys.p256dh,
      auth: dto.keys.auth,
    });
    return { success: true };
  }

  async unsubscribePush(userId: number, endpoint: string) {
    await this.pushModel.destroy({
      where: { id: this.endpointId(endpoint), user_id: userId },
    });
    return { success: true };
  }

  async testNotification(userId: number, channel: 'email' | 'push') {
    const user = await this.userModel.findByPk(userId, {
      attributes: ['id', 'email', 'is_deleted'],
    });
    if (!user || user.is_deleted)
      throw new HttpException('Пользователь не найден', 404);
    const [settings] = await this.settingsModel.findOrCreate({
      where: { user_id: userId },
      defaults: { user_id: userId },
    });
    if (
      channel === 'email' &&
      (!settings.email_enabled || !this.mail.isConfigured)
    )
      throw new BadRequestException('Сначала включите email-уведомления');
    if (channel === 'push' && (!settings.push_enabled || !this.pushConfigured))
      throw new BadRequestException('Сначала включите push-уведомления');
    const [updated] = await this.settingsModel.update(
      { last_test_at: new Date() },
      {
        where: {
          user_id: userId,
          [Op.or]: [
            { last_test_at: null },
            { last_test_at: { [Op.lt]: new Date(Date.now() - 60000) } },
          ],
        },
      },
    );
    if (!updated)
      throw new HttpException('Повторите проверку через минуту', 429);
    const copy = notificationCopy[settings.language];
    if (channel === 'email')
      await this.mail.sendNotification(
        user.email,
        copy.testTitle,
        copy.testBody,
        '/settings',
        settings.language,
      );
    else if (
      !(await this.sendPush(userId, {
        title: copy.testTitle,
        body: copy.testBody,
        open: copy.open,
        url: '/settings',
        tag: 'gallery-test',
      }))
    )
      throw new BadRequestException('Нет активной подписки браузера');
    return { success: true };
  }

  private endpointId(endpoint: string) {
    return createHash('sha256').update(endpoint).digest('hex');
  }

  private async sendPush(
    userId: number,
    payload: {
      title: string;
      body: string;
      open: string;
      url?: string;
      tag: string;
    },
    transaction?: Transaction,
  ) {
    if (!this.pushConfigured)
      throw new ServiceUnavailableException('Push-уведомления не подключены');
    const subscriptions = await this.pushModel.findAll({
      where: { user_id: userId },
      transaction,
    });
    let sent = 0;
    let failure: unknown;
    for (const subscription of subscriptions) {
      try {
        await webPush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: { p256dh: subscription.p256dh, auth: subscription.auth },
          },
          JSON.stringify({ ...payload, body: payload.body.slice(0, 350) }),
          {
            TTL: 3600,
            timeout: 5000,
            vapidDetails: {
              subject: this.config.getOrThrow<string>('VAPID_SUBJECT'),
              publicKey: this.config.getOrThrow<string>('VAPID_PUBLIC_KEY'),
              privateKey: this.config.getOrThrow<string>('VAPID_PRIVATE_KEY'),
            },
          },
        );
        sent++;
      } catch (error) {
        const status = (error as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410)
          await subscription.destroy({ transaction });
        else failure = error;
      }
    }
    if (failure)
      throw new ServiceUnavailableException('Push-сервис недоступен');
    return sent;
  }

  @Interval(10000)
  async deliverPending() {
    if (this.delivering) return;
    this.delivering = true;
    try {
      const pending = await this.notificationModel.findAll({
        where: { delivery_status: 'pending' },
        attributes: ['id'],
        order: [['created_at', 'ASC']],
        limit: 5,
      });
      for (const item of pending) {
        await this.notificationModel.sequelize.transaction(
          async (transaction) => {
            const notification = await this.notificationModel.findOne({
              where: { id: item.id, delivery_status: 'pending' },
              transaction,
              lock: transaction.LOCK.UPDATE,
              skipLocked: true,
            });
            if (!notification) return;
            try {
              const settings = await this.settingsModel.findByPk(
                notification.user_id,
                { transaction },
              );
              const user = await this.userModel.findByPk(notification.user_id, {
                attributes: ['id', 'email', 'is_deleted'],
                transaction,
              });
              if (settings && user && !user.is_deleted) {
                let failed = false;
                const content = notificationContent(
                  notification,
                  settings.language,
                );
                if (settings.email_enabled && !notification.email_sent_at) {
                  try {
                    await this.mail.sendNotification(
                      user.email,
                      content.title,
                      content.body,
                      notification.link,
                      settings.language,
                    );
                    await notification.update(
                      { email_sent_at: new Date() },
                      { transaction },
                    );
                  } catch {
                    failed = true;
                  }
                }
                if (settings.push_enabled && !notification.push_sent_at) {
                  try {
                    await this.sendPush(
                      user.id,
                      {
                        ...content,
                        url: notification.link,
                        tag: `gallery-${notification.id}`,
                      },
                      transaction,
                    );
                    await notification.update(
                      { push_sent_at: new Date() },
                      { transaction },
                    );
                  } catch {
                    failed = true;
                  }
                }
                if (failed) throw new Error('Delivery failed');
              }
              await notification.update(
                { delivery_status: 'delivered' },
                { transaction },
              );
            } catch {
              const attempts = notification.delivery_attempts + 1;
              await notification.update(
                {
                  delivery_attempts: attempts,
                  delivery_status: attempts >= 3 ? 'failed' : 'pending',
                },
                { transaction },
              );
              this.logger.warn(
                `Notification ${notification.id}: delivery attempt ${attempts} failed`,
              );
            }
          },
        );
      }
    } finally {
      this.delivering = false;
    }
  }

  async getUserNotifications(
    userId: number,
    page: number = 1,
    limit: number = 20,
  ) {
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
      where: { id: notificationId, user_id: userId },
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
      { where: { user_id: userId, status: NotificationStatus.UNREAD } },
    );
    return { success: true };
  }

  async getUnreadCount(userId: number) {
    return await this.notificationModel.count({
      where: { user_id: userId, status: NotificationStatus.UNREAD },
    });
  }

  async deleteOne(notificationId: number, userId: number) {
    const notification = await this.notificationModel.findOne({
      where: { id: notificationId, user_id: userId },
    });

    if (!notification) {
      throw new HttpException('Уведомление не найдено', HttpStatus.NOT_FOUND);
    }

    await notification.destroy();
    this.log('deleteOne', { notificationId, userId });
    return { success: true, id: notificationId };
  }

  async deleteAll(userId: number) {
    const deleted = await this.notificationModel.destroy({
      where: { user_id: userId },
    });

    this.log('deleteAll', { userId, deleted });
    return { success: true, deleted };
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
    this.logger.log(
      'info',
      JSON.stringify({
        message: `📋 ${method}`,
        context: 'NotificationService',
        ...data,
      }),
    );
  }
}
