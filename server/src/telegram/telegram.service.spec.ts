import { ConfigService } from '@nestjs/config';
import { ConflictException } from '@nestjs/common';
import { User } from '../users/users.model';
import { AuthorProfile } from '../authors/author.model';
import { Art } from '../arts/arts.model';
import { AuthorsService } from '../authors/authors.service';
import { ArtsService } from '../arts/arts.service';
import {
  moderationRevision,
  pendingModeration,
} from '../shared/helpers/moderation-revision';
import { TelegramApi, TelegramApiError } from './telegram-api.service';
import {
  TelegramAccount,
  TelegramBotState,
  TelegramDelivery,
} from './telegram.models';
import { TelegramService } from './telegram.service';

describe('Telegram moderation', () => {
  afterEach(() => jest.restoreAllMocks());
  const profile = {
    user_id: 9,
    biography: 'Биография',
    avatar_path: '/static/avatar.png',
    is_deleted: false,
    moderate: '{"moderate":false,"moderator_id":null,"errors":{}}',
  };
  let service: TelegramService;
  let api: {
    configured: boolean;
    call: jest.Mock;
    botUsername: jest.Mock;
    sendCard: jest.Mock;
    stop: jest.Mock;
  };
  let account: Record<string, unknown> & { update: jest.Mock };
  let users: { findByPk: jest.Mock; findAll: jest.Mock };
  let accounts: {
    findByPk: jest.Mock;
    findOne: jest.Mock;
    findOrCreate: jest.Mock;
    destroy: jest.Mock;
    findAll: jest.Mock;
    sequelize: { transaction: jest.Mock };
  };
  let delivery: Record<string, unknown>;
  let deliveries: {
    findByPk: jest.Mock;
    destroy: jest.Mock;
    findOrCreate: jest.Mock;
  };
  let profiles: { findByPk: jest.Mock; findAll: jest.Mock };
  let artworks: { findByPk: jest.Mock; findAll: jest.Mock };
  let arts: { moderateArt: jest.Mock };
  let authors: { moderateAuthor: jest.Mock };
  let state: { findOrCreate: jest.Mock };

  const message = (text: string, chatType = 'private') => ({
    update_id: 10,
    message: {
      message_id: 1,
      chat: { id: 123, type: chatType },
      from: { id: 123 },
      text,
    },
  });
  const callback = (action: string, messageId = 12) => ({
    update_id: 10,
    callback_query: {
      id: 'callback',
      data: `tm:5:${action}`,
      from: { id: 123 },
      message: { message_id: messageId, chat: { id: 123, type: 'private' } },
    },
  });

  beforeEach(() => {
    api = {
      configured: true,
      call: jest.fn().mockResolvedValue({ message_id: 20 }),
      botUsername: jest.fn().mockResolvedValue('GalleryTestBot'),
      sendCard: jest.fn().mockResolvedValue(12),
      stop: jest.fn(),
    };
    account = {
      user_id: 7,
      telegram_id: '123',
      pending_delivery_id: null,
      update: jest.fn((data: object) =>
        Promise.resolve(Object.assign(account, data)),
      ),
    };
    users = {
      findByPk: jest
        .fn()
        .mockResolvedValue({ id: 7, role: 'admin', is_deleted: false }),
      findAll: jest.fn().mockResolvedValue([{ id: 7 }]),
    };
    accounts = {
      findByPk: jest.fn().mockResolvedValue(account),
      findOne: jest.fn().mockResolvedValue(account),
      findOrCreate: jest.fn().mockResolvedValue([account]),
      destroy: jest.fn().mockResolvedValue(1),
      findAll: jest.fn().mockResolvedValue([account]),
      sequelize: {
        transaction: jest.fn((fn: (t: object) => Promise<void>) =>
          fn({ LOCK: { UPDATE: 'UPDATE' } }),
        ),
      },
    };
    delivery = {
      id: 5,
      user_id: 7,
      kind: 'author',
      entity_id: 9,
      revision: moderationRevision('author', profile),
      message_id: 12,
      update: jest.fn(),
    };
    deliveries = {
      findByPk: jest.fn().mockResolvedValue(delivery),
      destroy: jest.fn(),
      findOrCreate: jest.fn().mockResolvedValue([delivery]),
    };
    profiles = {
      findByPk: jest.fn().mockResolvedValue({ ...profile }),
      findAll: jest
        .fn()
        .mockResolvedValue([
          { ...profile, user: { name: 'Иван', surname: 'Белый' } },
        ]),
    };
    authors = { moderateAuthor: jest.fn() };
    arts = { moderateArt: jest.fn() };
    artworks = {
      findByPk: jest.fn(),
      findAll: jest.fn().mockResolvedValue([]),
    };
    state = { findOrCreate: jest.fn() };
    service = new TelegramService(
      api as unknown as TelegramApi,
      new ConfigService({ FRONTEND_URL: 'https://gallery.test' }),
      authors as unknown as AuthorsService,
      arts as unknown as ArtsService,
      users as unknown as typeof User,
      profiles as unknown as typeof AuthorProfile,
      artworks as unknown as typeof Art,
      accounts as unknown as typeof TelegramAccount,
      deliveries as unknown as typeof TelegramDelivery,
      state as unknown as typeof TelegramBotState,
    );
  });

  it('distinguishes pending work from approved, rejected and invalid records', () => {
    expect(pendingModeration(profile.moderate)).toBe(true);
    for (const data of [
      '{"moderate":true}',
      '{"moderate":false,"moderator_id":7}',
      '{"moderate":false,"moderated_at":"2026-10-11"}',
      '{"errors":{"title":"Исправить"}}',
      'invalid',
    ])
      expect(pendingModeration(data)).toBe(false);
    expect(
      moderationRevision('author', { ...profile, biography: 'Другая' }),
    ).not.toBe(moderationRevision('author', profile));
  });

  it('stores only a hash for an expiring one-use link and checks staff role', async () => {
    const result = await service.createLink(7);
    const token = new URL(result.url).searchParams.get('start');
    expect(token).toHaveLength(32);
    expect(account.link_hash).toHaveLength(64);
    expect(account.link_hash).not.toBe(token);
    expect(
      new Date(result.expiresAt).getTime() - Date.now(),
    ).toBeLessThanOrEqual(600000);
    users.findByPk.mockResolvedValue({ id: 7, role: 'user' });
    await expect(service.createLink(7)).rejects.toThrow('Доступ только');
  });

  it('consumes a valid linking token atomically and rejects expired tokens', async () => {
    accounts.findOne.mockResolvedValueOnce(account).mockResolvedValueOnce(null);
    await service.handleUpdate(message(`/start ${'a'.repeat(32)}`));
    expect(accounts.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ lock: 'UPDATE' }),
    );
    expect(account.link_hash).toBeNull();
    expect(deliveries.destroy).toHaveBeenCalledWith(
      expect.objectContaining({ where: { user_id: 7 } }),
    );
    accounts.findOne.mockResolvedValueOnce(null);
    await service.handleUpdate(message(`/start ${'a'.repeat(32)}`));
    expect(api.call).toHaveBeenLastCalledWith(
      'sendMessage',
      expect.objectContaining({
        text: 'Ссылка истекла или уже использована. Создайте новую в настройках сайта',
      }),
    );
  });

  it('ignores groups and denies a removed role, unlinked account or foreign card', async () => {
    await service.handleUpdate(message('/queue', 'group'));
    expect(accounts.findOne).not.toHaveBeenCalled();
    accounts.findOne.mockResolvedValueOnce(null);
    await service.handleUpdate(callback('accept'));
    expect(authors.moderateAuthor).not.toHaveBeenCalled();
    users.findByPk.mockResolvedValueOnce({
      id: 7,
      role: 'user',
      is_deleted: false,
    });
    await service.handleUpdate(callback('accept'));
    delivery.user_id = 8;
    await service.handleUpdate(callback('accept'));
    expect(account.pending_delivery_id).toBeNull();
    expect(authors.moderateAuthor).not.toHaveBeenCalled();
  });

  it('requires confirmation and saves the comment with the website moderator id', async () => {
    await service.handleUpdate(callback('reject'));
    expect(authors.moderateAuthor).not.toHaveBeenCalled();
    await service.handleUpdate(message('Исправьте биографию'));
    expect(authors.moderateAuthor).toHaveBeenCalledWith(
      {
        moderate: false,
        moderator_id: 7,
        comment: 'Исправьте биографию',
        errors: {},
      },
      9,
      delivery.revision,
    );
    expect(account.pending_delivery_id).toBeNull();
  });

  it('accepts without a comment and rejects stale, oversized and expired input', async () => {
    await service.handleUpdate(callback('accept'));
    await service.handleUpdate(message('a'.repeat(2001)));
    expect(authors.moderateAuthor).not.toHaveBeenCalled();
    await service.handleUpdate(callback('confirm', 20));
    expect(authors.moderateAuthor).toHaveBeenCalledWith(
      expect.objectContaining({ moderate: true, comment: '' }),
      9,
      delivery.revision,
    );
    authors.moderateAuthor.mockClear();
    await service.handleUpdate(callback('accept'));
    account.pending_expires_at = new Date(Date.now() - 1);
    await service.handleUpdate(callback('confirm', 20));
    expect(authors.moderateAuthor).not.toHaveBeenCalled();
    profiles.findByPk.mockResolvedValue({ ...profile, biography: 'Изменено' });
    await service.handleUpdate(callback('accept'));
    expect(account.pending_delivery_id).toBeNull();
  });

  it('moderates artwork through the existing publishing service with the reviewed revision', async () => {
    const art = {
      id: 9,
      title: 'Утро',
      moderate: profile.moderate,
      status: 'on_sale',
    };
    artworks.findByPk.mockResolvedValue(art);
    delivery.kind = 'art';
    delivery.revision = moderationRevision('art', art);
    await service.handleUpdate(callback('accept'));
    await service.handleUpdate(message('Готово к публикации'));
    expect(arts.moderateArt).toHaveBeenCalledWith(
      {
        moderate: true,
        moderator_id: 7,
        comment: 'Готово к публикации',
        errors: {},
      },
      9,
      delivery.revision,
    );
    expect(authors.moderateAuthor).not.toHaveBeenCalled();
  });

  it('rejects a decision changed concurrently and cannot repeat a committed approval', async () => {
    await service.handleUpdate(callback('accept'));
    authors.moderateAuthor.mockRejectedValue(
      new ConflictException('Другой модератор уже решил'),
    );
    await service.handleUpdate(callback('confirm', 20));
    expect(api.call).toHaveBeenLastCalledWith(
      'sendMessage',
      expect.objectContaining({ text: 'Другой модератор уже решил' }),
    );
    profiles.findByPk.mockResolvedValue({
      ...profile,
      moderate: '{"moderate":true}',
    });
    await service.handleUpdate(message('Комментарий'));
    expect(authors.moderateAuthor).toHaveBeenCalledTimes(1);
  });

  it('keeps the update cursor in the database and advances it after handling', async () => {
    const cursor = { offset: '10', update: jest.fn() };
    state.findOrCreate.mockResolvedValue([cursor]);
    api.call
      .mockResolvedValueOnce([message('/cancel')])
      .mockResolvedValue({ message_id: 20 });
    await service.poll();
    expect(api.call).toHaveBeenCalledWith(
      'getUpdates',
      expect.objectContaining({ offset: 10, timeout: 25 }),
    );
    expect(cursor.update).toHaveBeenCalledWith({ offset: '11' });
    api.configured = false;
    state.findOrCreate.mockClear();
    await service.poll();
    expect(state.findOrCreate).not.toHaveBeenCalled();
  });

  it('retries failed delivery, avoids resending stored cards and stops after a block', async () => {
    delivery.message_id = null;
    api.sendCard.mockRejectedValueOnce(new Error('network'));
    await service.publish();
    expect(delivery.update).not.toHaveBeenCalled();
    jest.spyOn(Date, 'now').mockReturnValue(Date.now() + 20000);
    await service.publish();
    expect(delivery.update).toHaveBeenCalledWith({ message_id: 12 });
    delivery.message_id = 12;
    await service.publish();
    expect(api.sendCard).toHaveBeenCalledTimes(2);
    delivery.message_id = null;
    api.sendCard.mockRejectedValueOnce(new TelegramApiError(403));
    await service.publish();
    expect(accounts.destroy).toHaveBeenCalledWith({ where: { user_id: 7 } });
    jest.restoreAllMocks();
  });
});
