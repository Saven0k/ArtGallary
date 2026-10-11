import { ContentTranslation } from './translation.model';
import { TranslationService } from './translation.service';
import {
  contentLanguage,
  sourceLanguage,
  textChunks,
  translateContent,
} from './translation-text';

describe('content translation', () => {
  const env = { ...process.env };
  const originalFetch = global.fetch;
  const saved = new Map<string, Record<string, string>>();
  let service: TranslationService;
  let cache: { findByPk: jest.Mock; upsert: jest.Mock };

  beforeEach(() => {
    process.env.TRANSLATION_ENABLED = 'true';
    delete process.env.TRANSLATION_MODEL;
    saved.clear();
    cache = {
      findByPk: jest.fn((key: string) =>
        Promise.resolve(saved.get(key) ?? null),
      ),
      upsert: jest.fn((row: Record<string, string>) => {
        saved.set(row.key, row);
        return Promise.resolve();
      }),
    };
    service = new TranslationService(
      cache as unknown as typeof ContentTranslation,
    );
    global.fetch = jest.fn(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            done: true,
            done_reason: 'stop',
            message: { content: 'Landscape' },
          }),
          { status: 200 },
        ),
      ),
    );
  });

  afterEach(() => {
    process.env = { ...env };
    global.fetch = originalFetch;
    jest.useRealTimers();
  });

  it('normalizes supported languages and preserves all text when chunking', () => {
    expect(contentLanguage('zh-Hans')).toBe('zh');
    expect(contentLanguage(['en'])).toBe('ru');
    expect(contentLanguage('EN-us')).toBe('en');
    expect(sourceLanguage('Пейзаж с oil')).toBe('ru');
    expect(sourceLanguage('山水画')).toBe('zh');
    const text = `${'Слово '.repeat(500)}\n\n${'画'.repeat(1500)}`;
    expect(textChunks(text).join('')).toBe(text);
    expect(textChunks(text).every((chunk) => chunk.length < 1210)).toBe(true);
    expect(
      textChunks('画'.repeat(1500)).every((chunk) => chunk.length <= 600),
    ).toBe(true);
    const unicode = `${'a'.repeat(1199)}😀${'𠀀'.repeat(1500)}`;
    expect(textChunks(unicode).join('')).toBe(unicode);
    expect(
      textChunks(unicode).every((chunk) => !/[\uD800-\uDBFF]$/.test(chunk)),
    ).toBe(true);
  });

  it('translates display text without changing identity, numbers, secrets or JSON structure', async () => {
    const translate = jest.fn((text: string) => Promise.resolve(`en:${text}`));
    const input = {
      name: 'Белый',
      surname: 'Иванов',
      email: 'me@example.test',
      password: 'тайна',
      role: 'author',
      cost: 123,
      currency: 'RUB',
      status: 'on_sale',
      image_path: 'http://localhost:5000/static/image.png',
      authorProfile: {
        biography: 'Моя биография',
        profession: { id: 7, name: 'Художник' },
      },
      country: { id: 1, name_ru: 'Россия', name_en: 'Russia', iso2: 'RU' },
      title: '{"ru":"Пейзаж","en":"Landscape","zh":"风景"}',
      specifications: '{"size":"120x120","type":"jpg","material":"Холст"}',
      moderate:
        '{"moderate":false,"moderator_id":3,"errors":{"title":"Исправьте название"},"comment":"Комментарий"}',
      message: ['Ошибка'],
    };
    const result = (await translateContent(
      input,
      'en',
      '/arts',
      translate,
    )) as typeof input;
    expect(result).toMatchObject({
      name: input.name,
      surname: input.surname,
      email: input.email,
      password: input.password,
      role: 'author',
      cost: 123,
      currency: 'RUB',
      status: 'on_sale',
      image_path: input.image_path,
      title: 'Landscape',
      country: {
        name: 'Russia',
        name_ru: 'Россия',
        name_en: 'Russia',
        iso2: 'RU',
      },
      authorProfile: {
        biography: 'en:Моя биография',
        profession: { name: 'en:Художник' },
      },
      message: ['en:Ошибка'],
    });
    expect(JSON.parse(result.specifications)).toEqual({
      size: '120x120',
      type: 'jpg',
      material: 'en:Холст',
    });
    expect(JSON.parse(result.moderate)).toMatchObject({
      moderate: false,
      moderator_id: 3,
      comment: 'en:Комментарий',
      errors: { title: 'en:Исправьте название' },
    });
    expect(input.authorProfile.biography).toBe('Моя биография');
    expect(translate).not.toHaveBeenCalledWith('Белый');
    expect(translate).not.toHaveBeenCalledWith('тайна');
  });

  it('uses notification templates so actor identity stays exact', async () => {
    const translate = jest.fn(() => Promise.resolve('风景'));
    const result = await translateContent(
      {
        type: 'art_like',
        message: 'Иван Белый оценил вашу работу «Пейзаж»',
        metadata: {
          actor_name: 'Иван Белый',
          art_title: 'Пейзаж',
          actor_id: 4,
        },
      },
      'zh',
      '/notifications',
      translate,
    );
    expect(result).toMatchObject({
      message: 'Иван Белый 点赞了您的作品《风景》',
      metadata: { actor_name: 'Иван Белый', art_title: 'Пейзаж', actor_id: 4 },
    });
    expect(translate).toHaveBeenCalledTimes(1);
  });

  it('preserves supplied translations and translates structured text fields', async () => {
    const translate = jest.fn((text: string) => Promise.resolve(`zh:${text}`));
    expect(
      await translateContent(
        {
          title: { ru: 'Монако', zh: 'Monaco' },
          specifications: { material: 'Холст', size: '120x120' },
        },
        'zh',
        '/arts',
        translate,
      ),
    ).toEqual({
      title: 'Monaco',
      specifications: { material: 'zh:Холст', size: '120x120' },
    });
    expect(translate).toHaveBeenCalledTimes(1);
  });

  it('deduplicates concurrent translations and reads durable cache after restart', async () => {
    expect(
      await Promise.all([
        service.translate('Пейзаж', 'en'),
        service.translate('Пейзаж', 'en'),
      ]),
    ).toEqual(['Landscape', 'Landscape']);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    const restarted = new TranslationService(
      cache as unknown as typeof ContentTranslation,
    );
    expect(await restarted.translate('Пейзаж', 'en')).toBe('Landscape');
    expect(global.fetch).toHaveBeenCalledTimes(1);
    await restarted.translate('Другой пейзаж', 'en');
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('includes model and target in cache identity and uses the Chinese model language code', async () => {
    await service.translate('Пейзаж', 'en');
    await service.translate('Пейзаж', 'zh');
    process.env.TRANSLATION_MODEL = 'other-model';
    await new TranslationService(
      cache as unknown as typeof ContentTranslation,
    ).translate('Пейзаж', 'en');
    expect(saved.size).toBe(3);
    const calls = (global.fetch as jest.Mock).mock.calls as [
      string,
      RequestInit,
    ][];
    const body = JSON.parse(calls[1][1].body as string) as {
      messages: { content: string }[];
    };
    expect(body.messages[0].content).toContain('zh-Hans');
    expect(await service.translate('Пейзаж', 'ru')).toBe('Пейзаж');
    expect(global.fetch).toHaveBeenCalledTimes(3);
  });

  it('reports a valid unchanged translation as complete, including after restart', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({ done: true, message: { content: 'Monaco' } }),
        ),
      ),
    );
    for (const current of [
      service,
      new TranslationService(cache as unknown as typeof ContentTranslation),
    ]) {
      expect(
        await current.localize({ name: 'Monaco' }, 'zh', '/location'),
      ).toEqual({ data: { name: 'Monaco' }, status: 'complete' });
    }
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('serializes different jobs instead of overloading a small GPU or CPU', async () => {
    let active = 0;
    let maximum = 0;
    global.fetch = jest.fn(async () => {
      maximum = Math.max(maximum, ++active);
      await new Promise((resolve) => setImmediate(resolve));
      active--;
      return new Response(
        JSON.stringify({ done: true, message: { content: 'Landscape' } }),
      );
    });
    await Promise.all(
      ['Первый', 'Второй', 'Третий'].map((text) =>
        service.translate(text, 'en'),
      ),
    );
    expect(maximum).toBe(1);
  });

  it('never saves failed, empty or truncated translations', async () => {
    for (const response of [
      new Response('{}', { status: 503 }),
      new Response(JSON.stringify({ done: true, message: { content: '' } })),
      new Response(JSON.stringify({ done: true, message: { content: 123 } })),
      new Response(
        JSON.stringify({ done: 'true', message: { content: 'Landscape' } }),
      ),
      new Response(
        JSON.stringify({
          done: true,
          done_reason: 'length',
          message: { content: 'Landscape' },
        }),
      ),
    ]) {
      global.fetch = jest.fn(() => Promise.resolve(response));
      const current = new TranslationService(
        cache as unknown as typeof ContentTranslation,
      );
      const text = 'Пейзаж https://example.test/art/1';
      expect(await current.translate(text, 'en')).toBe(text);
      expect(saved.size).toBe(0);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    }
  });

  it('protects embedded URLs and emails and restores them exactly', async () => {
    global.fetch = jest.fn((_url: string, init: RequestInit) => {
      const body = JSON.parse(init.body as string) as {
        messages: { content: string }[];
      };
      expect(body.messages[0].content).not.toContain('https://example.test');
      return Promise.resolve(
        new Response(
          JSON.stringify({
            done: true,
            message: {
              content: body.messages[0].content.endsWith('Посетите ')
                ? 'Visit'
                : 'or email',
            },
          }),
        ),
      );
    });
    expect(
      await service.translate(
        'Посетите https://example.test или пишите me@example.test',
        'en',
      ),
    ).toBe('Visit https://example.test or email me@example.test');
  });

  it('continues other jobs when one translation is incomplete', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ done: true, message: { content: '' } })),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ done: true, message: { content: 'Landscape' } }),
        ),
      );
    const text = 'Пейзаж https://example.test';
    expect(await service.translate(text, 'en')).toBe(text);
    expect(await service.translate('Пейзаж', 'en')).toBe('Landscape');
    expect(saved.size).toBe(1);
  });

  it('backs off only on transport failures and keeps returning cached translations', async () => {
    await service.translate('Пейзаж', 'en');
    global.fetch = jest.fn(() =>
      Promise.resolve(new Response('{}', { status: 503 })),
    );
    expect(await service.translate('Другой', 'en')).toBe('Другой');
    expect(await service.translate('Третий', 'en')).toBe('Третий');
    expect(await service.translate('Пейзаж', 'en')).toBe('Landscape');
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(await service.localize({ title: 'Третий' }, 'en', '/arts')).toEqual({
      data: { title: 'Третий' },
      status: 'partial',
    });
  });

  it('returns original content within the request budget while finishing the cache in background', async () => {
    jest.useFakeTimers();
    let finish: (value: Response) => void;
    global.fetch = jest.fn(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    const result = service.localize({ title: 'Пейзаж' }, 'en', '/arts', 100);
    await jest.advanceTimersByTimeAsync(100);
    expect(await result).toEqual({
      data: { title: 'Пейзаж' },
      status: 'pending',
    });
    finish(
      new Response(
        JSON.stringify({ done: true, message: { content: 'Landscape' } }),
      ),
    );
    await jest.advanceTimersByTimeAsync(1);
    expect(
      await service.localize({ title: 'Пейзаж' }, 'en', '/arts', 100),
    ).toEqual({ data: { title: 'Landscape' }, status: 'complete' });
  });
});
