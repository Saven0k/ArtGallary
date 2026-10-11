import { notificationContent } from '../notifications/notification-content';
import {
  Notification,
  NotificationType,
} from '../notifications/notification.model';

export type ContentLanguage = 'ru' | 'en' | 'zh';

export function contentLanguage(value: unknown): ContentLanguage {
  if (typeof value !== 'string') return 'ru';
  const language = value.toLowerCase().split(/[-_,;]/)[0];
  return language === 'en' || language === 'zh' ? language : 'ru';
}

export function sourceLanguage(text: string): ContentLanguage {
  const content = text.replace(
    /https?:\/\/\S+|[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi,
    '',
  );
  const chinese = (content.match(/\p{Script=Han}/gu)?.length ?? 0) * 2;
  const russian = content.match(/\p{Script=Cyrillic}/gu)?.length ?? 0;
  const english = content.match(/\p{Script=Latin}/gu)?.length ?? 0;
  if (chinese > Math.max(russian, english)) return 'zh';
  return russian > english ? 'ru' : 'en';
}

export function textChunks(text: string): string[] {
  const limit = sourceLanguage(text) === 'zh' ? 600 : 1200;
  return (
    text.match(
      new RegExp(`[\\s\\S]{1,${limit}}(?:\\s+|$)|[\\s\\S]{1,${limit}}`, 'gu'),
    ) ?? []
  );
}

export async function translateContent(
  data: unknown,
  language: ContentLanguage,
  route: string,
  translate: (text: string) => Promise<string>,
): Promise<unknown> {
  const plain: unknown = JSON.parse(JSON.stringify(data ?? null));
  const fields = new Set([
    'title',
    'description',
    'biography',
    'specifications',
    'message',
    'comment',
    'art_title',
    'region',
    'material',
    'technique',
    'medium',
    'notes',
    'countryName',
    'label',
    'features',
    'benefits',
  ]);
  const dictionaries =
    /(?:^|\.)(?:country|city|profession|genre|style|artType|art_type|tags)(?:\.|$)/;
  const dictionaryRoute =
    /^\/(?:genres|styles|professions|tags|art-types|location|stats\/countries)(?:\/|$)/;

  async function text(value: unknown): Promise<unknown> {
    if (Array.isArray(value)) return Promise.all(value.map(text));
    if (value && typeof value === 'object') {
      const localized = value as Record<string, unknown>;
      if (
        ['ru', 'en', 'zh'].some((key) => typeof localized[key] === 'string')
      ) {
        const preferred = localized[language];
        if (typeof preferred === 'string' && preferred.trim()) return preferred;
        return text(localized.ru || localized.en || localized.zh);
      }
      await visit(value, 'specifications');
      return value;
    }
    if (typeof value !== 'string' || !value.trim()) return value;
    if (/^(?:https?:\/\/\S+|\/static\/\S+|\S+@\S+\.\S+)$/i.test(value))
      return value;
    if (value.trim().startsWith('{') || value.trim().startsWith('[')) {
      try {
        const localized = JSON.parse(value) as Record<string, unknown>;
        if (
          ['ru', 'en', 'zh'].some((key) => typeof localized[key] === 'string')
        ) {
          const preferred = localized[language];
          if (typeof preferred === 'string' && preferred.trim())
            return preferred;
          const fallback = localized.ru || localized.en || localized.zh;
          if (typeof fallback === 'string') return translate(fallback);
        }
        await visit(localized, 'specifications');
        return JSON.stringify(localized);
      } catch {
        return translate(value);
      }
    }
    return translate(value);
  }

  async function visit(value: unknown, path: string): Promise<void> {
    if (Array.isArray(value)) {
      await Promise.all(
        value.map(async (item, index) => {
          if (path.endsWith('tags') && typeof item === 'string')
            value[index] = await text(item);
          else await visit(item, path);
        }),
      );
      return;
    }
    if (!value || typeof value !== 'object') return;
    const object = value as Record<string, unknown>;
    const notification =
      Object.values(NotificationType).includes(
        object.type as NotificationType,
      ) &&
      object.metadata &&
      typeof object.metadata === 'object' &&
      typeof (object.metadata as Record<string, unknown>).actor_name ===
        'string';
    if (notification) {
      const metadata = object.metadata as Record<string, unknown>;
      const artTitle = await text(metadata.art_title);
      object.message = notificationContent(
        {
          type: object.type as NotificationType,
          message: object.message as string,
          metadata: { ...metadata, art_title: artTitle },
        } as Pick<Notification, 'type' | 'message' | 'metadata'>,
        language,
      ).body;
    }
    const identity =
      'surname' in object || 'email' in object || 'role' in object;
    if ('name_ru' in object || 'name_en' in object) {
      const preferred = object[`name_${language}`];
      object.name =
        typeof preferred === 'string' && preferred.trim()
          ? preferred
          : await text(object.name_ru || object.name_en);
    }
    await Promise.all(
      Object.entries(object).map(async ([key, item]) => {
        if (notification && key === 'message') return;
        const next = path ? `${path}.${key}` : key;
        if (key === 'moderate' && typeof item === 'string') {
          try {
            const moderation: unknown = JSON.parse(item);
            await visit(moderation, 'moderate');
            object[key] = JSON.stringify(moderation);
          } catch {
            object[key] = item;
          }
        } else if (
          fields.has(key) ||
          (key === 'name' &&
            !identity &&
            !('name_ru' in object || 'name_en' in object) &&
            (dictionaries.test(path) || dictionaryRoute.test(route))) ||
          path === 'moderate.errors'
        ) {
          object[key] = await text(item);
        } else if (
          key !== 'metadata' &&
          key !== 'name_ru' &&
          key !== 'name_en' &&
          key !== 'name_zh'
        ) {
          await visit(item, next);
        }
      }),
    );
  }
  await visit(plain, '');
  return plain;
}
