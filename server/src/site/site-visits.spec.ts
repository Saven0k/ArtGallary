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
import { SiteController } from './site.controller';
import { SiteVisitService } from './site-visit.service';
import { SiteRatingService } from './site-rating.service';
import { SiteVisit } from './models/site-visit.model';
import { SiteRating } from './models/site-rating.model';

describe('Site visit collection', () => {
  let app: INestApplication;
  const secret = 'site-visit-test-secret';
  const create = jest.fn().mockResolvedValue({});
  const service = new SiteVisitService(
    { create } as unknown as typeof SiteVisit,
    {} as typeof SiteRating,
  );
  const getStats = jest.spyOn(service, 'getStats').mockResolvedValue({
    totalVisits: 8,
    todayVisits: 3,
    weekVisits: 5,
    monthVisits: 8,
    uniqueUsers: 1,
    averageRating: 0,
    ratingsCount: 0,
    topPaths: [{ path: '/services', count: 3 }],
  });

  beforeAll(async () => {
    const strategy = new JwtAccessStrategy(
      new ConfigService({ JWT_ACCESS_SECRET: secret }),
      {
        findByPk: () =>
          Promise.resolve({ id: 7, role: 'admin', is_deleted: false }),
      } as unknown as typeof User,
      {
        findOne: () =>
          Promise.resolve({ expiresAt: new Date(Date.now() + 60_000) }),
      } as unknown as typeof RefreshToken,
    );
    const module = await Test.createTestingModule({
      controllers: [SiteController],
      providers: [
        { provide: SiteVisitService, useValue: service },
        { provide: SiteRatingService, useValue: {} },
        { provide: JwtAccessStrategy, useValue: strategy },
      ],
    }).compile();
    app = module.createNestApplication();
    app.use(cookieParser());
    await app.init();
  });

  afterAll(async () => app.close());
  beforeEach(() => jest.clearAllMocks());

  it('accepts anonymous visits and records signed-in users from verified cookies', async () => {
    const token = new JwtService().sign(
      { sub: 7, jti: 'test-session' },
      { secret, expiresIn: '1m' },
    );
    for (const [cookie, userId] of [
      ['', null],
      ['accessToken=invalid', null],
      [`accessToken=${token}`, 7],
    ] as const) {
      await request(app.getHttpServer() as Server)
        .post('/site/visit')
        .set('Cookie', cookie)
        .set('User-Agent', 'Gallery test')
        .send({ path: '/services', user_id: 99 })
        .expect(204);
      expect(create).toHaveBeenLastCalledWith({
        user_id: userId,
        ip: expect.any(String) as string,
        user_agent: 'Gallery test',
        path: '/services',
      });
    }
  });

  it('rejects oversized paths and paths containing query strings or fragments', async () => {
    for (const path of [
      '/' + 'a'.repeat(255),
      '/reset?token=secret',
      '/#secret',
      'https://other.test',
    ]) {
      await request(app.getHttpServer() as Server)
        .post('/site/visit')
        .send({ path })
        .expect(400);
    }
    expect(create).not.toHaveBeenCalled();
  });

  it('protects statistics and returns visits even when no one rated the site', async () => {
    await request(app.getHttpServer() as Server)
      .get('/site/stats')
      .expect(401);
    const token = new JwtService().sign(
      { sub: 7, jti: 'test-session' },
      { secret, expiresIn: '1m' },
    );
    const response = await request(app.getHttpServer() as Server)
      .get('/site/stats')
      .set('Cookie', `accessToken=${token}`)
      .expect(200);
    expect(response.body).toMatchObject({ totalVisits: 8, ratingsCount: 0 });
    expect(getStats).toHaveBeenCalledTimes(1);
  });
});
