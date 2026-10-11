import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { STATIC_DIR } from '../shared/helpers/static-dir.helper';

export class TelegramApiError extends Error {
  constructor(
    readonly code: number,
    readonly retryAfter = 10,
  ) {
    super(`Telegram API error ${code}`);
  }
}

@Injectable()
export class TelegramApi {
  readonly configured: boolean;
  private readonly client: AxiosInstance;
  private readonly abort = new AbortController();
  private username: string | null = null;

  constructor(config: ConfigService) {
    const token = config.get<string>('TELEGRAM_BOT_TOKEN', '').trim();
    this.configured =
      config.get('TELEGRAM_BOT_ENABLED') === 'true' &&
      /^\d+:[\w-]{20,}$/.test(token);
    const proxy = config.get<string>('TELEGRAM_PROXY_URL', '').trim();
    if (proxy && !['http:', 'https:'].includes(new URL(proxy).protocol))
      throw new Error('TELEGRAM_PROXY_URL must use http:// or https://');
    this.client = axios.create({
      baseURL: `https://api.telegram.org/bot${token}/`,
      timeout: 35000,
      maxContentLength: 2 * 1024 * 1024,
      maxBodyLength: 12 * 1024 * 1024,
      maxRedirects: 0,
      proxy: false,
      ...(proxy && { httpsAgent: new HttpsProxyAgent(proxy) }),
      signal: this.abort.signal,
    });
  }

  stop() {
    this.abort.abort();
  }

  async call<T>(method: string, data: object): Promise<T> {
    if (!this.configured) throw new Error('Telegram bot is not configured');
    try {
      const response = await this.client.post<{
        ok: boolean;
        result: T;
        error_code?: number;
        parameters?: { retry_after?: number };
      }>(method, data, { validateStatus: () => true });
      if (response.data.ok !== true)
        throw new TelegramApiError(
          response.data.error_code || response.status,
          response.data.parameters?.retry_after,
        );
      return response.data.result;
    } catch (error) {
      if (error instanceof TelegramApiError) throw error;
      throw new Error('Telegram connection unavailable');
    }
  }

  async botUsername(): Promise<string> {
    if (!this.username) {
      const bot = await this.call<{ username: string; is_bot: boolean }>(
        'getMe',
        {},
      );
      if (!bot.is_bot || !/^[a-zA-Z0-9_]{5,32}$/.test(bot.username))
        throw new Error('Invalid Telegram bot identity');
      this.username = bot.username;
    }
    return this.username;
  }

  async sendCard(
    chatId: string,
    text: string,
    keyboard: object,
    image?: string,
  ): Promise<number> {
    const match = /\/static\/([a-f0-9-]{36}\.(png|jpe?g|gif|webp))$/i.exec(
      image || '',
    );
    if (match) {
      try {
        const bytes = await readFile(join(STATIC_DIR, match[1]));
        if (bytes.length <= 10 * 1024 * 1024) {
          const form = new FormData();
          form.set('chat_id', chatId);
          form.set('caption', text.slice(0, 1000));
          form.set('reply_markup', JSON.stringify(keyboard));
          form.set('photo', new Blob([new Uint8Array(bytes)]), match[1]);
          const result = await this.call<{ message_id: number }>(
            'sendPhoto',
            form,
          );
          if (text.length > 1000)
            await this.call('sendMessage', {
              chat_id: chatId,
              text,
              link_preview_options: { is_disabled: true },
            });
          return result.message_id;
        }
      } catch (error) {
        if (
          error instanceof TelegramApiError &&
          [403, 429].includes(error.code)
        )
          throw error;
      }
    }
    const result = await this.call<{ message_id: number }>('sendMessage', {
      chat_id: chatId,
      text,
      reply_markup: keyboard,
      link_preview_options: { is_disabled: true },
    });
    return result.message_id;
  }
}
