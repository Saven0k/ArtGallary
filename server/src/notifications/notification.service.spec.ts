import { ConfigService } from '@nestjs/config';
import { NotificationService } from './notification.service';
import { NotificationType } from './notification.model';
import {
  NotificationSettingsDto,
  PushSubscriptionDto,
} from './notification-settings.dto';
import { ValidationPipe } from '../pipes/validation.pipe';
import { notificationContent } from './notification-content';
import * as webPush from 'web-push';

jest.mock('web-push', () => ({ sendNotification: jest.fn() }));

const keys = {
  VAPID_PUBLIC_KEY: Buffer.concat([
    Buffer.from([4]),
    Buffer.alloc(64),
  ]).toString('base64url'),
  VAPID_PRIVATE_KEY: Buffer.alloc(32).toString('base64url'),
  VAPID_SUBJECT: 'mailto:admin@example.test',
};
const endpoint = 'https://fcm.googleapis.com/fcm/send/test';
const subscription = {
  endpoint,
  keys: {
    p256dh: keys.VAPID_PUBLIC_KEY,
    auth: Buffer.alloc(16).toString('base64url'),
  },
};

function fixture(email = false, push = false) {
  const settings = { email_enabled: email, push_enabled: push, language: 'en' };
  const notification = {
    id: 1,
    user_id: 7,
    type: NotificationType.ART_LIKE,
    message: 'fallback',
    link: '/arts/4',
    metadata: { actor_name: 'Anna', art_title: 'Morning' },
    delivery_attempts: 0,
    delivery_status: 'pending',
    email_sent_at: null,
    push_sent_at: null,
    update: jest.fn<Promise<unknown>, [Record<string, unknown>]>(),
  };
  notification.update.mockImplementation((data) =>
    Promise.resolve(Object.assign(notification, data)),
  );
  const device = { ...subscription, ...subscription.keys, destroy: jest.fn() };
  const dependencies = {
    notificationModel: {
      findAll: jest.fn().mockResolvedValue([{ id: 1 }]),
      findOne: jest.fn().mockResolvedValue(notification),
      create: jest.fn().mockResolvedValue(notification),
      sequelize: {
        transaction: (
          callback: (transaction: {
            LOCK: { UPDATE: string };
          }) => Promise<void>,
        ) => callback({ LOCK: { UPDATE: 'UPDATE' } }),
      },
    },
    settingsModel: {
      findByPk: jest.fn().mockResolvedValue(settings),
      findOrCreate: jest.fn().mockResolvedValue([settings]),
      update: jest.fn().mockResolvedValue([1]),
    },
    userModel: {
      findByPk: jest.fn().mockResolvedValue({
        id: 7,
        email: 'owner@example.test',
        is_deleted: false,
      }),
    },
    pushModel: {
      findAll: jest.fn().mockResolvedValue([device]),
      destroy: jest.fn(),
      upsert: jest.fn(),
    },
    mail: {
      isConfigured: true,
      sendNotification: jest
        .fn<Promise<void>, [string, string, string, string?, string?]>()
        .mockResolvedValue(undefined),
    },
    logger: { log: jest.fn(), warn: jest.fn() },
    config: new ConfigService(keys),
  };
  const service: NotificationService = Object.assign(
    Object.create(NotificationService.prototype) as object,
    dependencies,
  ) as unknown as NotificationService;
  return { service, settings, notification, device, ...dependencies };
}

beforeEach(() => {
  jest.clearAllMocks();
  jest
    .mocked(webPush.sendNotification)
    .mockResolvedValue({} as webPush.SendResult);
});

test('account preferences default to opt-out and delivery ignores disabled channels', async () => {
  const f = fixture();
  f.settingsModel.findByPk.mockResolvedValueOnce(null);
  expect(await f.service.getSettings(7)).toMatchObject({
    emailEnabled: false,
    pushEnabled: false,
  });
  await f.service.deliverPending();
  expect(f.mail.sendNotification).not.toHaveBeenCalled();
  expect(webPush.sendNotification).not.toHaveBeenCalled();
  expect(f.notification.delivery_status).toBe('delivered');
});

