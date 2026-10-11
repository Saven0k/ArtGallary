import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { TelegramApi, TelegramApiError } from './telegram-api.service';

describe('Telegram transport', () => {
  const token = '123456:abcdefghijklmnopqrstuvwxyz';
  afterEach(() => jest.restoreAllMocks());

  it('uses a CONNECT proxy only for Telegram and preserves TLS verification', async () => {
    const post = jest
      .fn()
      .mockResolvedValue({ status: 200, data: { ok: true, result: [] } });
    const create = jest
      .spyOn(axios, 'create')
      .mockReturnValue({ post } as unknown as ReturnType<typeof axios.create>);
    const api = new TelegramApi(
      new ConfigService({
        TELEGRAM_BOT_ENABLED: 'true',
        TELEGRAM_BOT_TOKEN: token,
        TELEGRAM_PROXY_URL: 'http://127.0.0.1:8080',
      }),
    );
    await api.call('getUpdates', {});
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        proxy: false,
        maxRedirects: 0,
      }),
    );
    const agent = create.mock.calls[0][0]
      ?.httpsAgent as HttpsProxyAgent<string>;
    expect(agent).toBeInstanceOf(HttpsProxyAgent);
    expect(agent.options.rejectUnauthorized).not.toBe(false);
  });

  it('never exposes the bot token or proxy credentials through transport errors', async () => {
    jest.spyOn(axios, 'create').mockReturnValue({
      post: jest
        .fn()
        .mockRejectedValue(new Error(`secret ${token} proxy-password`)),
    } as unknown as ReturnType<typeof axios.create>);
    const api = new TelegramApi(
      new ConfigService({
        TELEGRAM_BOT_ENABLED: 'true',
        TELEGRAM_BOT_TOKEN: token,
      }),
    );
    await expect(api.call('getMe', {})).rejects.toThrow(
      'Telegram connection unavailable',
    );
  });

  it('exposes retry delays without copying Telegram response descriptions', async () => {
    jest.spyOn(axios, 'create').mockReturnValue({
      post: jest.fn().mockResolvedValue({
        status: 429,
        data: {
          ok: false,
          error_code: 429,
          description: token,
          parameters: { retry_after: 40 },
        },
      }),
    } as unknown as ReturnType<typeof axios.create>);
    const api = new TelegramApi(
      new ConfigService({
        TELEGRAM_BOT_ENABLED: 'true',
        TELEGRAM_BOT_TOKEN: token,
      }),
    );
    await expect(api.call('sendMessage', {})).rejects.toMatchObject({
      code: 429,
      retryAfter: 40,
      message: 'Telegram API error 429',
    });
    expect(new TelegramApiError(403).message).toBe('Telegram API error 403');
  });
});
