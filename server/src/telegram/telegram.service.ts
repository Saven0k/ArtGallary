import {
  ConflictException,
  ForbiddenException,
  HttpException,
  Injectable,
  Logger,
  OnModuleDestroy,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/sequelize';
import { Interval } from '@nestjs/schedule';
import { createHash, randomBytes } from 'node:crypto';
import { Op, literal } from 'sequelize';
import { Role } from '../auth/enums/role.enum';
import { User } from '../users/users.model';
import { AuthorProfile } from '../authors/author.model';
import { Art, ART_STATUS } from '../arts/arts.model';
import { AuthorsService } from '../authors/authors.service';
import { ArtsService } from '../arts/arts.service';
import {
  moderationRevision,
  ModerationKind,
  pendingModeration,
} from '../shared/helpers/moderation-revision';
import { TelegramApi, TelegramApiError } from './telegram-api.service';
import {
  TelegramAccount,
  TelegramBotState,
  TelegramDelivery,
} from './telegram.models';

type TelegramMessage = {
  message_id: number;
  chat: { id: number; type: string };
  from?: { id: number; is_bot?: boolean };
  text?: string;
  reply_to_message?: { message_id: number };
};
type TelegramUpdate = {
  update_id: number;
  message?: TelegramMessage;
  callback_query?: {
    id: string;
    data?: string;
    from: { id: number; is_bot?: boolean };
    message?: TelegramMessage;
  };
};
type Item = {
  kind: ModerationKind;
  id: number;
  revision: string;
  text: string;
  image?: string;
};

const clearPending = {
  pending_delivery_id: null,
  pending_approved: null,
  pending_prompt_id: null,
  pending_expires_at: null,
};
const hash = (text: string) => createHash('sha256').update(text).digest('hex');
const staffRoles = [Role.Admin, Role.Moderator];

@Injectable()
export class TelegramService implements OnModuleDestroy {
  private readonly logger = new Logger(TelegramService.name);
  private polling = false;
  private publishing = false;
  private stopped = false;
  private retryAt = 0;

  constructor(
    private readonly api: TelegramApi,
    private readonly config: ConfigService,
    private readonly authors: AuthorsService,
    private readonly arts: ArtsService,
    @InjectModel(User) private readonly users: typeof User,
    @InjectModel(AuthorProfile) private readonly profiles: typeof AuthorProfile,
    @InjectModel(Art) private readonly artworks: typeof Art,
    @InjectModel(TelegramAccount)
    private readonly accounts: typeof TelegramAccount,
    @InjectModel(TelegramDelivery)
    private readonly deliveries: typeof TelegramDelivery,
    @InjectModel(TelegramBotState)
    private readonly state: typeof TelegramBotState,
  ) {}

  onModuleDestroy() {
    this.stopped = true;
    this.api.stop();
  }

  async status(userId: number) {
    if (!this.api.configured) return { configured: false, linked: false };
    const account = await this.accounts.findByPk(userId);
    return { configured: true, linked: !!account?.telegram_id };
  }

  async createLink(userId: number) {
    if (!this.api.configured)
      throw new ServiceUnavailableException('Telegram-бот пока не настроен');
    const user = await this.users.findByPk(userId);
    this.requireStaff(user);
    let username: string;
    try {
      username = await this.api.botUsername();
    } catch {
      throw new ServiceUnavailableException(
        'Нет соединения с Telegram. Проверьте прокси',
      );
    }
    const token = randomBytes(24).toString('base64url');
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    const [account] = await this.accounts.findOrCreate({
      where: { user_id: userId },
      defaults: { user_id: userId },
    });
    await account.update({
      link_hash: hash(token),
      link_expires_at: expiresAt,
    });
    return { url: `https://t.me/${username}?start=${token}`, expiresAt };
  }

  async unlink(userId: number) {
    if (!this.api.configured) return { linked: false };
    await this.accounts.destroy({ where: { user_id: userId } });
    return { linked: false };
  }

  private requireStaff(user: User | null): asserts user is User {
    if (!user || user.is_deleted || !staffRoles.includes(user.role as Role))
      throw new ForbiddenException(
        'Доступ только для администраторов и модераторов',
      );
  }

  private text(chatId: string, text: string, keyboard?: object) {
    return this.api.call<{ message_id: number }>('sendMessage', {
      chat_id: chatId,
      text,
      ...(keyboard && { reply_markup: keyboard }),
      link_preview_options: { is_disabled: true },
    });
  }

  private async link(token: string, telegramId: string) {
    if (!/^[\w-]{32}$/.test(token))
      throw new ForbiddenException('Ссылка привязки недействительна');
    await this.accounts.sequelize.transaction(async (transaction) => {
      const account = await this.accounts.findOne({
        where: {
          link_hash: hash(token),
          link_expires_at: { [Op.gt]: new Date() },
        },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!account)
        throw new ForbiddenException(
          'Ссылка истекла или уже использована. Создайте новую в настройках сайта',
        );
      const user = await this.users.findByPk(account.user_id, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      this.requireStaff(user);
      const existing = await this.accounts.findOne({
        where: { telegram_id: telegramId },
        transaction,
      });
      if (existing && existing.user_id !== account.user_id)
        throw new ForbiddenException(
          'Этот Telegram уже привязан к другому аккаунту',
        );
      await this.deliveries.destroy({
        where: { user_id: account.user_id },
        transaction,
      });
      await account.update(
        {
          telegram_id: telegramId,
          link_hash: null,
          link_expires_at: null,
          ...clearPending,
        },
        { transaction },
      );
    });
    await this.text(
      telegramId,
      'Telegram привязан. Здесь будут появляться новые авторы и работы на модерации. /queue — показать очередь, /cancel — отменить ввод комментария.',
    );
  }

  @Interval(1000)
  async poll() {
    if (
      !this.api.configured ||
      this.stopped ||
      this.polling ||
      Date.now() < this.retryAt
    )
      return;
    this.polling = true;
    try {
      const [state] = await this.state.findOrCreate({
        where: { id: 1 },
        defaults: { id: 1, offset: '0' },
      });
      const updates = await this.api.call<TelegramUpdate[]>('getUpdates', {
        offset: Number(state.offset),
        timeout: 25,
        limit: 20,
        allowed_updates: ['message', 'callback_query'],
      });
      if (!Array.isArray(updates)) throw new Error('Invalid Telegram response');
      for (const update of updates) {
        if (!Number.isSafeInteger(update.update_id)) continue;
        await this.handleUpdate(update);
        await state.update({ offset: String(update.update_id + 1) });
      }
    } catch (error) {
      this.backoff(error);
    } finally {
      this.polling = false;
    }
  }

  private backoff(error: unknown) {
    this.retryAt =
      Date.now() +
      (error instanceof TelegramApiError
        ? Math.max(10, error.retryAfter)
        : 10) *
        1000;
    if (!this.stopped)
      this.logger.warn(
        error instanceof TelegramApiError
          ? error.message
          : 'Telegram unavailable; check connection and database migration',
      );
  }

  async handleUpdate(update: TelegramUpdate) {
    const callback = update.callback_query;
    const message = callback?.message || update.message;
    const sender = callback?.from || message?.from;
    if (
      !message ||
      message.chat?.type !== 'private' ||
      !sender ||
      sender.is_bot ||
      !Number.isSafeInteger(sender.id) ||
      sender.id <= 0 ||
      message.chat.id !== sender.id
    )
      return;
    const chatId = String(sender.id);
    if (callback) {
      try {
        await this.api.call('answerCallbackQuery', {
          callback_query_id: callback.id,
        });
      } catch (error) {
        if (!(error instanceof TelegramApiError && error.code === 400))
          throw error;
      }
    }
    try {
      const text = typeof message.text === 'string' ? message.text.trim() : '';
      if (!callback && text.startsWith('/start ')) {
        await this.link(text.slice(7).trim(), chatId);
        return;
      }
      const account = await this.accounts.findOne({
        where: { telegram_id: chatId },
      });
      if (!account) {
        await this.text(
          chatId,
          'Сначала привяжите Telegram в настройках сайта под аккаунтом администратора или модератора.',
        );
        return;
      }
      const user = await this.users.findByPk(account.user_id);
      this.requireStaff(user);
      if (callback) {
        await this.callback(account, callback);
        return;
      }
      if (text === '/cancel') {
        await account.update(clearPending);
        await this.text(chatId, 'Ввод комментария отменён.');
        return;
      }
      if (text === '/queue' || text === '/start') {
        await account.update(clearPending);
        const items = await this.pendingItems();
        if (!items.length) await this.text(chatId, 'Очередь модерации пуста.');
        for (const item of items.slice(0, 10))
          await this.deliver(account, item, true);
        if (items.length > 10)
          await this.text(
            chatId,
            'Показаны первые 10 записей. Остальные придут уведомлениями; после решения повторите /queue.',
          );
        return;
      }
      if (text.startsWith('/')) {
        await this.text(
          chatId,
          '/queue — очередь модерации, /cancel — отменить комментарий.',
        );
        return;
      }
      if (account.pending_delivery_id) {
        if (!text || text.length > 2000) {
          await this.text(
            chatId,
            'Комментарий должен содержать от 1 до 2000 символов.',
          );
          return;
        }
        if (
          message.reply_to_message &&
          message.reply_to_message.message_id !== account.pending_prompt_id
        )
          throw new ConflictException(
            'Ответ относится к другому сообщению. Используйте последний запрос комментария',
          );
        await this.decide(account, text);
      } else
        await this.text(
          chatId,
          'Выберите «Принять» или «Отказать» под карточкой.',
        );
    } catch (error) {
      if (error instanceof TelegramApiError && error.code === 403) {
        await this.accounts.destroy({ where: { telegram_id: chatId } });
        return;
      }
      if (
        error instanceof HttpException &&
        [400, 403, 404, 409].includes(error.getStatus())
      ) {
        try {
          await this.text(chatId, error.message);
        } catch (replyError) {
          if (
            !(replyError instanceof TelegramApiError && replyError.code === 403)
          )
            throw replyError;
          await this.accounts.destroy({ where: { telegram_id: chatId } });
        }
        return;
      }
      throw error;
    }
  }

  private async callback(
    account: TelegramAccount,
    callback: NonNullable<TelegramUpdate['callback_query']>,
  ) {
    const match = /^tm:(\d+):(accept|reject|confirm|cancel)$/.exec(
      callback.data || '',
    );
    if (!match) throw new ForbiddenException('Недействительная кнопка');
    const delivery = await this.deliveries.findByPk(Number(match[1]));
    if (!delivery || delivery.user_id !== account.user_id)
      throw new ForbiddenException(
        'Эта карточка принадлежит другому модератору',
      );
    const action = match[2];
    if (action === 'confirm' || action === 'cancel') {
      if (
        account.pending_delivery_id !== delivery.id ||
        account.pending_prompt_id !== callback.message?.message_id
      )
        throw new ConflictException('Этот запрос комментария уже не действует');
      if (action === 'cancel') {
        await account.update(clearPending);
        await this.text(account.telegram_id, 'Решение отменено.');
      } else await this.decide(account, '');
      return;
    }
    if (delivery.message_id !== callback.message?.message_id)
      throw new ConflictException('Используйте последнюю карточку');
    await this.currentItem(delivery);
    const prompt = await this.text(
      account.telegram_id,
      `${action === 'accept' ? 'Принятие' : 'Отказ'}: ${delivery.kind === 'author' ? 'автор' : 'работа'} #${delivery.entity_id}.\nОтправьте комментарий следующим сообщением или подтвердите без комментария. Решение ещё не сохранено.`,
      {
        inline_keyboard: [
          [
            {
              text: 'Без комментария',
              callback_data: `tm:${delivery.id}:confirm`,
            },
            { text: 'Отмена', callback_data: `tm:${delivery.id}:cancel` },
          ],
        ],
      },
    );
    await account.update({
      pending_delivery_id: delivery.id,
      pending_approved: action === 'accept',
      pending_prompt_id: prompt.message_id,
      pending_expires_at: new Date(Date.now() + 10 * 60 * 1000),
    });
  }

  private async currentItem(delivery: TelegramDelivery) {
    const item =
      delivery.kind === 'author'
        ? await this.profiles.findByPk(delivery.entity_id)
        : delivery.kind === 'art'
          ? await this.artworks.findByPk(delivery.entity_id)
          : null;
    if (
      !item ||
      !pendingModeration(item.moderate) ||
      moderationRevision(delivery.kind, item) !== delivery.revision
    )
      throw new ConflictException(
        'Запись уже изменена, удалена или промодерирована. Обновите очередь: /queue',
      );
    return item;
  }

  private async decide(account: TelegramAccount, comment: string) {
    if (
      !account.pending_expires_at ||
      new Date(account.pending_expires_at).getTime() < Date.now() ||
      typeof account.pending_approved !== 'boolean'
    ) {
      await account.update(clearPending);
      throw new ConflictException(
        'Время ввода комментария истекло. Нажмите кнопку в карточке заново',
      );
    }
    const delivery = await this.deliveries.findByPk(
      account.pending_delivery_id,
    );
    if (!delivery || delivery.user_id !== account.user_id)
      throw new ForbiddenException('Недействительная карточка');
    await this.currentItem(delivery);
    const user = await this.users.findByPk(account.user_id);
    this.requireStaff(user);
    const approved = account.pending_approved;
    const decision = {
      moderate: approved,
      moderator_id: user.id,
      comment,
      errors: {},
    };
    if (delivery.kind === 'author')
      await this.authors.moderateAuthor(
        decision,
        delivery.entity_id,
        delivery.revision,
      );
    else
      await this.arts.moderateArt(
        decision,
        delivery.entity_id,
        delivery.revision,
      );
    await account.update(clearPending);
    await this.text(
      account.telegram_id,
      `${delivery.kind === 'author' ? 'Автор' : 'Работа'} #${delivery.entity_id}: ${approved ? 'принято' : 'отказано'}.${comment ? `\nКомментарий: ${comment}` : ''}`,
    );
    await this.api
      .call('editMessageReplyMarkup', {
        chat_id: account.telegram_id,
        message_id: delivery.message_id,
        reply_markup: { inline_keyboard: [] },
      })
      .catch(() => undefined);
  }

  private card(kind: ModerationKind, item: AuthorProfile | Art): Item {
    const author = item as AuthorProfile;
    const art = item as Art;
    const id = kind === 'author' ? author.user_id : art.id;
    const name =
      kind === 'author'
        ? `${author.user.name} ${author.user.surname}`
        : art.title;
    const content =
      kind === 'author'
        ? author.biography
        : `${art.description || ''}\n${art.specifications || ''}`;
    const origin = new URL(
      this.config.get<string>('FRONTEND_URL', 'http://localhost:5173'),
    );
    if (
      !['http:', 'https:'].includes(origin.protocol) ||
      origin.username ||
      origin.password
    )
      throw new Error('Invalid FRONTEND_URL');
    return {
      kind,
      id,
      revision: moderationRevision(kind, item),
      image: kind === 'author' ? author.avatar_path : art.image_path,
      text: `На модерации: ${kind === 'author' ? 'автор' : 'работа'} #${id}\n${(name || '').slice(0, 200)}\n\n${(content || '').slice(0, 3000)}\n\nПолная карточка: ${origin.origin}/${kind === 'author' ? 'authors' : 'arts'}/${id}`,
    };
  }

  private async pendingItems(): Promise<Item[]> {
    const [authors, arts] = await Promise.all([
      this.profiles.findAll({
        where: {
          is_deleted: false,
          [Op.and]: literal(
            `("AuthorProfile"."moderate"::jsonb ->> 'moderate') IS DISTINCT FROM 'true'`,
          ),
        },
        include: [
          {
            model: User,
            attributes: ['id', 'name', 'surname'],
            where: { is_deleted: false, role: Role.Author },
          },
        ],
        order: [['createdAt', 'ASC']],
      }),
      this.artworks.findAll({
        where: {
          status: { [Op.ne]: ART_STATUS.ARCHIVED },
          [Op.and]: literal(
            `("Art"."moderate"::jsonb ->> 'moderate') IS DISTINCT FROM 'true'`,
          ),
        },
        include: [
          {
            model: AuthorProfile,
            attributes: ['user_id'],
            where: { is_deleted: false },
            include: [
              { model: User, attributes: ['id'], where: { is_deleted: false } },
            ],
          },
        ],
        order: [['createdAt', 'ASC']],
      }),
    ]);
    return [
      ...authors
        .filter((item) => pendingModeration(item.moderate))
        .map((item) => this.card('author', item)),
      ...arts
        .filter((item) => pendingModeration(item.moderate))
        .map((item) => this.card('art', item)),
    ];
  }

  private async deliver(
    account: TelegramAccount,
    item: Item,
    repeat = false,
  ): Promise<boolean> {
    const [delivery] = await this.deliveries.findOrCreate({
      where: {
        user_id: account.user_id,
        kind: item.kind,
        entity_id: item.id,
        revision: item.revision,
      },
      defaults: {
        user_id: account.user_id,
        kind: item.kind,
        entity_id: item.id,
        revision: item.revision,
      },
    });
    if (delivery.message_id && !repeat) return false;
    const messageId = await this.api.sendCard(
      account.telegram_id,
      item.text,
      {
        inline_keyboard: [
          [
            { text: 'Принять', callback_data: `tm:${delivery.id}:accept` },
            { text: 'Отказать', callback_data: `tm:${delivery.id}:reject` },
          ],
        ],
      },
      item.image,
    );
    await delivery.update({ message_id: messageId });
    return true;
  }

  @Interval(10000)
  async publish() {
    if (
      !this.api.configured ||
      this.stopped ||
      this.publishing ||
      Date.now() < this.retryAt
    )
      return;
    this.publishing = true;
    try {
      const accounts = await this.accounts.findAll({
        where: { telegram_id: { [Op.ne]: null } },
      });
      if (!accounts.length) return;
      const users = await this.users.findAll({
        where: {
          id: { [Op.in]: accounts.map((a) => a.user_id) },
          role: { [Op.in]: staffRoles },
          is_deleted: false,
        },
        attributes: ['id'],
      });
      const ids = new Set(users.map((user) => user.id));
      const items = await this.pendingItems();
      let sent = 0;
      for (const item of items) {
        for (const account of accounts.filter((a) => ids.has(a.user_id))) {
          try {
            if (await this.deliver(account, item)) sent++;
          } catch (error) {
            if (error instanceof TelegramApiError && error.code === 403) {
              await this.unlink(account.user_id);
              ids.delete(account.user_id);
            } else throw error;
          }
          if (sent >= 20 || this.stopped) return;
        }
      }
    } catch (error) {
      this.backoff(error);
    } finally {
      this.publishing = false;
    }
  }
}
