import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { createHash } from 'crypto';
import { ContentTranslation } from './translation.model';
import {
  ContentLanguage,
  sourceLanguage,
  textChunks,
  translateContent,
} from './translation-text';

const languages = {
  ru: ['Russian', 'ru'],
  en: ['English', 'en'],
  zh: ['Simplified Chinese', 'zh-Hans'],
};

const terminology = {
  ru: 'Fine-art terminology: still life / 静物画 = натюрморт; landscape / 风景画 = пейзаж; oil on canvas / 布面油画 = масло на холсте; oil painting / 油画 = картина маслом.',
  en: 'Fine-art terminology: натюрморт / 静物画 = still life; пейзаж / 风景画 = landscape; масло на холсте / 布面油画 = oil on canvas; картина маслом / 油画 = oil painting.',
  zh: 'Fine-art terminology: натюрморт / still life = 静物画; пейзаж / landscape = 风景画; масло на холсте / oil on canvas = 布面油画; картина маслом / oil painting = 油画.',
};

class InvalidTranslationError extends Error {}

type TranslationResult = { text: string; complete: boolean };

@Injectable()
export class TranslationService {
  private readonly logger = new Logger(TranslationService.name);
  private readonly pending = new Map<string, Promise<TranslationResult>>();
  private queue: Promise<void> = Promise.resolve();
  private unavailableUntil = 0;
  readonly enabled = process.env.TRANSLATION_ENABLED === 'true';
  readonly model = process.env.TRANSLATION_MODEL || 'translategemma:4b';

  constructor(
    @InjectModel(ContentTranslation)
    private readonly cache: typeof ContentTranslation,
  ) {}

  async translate(text: string, target: ContentLanguage): Promise<string> {
    return (await this.translateResult(text, target)).text;
  }

  async translateResult(
    text: string,
    target: ContentLanguage,
  ): Promise<TranslationResult> {
    const source = sourceLanguage(text);
    if (!this.enabled || source === target || !/\p{L}/u.test(text))
      return { text, complete: true };
    if (text.length > 20000) return { text, complete: false };
    const key = createHash('sha256')
      .update(JSON.stringify(['art-v1', this.model, source, target, text]))
      .digest('hex');
    try {
      const saved = await this.cache.findByPk(key);
      if (saved) return { text: saved.translated_text, complete: true };
      const existing = this.pending.get(key);
      if (existing !== undefined) return existing;
      if (Date.now() < this.unavailableUntil || this.pending.size >= 1000)
        return { text, complete: false };
      const job = this.queue.then(async () => {
        if (Date.now() < this.unavailableUntil)
          return { text, complete: false };
        try {
          let translated = '';
          const parts = text.split(
            /(https?:\/\/[^\s<>"“”]+|[\w.+-]+@[\w.-]+\.[a-z]{2,})/gi,
          );
          for (const [index, part] of parts.entries()) {
            if (index % 2 === 1 || !/\p{L}/u.test(part)) {
              translated += part;
              continue;
            }
            for (const chunk of textChunks(part))
              translated += await this.generate(chunk, source, target);
          }
          await this.cache.upsert({
            key,
            source_text: text,
            source_language: source,
            target_language: target,
            model: this.model,
            translated_text: translated,
          });
          return { text: translated, complete: true };
        } catch (error) {
          if (!(error instanceof InvalidTranslationError))
            this.unavailableUntil = Date.now() + 30000;
          this.logger.warn(
            `Translation unavailable: ${error instanceof Error ? error.message : 'unknown error'}`,
          );
          return { text, complete: false };
        }
      });
      this.pending.set(key, job);
      this.queue = job.then<void>(() => undefined);
      void job.finally(() => this.pending.delete(key));
      return job;
    } catch {
      this.logger.warn(
        'Translation cache unavailable; returning original content',
      );
      return { text, complete: false };
    }
  }

  async localize(
    data: unknown,
    language: ContentLanguage,
    route: string,
    budget = 15000,
  ): Promise<{ data: unknown; status: string }> {
    let status = 'complete';
    let timer: ReturnType<typeof setTimeout>;
    const task = translateContent(data, language, route, async (text) => {
      const result = await this.translateResult(text, language);
      if (!result.complete) status = 'partial';
      return result.text;
    }).then((result) => ({ data: result, status }));
    const timeout = new Promise<{ data: unknown; status: string }>(
      (resolve) => {
        timer = setTimeout(() => resolve({ data, status: 'pending' }), budget);
      },
    );
    try {
      return await Promise.race([task, timeout]);
    } finally {
      clearTimeout(timer);
    }
  }

  private async generate(
    text: string,
    source: ContentLanguage,
    target: ContentLanguage,
  ): Promise<string> {
    const [from, sourceCode] = languages[source];
    const [to, targetCode] = languages[target];
    const response = await fetch(
      `${(process.env.TRANSLATION_URL || 'http://127.0.0.1:11434').replace(/\/$/, '')}/api/chat`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(120000),
        body: JSON.stringify({
          model: this.model,
          stream: false,
          messages: [
            {
              role: 'user',
              content: `You are a professional ${from} (${sourceCode}) to ${to} (${targetCode}) translator. Your goal is to accurately convey the meaning and nuances of the original ${from} text while adhering to ${to} grammar, vocabulary, and cultural sensitivities.\nProduce only the ${to} translation, without any additional explanations or commentary. ${terminology[target]} Please translate the following ${from} text into ${to}:\n\n\n${text}`,
            },
          ],
          options: { temperature: 0, num_ctx: 2048, num_predict: 1024 },
        }),
      },
    );
    if (!response.ok) throw new Error(`Ollama HTTP ${response.status}`);
    const result = (await response.json()) as {
      done?: boolean;
      done_reason?: string;
      message?: { content?: string };
    };
    const output =
      typeof result.message?.content === 'string'
        ? result.message.content.trim()
        : '';
    if (
      result.done !== true ||
      (result.done_reason !== undefined && result.done_reason !== 'stop') ||
      !output ||
      !/\p{L}/u.test(output)
    )
      throw new InvalidTranslationError('Incomplete translation');
    return `${text.match(/^\s*/)?.[0] ?? ''}${output}${text.match(/\s*$/)?.[0] ?? ''}`;
  }
}
