import { type Server } from 'http';
import { type INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { JwtAccessStrategy } from '../auth/strategies/jwt-access.strategy';
import { User } from '../users/users.model';
import { RefreshToken } from '../auth/models/refresh-token.model';
import { StatsController } from './stats.controller';
import { StatsService } from './stats.service';

describe('Author statistics access', () => {
  let app: INestApplication;
  const secret = 'stats-test-secret';
  let role = 'author';
  const service = {
    getAuthorStats: jest.fn().mockResolvedValue({ authorId: 7 }),
    getArt: jest
      .fn()
      .mockImplementation((id: number) =>
        Promise.resolve({ id, author_id: id === 10 ? 7 : 8 }),
      ),
    getArtStats: jest.fn().mockResolvedValue({ artId: 10 }),
  };
  const token = () =>
    new JwtService().sign(
      { sub: 7, jti: 'stats-session', role: 'author' },
      { secret, expiresIn: '1m' },
    );
  const get = (url: string) =>
    request(app.getHttpServer() as Server)
      .get(url)
      .set('Cookie', `accessToken=${token()}`);

  beforeAll(async () => {
    const strategy = new JwtAccessStrategy(
      new ConfigService({ JWT_ACCESS_SECRET: secret }),
      {
        findByPk: () => Promise.resolve({ id: 7, role, is_deleted: false }),
      } as unknown as typeof User,
      {
        findOne: () =>
          Promise.resolve({ expiresAt: new Date(Date.now() + 60000) }),
      } as unknown as typeof RefreshToken,
    );
    const module = await Test.createTestingModule({
      controllers: [StatsController],
      providers: [
        { provide: StatsService, useValue: service },
        { provide: JwtAccessStrategy, useValue: strategy },
      ],
    }).compile();
    app = module.createNestApplication();
    app.use(cookieParser());
    await app.init();
  });
  afterAll(async () => app.close());
  beforeEach(() => {
    role = 'author';
    jest.clearAllMocks();
  });

  it('derives the author from the verified session, ignoring a supplied author id', async () => {
    await get(
      '/stats/me?authorId=8&lang=zh&startDate=2026-10-01&endDate=2026-10-22',
    ).expect(200);
    expect(service.getAuthorStats).toHaveBeenCalledWith(7, {
      lang: 'zh',
      startDate: '2026-10-01',
      endDate: '2026-10-22',
    });
  });

  it('allows own author and art statistics and rejects someone else data', async () => {
    await get('/stats/author/7').expect(200);
    await get('/stats/author/8').expect(403);
    await get('/stats/art/10?ageFrom=18&ageTo=24&lang=en').expect(200);
    await get('/stats/art/11').expect(403);
    expect(service.getAuthorStats).toHaveBeenCalledTimes(1);
    expect(service.getArtStats).toHaveBeenCalledTimes(1);
  });

  it('rejects anonymous visitors, users, moderators and admins on all statistics endpoints', async () => {
    await request(app.getHttpServer() as Server)
      .get('/stats/me')
      .expect(401);
    for (const denied of ['user', 'moderator', 'admin']) {
      role = denied;
      for (const url of ['/stats/me', '/stats/author/7', '/stats/art/10'])
        await get(url).expect(403);
    }
    expect(service.getAuthorStats).not.toHaveBeenCalled();
    expect(service.getArt).not.toHaveBeenCalled();
  });

  it('validates dates, age bounds, integer location ids and language before querying data', async () => {
    for (const query of [
      'startDate=oops',
      'startDate=2026-02-31',
      'ageFrom=-1',
      'ageFrom=121',
      'ageTo=-1',
      'ageTo=2.5',
      'countryId=0',
      'cityId=1.5',
      'lang=invalid',
      'gender=x',
    ])
      await get(`/stats/me?${query}`).expect(400);
    expect(service.getAuthorStats).not.toHaveBeenCalled();
  });
});
