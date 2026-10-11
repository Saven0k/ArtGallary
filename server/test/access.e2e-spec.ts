import {
  ExecutionContext,
  INestApplication,
  UnauthorizedException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Request } from 'express';
import request from 'supertest';
import { Server } from 'node:http';
import { ProfessionsController } from '../src/professions/professions.controller';
import { ProfessionsService } from '../src/professions/professions.service';
import { SiteController } from '../src/site/site.controller';
import { SiteVisitService } from '../src/site/site-visit.service';
import { SiteRatingService } from '../src/site/site-rating.service';
import { JwtAccessGuard } from '../src/auth/guards/jwt.guard';
import { RolesGuard } from '../src/auth/guards/roles.guard';
import { EventsController } from '../src/events/events.controller';
import { EventsService } from '../src/events/events.service';
import { NotificationController } from '../src/notifications/notification.controller';
import { NotificationService } from '../src/notifications/notification.service';
import { TelegramController } from '../src/telegram/telegram.controller';
import { TelegramService } from '../src/telegram/telegram.service';

describe('HTTP access and validation', () => {
  let app: INestApplication;
  const create = jest.fn(() => ({ id: 1, name: 'Artist' }));
  const rate = jest.fn((userId: number, value: number) => ({ userId, value }));
  const updateSettings = jest.fn((userId: number, body: object) => ({
    userId,
    ...body,
  }));
  const telegram = {
    status: jest.fn(() => ({ configured: true, linked: false })),
    createLink: jest.fn(() => ({
      url: 'https://t.me/GalleryTestBot?start=test',
    })),
    unlink: jest.fn(() => ({ linked: false })),
  };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [
        ProfessionsController,
        SiteController,
        EventsController,
        NotificationController,
        TelegramController,
      ],
      providers: [
        { provide: ProfessionsService, useValue: { create, getAll: () => [] } },
        { provide: SiteVisitService, useValue: {} },
        { provide: SiteRatingService, useValue: { rate } },
        { provide: EventsService, useValue: { create } },
        { provide: NotificationService, useValue: { updateSettings } },
        { provide: TelegramService, useValue: telegram },
        RolesGuard,
      ],
    })
      .overrideGuard(JwtAccessGuard)
      .useValue({
        canActivate(context: ExecutionContext) {
          const req = context
            .switchToHttp()
            .getRequest<Request & { user: { id: number; role: string } }>();
          const role = req.headers['x-test-role'];
          if (typeof role !== 'string') throw new UnauthorizedException();
          req.user = { id: 7, role };
          return true;
        },
      })
      .compile();
    app = module.createNestApplication();
    await app.init();
  });

  afterAll(() => app.close());
  beforeEach(() => jest.clearAllMocks());

  it('keeps dictionary reading public', async () => {
    await request(app.getHttpServer() as Server)
      .get('/professions')
      .expect(200);
  });

  it('protects every Telegram endpoint from anonymous and ordinary accounts', async () => {
    for (const role of [undefined, 'user', 'author']) {
      for (const [method, path] of [
        ['get', '/telegram/status'],
        ['post', '/telegram/link'],
        ['delete', '/telegram/link'],
      ] as const) {
        const call = request(app.getHttpServer() as Server)[method](path);
        if (role) call.set('x-test-role', role);
        await call.expect(role ? 403 : 401);
      }
    }
    expect(telegram.status).not.toHaveBeenCalled();
    expect(telegram.createLink).not.toHaveBeenCalled();
    expect(telegram.unlink).not.toHaveBeenCalled();
  });

  it('links and unlinks only the authenticated staff account', async () => {
    for (const role of ['admin', 'moderator']) {
      await request(app.getHttpServer() as Server)
        .get('/telegram/status')
        .set('x-test-role', role)
        .expect(200);
      await request(app.getHttpServer() as Server)
        .post('/telegram/link')
        .set('x-test-role', role)
        .send({ userId: 99 })
        .expect(201);
      await request(app.getHttpServer() as Server)
        .delete('/telegram/link')
        .set('x-test-role', role)
        .expect(200);
    }
    for (const method of Object.values(telegram))
      expect(method).toHaveBeenCalledWith(7);
  });

  it('requires authentication for notification preferences', async () => {
    await request(app.getHttpServer() as Server)
      .patch('/notifications/settings')
      .send({ emailEnabled: true })
      .expect(401);
    expect(updateSettings).not.toHaveBeenCalled();
  });

  it('validates notification preferences and only changes the current account', async () => {
    await request(app.getHttpServer() as Server)
      .patch('/notifications/settings')
      .set('x-test-role', 'user')
      .send({ emailEnabled: 'false' })
      .expect(400);
    expect(updateSettings).not.toHaveBeenCalled();
    await request(app.getHttpServer() as Server)
      .patch('/notifications/settings')
      .set('x-test-role', 'moderator')
      .send({ emailEnabled: false, userId: 99 })
      .expect(200);
    expect(updateSettings).toHaveBeenCalledWith(7, { emailEnabled: false });
  });

  it('requires a session for dictionary creation', async () => {
    await request(app.getHttpServer() as Server)
      .post('/professions')
      .send({ name: 'Artist' })
      .expect(401);
    expect(create).not.toHaveBeenCalled();
  });

  it('rejects ordinary users before changing the dictionary', async () => {
    await request(app.getHttpServer() as Server)
      .post('/professions')
      .set('x-test-role', 'user')
      .send({ name: 'Artist' })
      .expect(403);
    expect(create).not.toHaveBeenCalled();
  });

  it('validates input before admin dictionary creation', async () => {
    await request(app.getHttpServer() as Server)
      .post('/professions')
      .set('x-test-role', 'admin')
      .send({ name: 123 })
      .expect(400);
    expect(create).not.toHaveBeenCalled();
  });

  it('accepts valid admin dictionary creation', async () => {
    await request(app.getHttpServer() as Server)
      .post('/professions')
      .set('x-test-role', 'admin')
      .send({ name: 'Artist' })
      .expect(201);
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Artist' }),
    );
  });

  it('rejects ratings outside the supported range', async () => {
    await request(app.getHttpServer() as Server)
      .post('/site/rating')
      .set('x-test-role', 'user')
      .send({ value: 0 })
      .expect(400);
    expect(rate).not.toHaveBeenCalled();
  });

  it('validates event fields before creating an admin event', async () => {
    await request(app.getHttpServer() as Server)
      .post('/events')
      .set('x-test-role', 'admin')
      .send({ title: '', description: 123 })
      .expect(400);
    expect(create).not.toHaveBeenCalled();
  });
});