test('failed email retries without preventing push or repeating its successful delivery', async () => {
  const f = fixture(true, true);
  f.mail.sendNotification.mockRejectedValue(new Error('SMTP unavailable'));
  await f.service.deliverPending();
  expect(f.notification.delivery_status).toBe('pending');
  expect(f.notification.push_sent_at).toBeInstanceOf(Date);
  await f.service.deliverPending();
  await f.service.deliverPending();
  expect(webPush.sendNotification).toHaveBeenCalledTimes(1);
  expect(f.notification.delivery_status).toBe('failed');
  expect(f.notification.delivery_attempts).toBe(3);
});

test('expired browser endpoints are removed and successful email is not repeated', async () => {
  const f = fixture(true, true);
  jest.mocked(webPush.sendNotification).mockRejectedValue({ statusCode: 410 });
  await f.service.deliverPending();
  expect(f.device.destroy).toHaveBeenCalled();
  expect(f.mail.sendNotification).toHaveBeenCalledWith(
    'owner@example.test',
    expect.any(String),
    'Anna liked your artwork “Morning”',
    '/arts/4',
    'en',
  );
  expect(f.notification.delivery_status).toBe('delivered');
});

test('creating a site event returns without waiting for the transport', async () => {
  const f = fixture(true);
  jest
    .spyOn(f.service, 'deliverPending')
    .mockRejectedValue(new Error('offline'));
  expect(
    await f.service.createNotification(7, NotificationType.ART_LIKE, 'Liked'),
  ).toBe(f.notification);
  await new Promise((resolve) => setImmediate(resolve));
  expect(f.mail.sendNotification).not.toHaveBeenCalled();
  expect(f.logger.warn).toHaveBeenCalled();
});

test('test messages only use the current account mailbox and enforce a shared cooldown', async () => {
  const f = fixture(true);
  await f.service.testNotification(7, 'email');
  expect(f.mail.sendNotification.mock.calls[0][0]).toBe('owner@example.test');
  f.settingsModel.update.mockResolvedValue([0]);
  await expect(f.service.testNotification(7, 'email')).rejects.toMatchObject({
    status: 429,
  });
  expect(f.mail.sendNotification).toHaveBeenCalledTimes(1);
});

test('push endpoints reject internal hosts and deletion is scoped to their owner', async () => {
  const f = fixture();
  await expect(
    f.service.subscribePush(7, {
      ...subscription,
      endpoint: 'https://127.0.0.1/private',
    }),
  ).rejects.toMatchObject({ status: 400 });
  await expect(
    f.service.subscribePush(7, {
      ...subscription,
      endpoint: 'https://fcm.googleapis.com.attacker.test/send',
    }),
  ).rejects.toMatchObject({ status: 400 });
  expect(f.pushModel.upsert).not.toHaveBeenCalled();
  await f.service.subscribePush(7, subscription);
  expect(f.pushModel.upsert).toHaveBeenCalledWith(
    expect.objectContaining({ user_id: 7, endpoint }),
  );
  await f.service.unsubscribePush(7, endpoint);
  expect(f.pushModel.destroy).toHaveBeenCalledWith({
    where: { id: expect.any(String) as string, user_id: 7 },
  });
});

test('notification DTOs reject missing keys and string booleans', async () => {
  const pipe = new ValidationPipe();
  await expect(
    pipe.transform(
      { emailEnabled: null },
      { type: 'body', metatype: NotificationSettingsDto },
    ),
  ).rejects.toMatchObject({ status: 400 });
  await expect(
    pipe.transform(
      { endpoint },
      { type: 'body', metatype: PushSubscriptionDto },
    ),
  ).rejects.toMatchObject({ status: 400 });
  await expect(
    pipe.transform(
      { emailEnabled: 'false' },
      { type: 'body', metatype: NotificationSettingsDto },
    ),
  ).rejects.toMatchObject({ status: 400 });
  expect(
    await pipe.transform(
      { ...subscription, userId: 999 },
      { type: 'body', metatype: PushSubscriptionDto },
    ),
  ).not.toHaveProperty('userId');
});

test('event messages are localized in all supported languages', () => {
  const f = fixture();
  for (const [language, text] of [
    ['ru', 'оценила'],
    ['en', 'liked'],
    ['zh', '点赞'],
  ] as const) {
    const body = notificationContent(f.notification, language).body;
    expect(body).toContain(language === 'ru' ? 'оценил' : text);
    expect(body).toContain('Morning');
  }
});
