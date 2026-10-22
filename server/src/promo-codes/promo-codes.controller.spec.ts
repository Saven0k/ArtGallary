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
import { PromoCodesController } from './promo-codes.controller';
import { PromoCodesService } from './promo-codes.service';
import { CartHistoryController } from '../cart-history/cart-history.controller';
import { CartHistoryService } from '../cart-history/cart-history.service';

describe('promo code API permissions and trust boundaries', () => {
  let app: INestApplication;
  let role = 'admin';
  const secret = 'promo-test-secret';
  const service = {
    list: jest.fn().mockResolvedValue({ items: [] }),
    create: jest.fn().mockResolvedValue({ code: 'WELCOME' }),
    setActive: jest.fn().mockResolvedValue({ active: false }),
    getValid: jest.fn().mockResolvedValue({
      id: 1,
      code: 'WELCOME',
      percent: 10,
      expiresAt: null,
      active: true,
    }),
  };
  const orders = { checkout: jest.fn().mockResolvedValue({ id: 1 }) };
  const auth = () =>
    `accessToken=${new JwtService().sign({ sub: 7, jti: 'promo-session', role: 'admin' }, { secret, expiresIn: '1m' })}`;
  const api = () => request(app.getHttpServer() as Server);

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
      controllers: [PromoCodesController, CartHistoryController],
      providers: [
        { provide: PromoCodesService, useValue: service },
        { provide: CartHistoryService, useValue: orders },
        { provide: JwtAccessStrategy, useValue: strategy },
      ],
    }).compile();
    app = module.createNestApplication();
    app.use(cookieParser());
    await app.init();
  });
  afterAll(async () => app.close());
  beforeEach(() => {
    role = 'admin';
    jest.clearAllMocks();
  });

  it('denies anonymous requests and prevents every non-admin role from managing promo codes', async () => {
    await api()
      .post('/promo-codes/validate')
      .send({ code: 'WELCOME' })
      .expect(401);
    await api().get('/promo-codes').expect(401);
    for (const denied of ['user', 'author', 'moderator']) {
      role = denied;
      await api().get('/promo-codes').set('Cookie', auth()).expect(403);
      await api()
        .post('/promo-codes')
        .set('Cookie', auth())
        .send({ code: 'WELCOME', percent: 10 })
        .expect(403);
      await api()
        .patch('/promo-codes/1')
        .set('Cookie', auth())
        .send({ active: false })
        .expect(403);
    }
    expect(service.list).not.toHaveBeenCalled();
    expect(service.create).not.toHaveBeenCalled();
    expect(service.setActive).not.toHaveBeenCalled();
  });

  it('lets every authenticated role validate a code without exposing management fields', async () => {
    for (const allowed of ['user', 'author', 'moderator', 'admin']) {
      role = allowed;
      const response = await api()
        .post('/promo-codes/validate')
        .set('Cookie', auth())
        .send({ code: ' welcome ' })
        .expect(201);
      expect(response.body).toEqual({
        code: 'WELCOME',
        percent: 10,
        expiresAt: null,
      });
    }
    expect(service.getValid).toHaveBeenCalledWith('WELCOME');
  });

  it('normalizes administrator input, defaults pagination and strips forbidden fields', async () => {
    await api()
      .post('/promo-codes')
      .set('Cookie', auth())
      .send({ code: ' new_code ', percent: 15, active: false, id: 999 })
      .expect(201);
    expect(service.create).toHaveBeenCalledWith({
      code: 'NEW_CODE',
      percent: 15,
    });
    await api().get('/promo-codes?lang=zh').set('Cookie', auth()).expect(200);
    expect(service.list).toHaveBeenCalledWith({ page: 1, limit: 20 });
    await api()
      .patch('/promo-codes/1')
      .set('Cookie', auth())
      .send({ active: false, percent: 100 })
      .expect(200);
    expect(service.setActive).toHaveBeenCalledWith(1, false);
  });

  it('rejects malformed codes, percentages, dates, flags and unbounded pages', async () => {
    for (const body of [
      { code: 'a', percent: 10 },
      { code: 'BAD SPACE', percent: 10 },
      { code: 'A'.repeat(33), percent: 10 },
      { code: 123, percent: 10 },
      { code: 'VALID', percent: 0 },
      { code: 'VALID', percent: 101 },
      { code: 'VALID', percent: 1.5 },
      { code: 'VALID', percent: '10' },
      { code: 'VALID', percent: 10, expiresAt: 'invalid' },
    ])
      await api()
        .post('/promo-codes')
        .set('Cookie', auth())
        .send(body)
        .expect(400);
    await api()
      .patch('/promo-codes/1')
      .set('Cookie', auth())
      .send({ active: 'true' })
      .expect(400);
    await api()
      .patch('/promo-codes/nope')
      .set('Cookie', auth())
      .send({ active: true })
      .expect(400);
    for (const query of ['page=0', 'page=1.5', 'limit=101', 'limit=-1'])
      await api()
        .get(`/promo-codes?${query}`)
        .set('Cookie', auth())
        .expect(400);
    expect(service.create).not.toHaveBeenCalled();
    expect(service.setActive).not.toHaveBeenCalled();
    expect(service.list).not.toHaveBeenCalled();
  });

  it('accepts any valid database promo code on checkout but never a client-selected buyer, discount or total', async () => {
    role = 'user';
    await api()
      .post('/cart-history/checkout')
      .set('Cookie', auth())
      .send({
        userId: 8,
        items: [{ artId: 7, quantity: 2, price: 1 }],
        promoCode: ' new_code ',
        discount: 999,
        percent: 100,
        total: 0,
      })
      .expect(201);
    expect(orders.checkout).toHaveBeenCalledWith(7, {
      items: [{ artId: 7, quantity: 2 }],
      promoCode: 'NEW_CODE',
    });
  });
});
