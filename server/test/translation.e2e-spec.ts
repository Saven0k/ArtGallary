import {
  CanActivate,
  Controller,
  ForbiddenException,
  Get,
  INestApplication,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { Server } from 'node:http';
import { TranslationFilter } from '../src/translation/translation.filter';
import { TranslationInterceptor } from '../src/translation/translation.interceptor';
import { TranslationService } from '../src/translation/translation.service';
import {
  ContentLanguage,
  translateContent,
} from '../src/translation/translation-text';

class RejectGuard implements CanActivate {
  canActivate(): boolean {
    throw new ForbiddenException('Доступ запрещён');
  }
}

const original = {
  title: 'Пейзаж',
  description: 'Описание',
  name: 'Иван',
  surname: 'Белый',
  role: 'author',
  cost: 123,
  currency: 'RUB',
  status: 'on_sale',
};

@Controller('works')
class ContentController {
  @Get()
  read() {
    return original;
  }

  @Patch()
  write() {
    return original;
  }

  @Get('private')
  @UseGuards(RejectGuard)
  privateRead() {
    return original;
  }
}

describe('translation HTTP contract', () => {
  let app: INestApplication;
  const translations = {
    enabled: true,
    localize: jest.fn(
      async (data: unknown, language: ContentLanguage, route: string) => ({
        data: await translateContent(data, language, route, (text) =>
          Promise.resolve(`${language}:${text}`),
        ),
        status: 'complete',
      }),
    ),
  };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [ContentController],
      providers: [
        RejectGuard,
        { provide: TranslationService, useValue: translations },
        { provide: APP_INTERCEPTOR, useClass: TranslationInterceptor },
        { provide: APP_FILTER, useClass: TranslationFilter },
      ],
    }).compile();
    app = module.createNestApplication();
    await app.init();
  });
  afterAll(() => app.close());
  beforeEach(() => jest.clearAllMocks());

  it('translates read responses while preserving identity, money and status', async () => {
    const response = await request(app.getHttpServer() as Server)
      .get('/works?lang=zh')
      .expect(200);
    expect(response.body).toEqual({
      ...original,
      title: 'zh:Пейзаж',
      description: 'zh:Описание',
    });
    expect(response.headers['content-language']).toBe('zh');
    expect(response.headers['x-translation-status']).toBe('complete');
    expect(original.title).toBe('Пейзаж');
  });

  it('returns an exact original for editing and still rejects forbidden reads', async () => {
    const response = await request(app.getHttpServer() as Server)
      .get('/works?lang=en&original=true')
      .expect(200);
    expect(response.body).toEqual(original);
    expect(translations.localize).not.toHaveBeenCalled();
    const forbidden = await request(app.getHttpServer() as Server)
      .get('/works/private?lang=zh&original=true')
      .expect(403);
    expect(forbidden.body).toMatchObject({
      statusCode: 403,
      message: 'Доступ запрещён',
    });
  });

  it('localizes guard errors without changing the HTTP status and gives writes a short budget', async () => {
    const response = await request(app.getHttpServer() as Server)
      .get('/works/private?lang=en')
      .expect(403);
    expect(response.body).toMatchObject({
      statusCode: 403,
      message: 'en:Доступ запрещён',
    });
    expect(response.headers['content-language']).toBe('en');
    await request(app.getHttpServer() as Server)
      .patch('/works?lang=ru')
      .expect(200);
    expect(translations.localize).toHaveBeenLastCalledWith(
      original,
      'ru',
      '/works',
      200,
    );
  });
});
