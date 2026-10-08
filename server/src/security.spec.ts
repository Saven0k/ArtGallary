import { createHash, randomBytes } from 'crypto';
import { type ExecutionContext } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AccountDeletionGuard } from './auth/guards/account-deletion.guard';
import { AccountDeletionCode } from './auth/models/account-deletion-code.model';
import { UsersController } from './users/users.controller';
import 'reflect-metadata';
import fs from 'fs/promises';
import { ConfigService } from '@nestjs/config';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { HttpException } from '@nestjs/common';
import { JwtAccessStrategy } from './auth/strategies/jwt-access.strategy';
import { JwtAccessGuard } from './auth/guards/jwt.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { Role } from './auth/enums/role.enum';
import { AuthService } from './auth/auth.service';
import { RefreshToken } from './auth/models/refresh-token.model';
import { User } from './users/users.model';
import { UsersService } from './users/users.service';
import { ValidationPipe } from './pipes/validation.pipe';
import { CreateArtDto } from './arts/dto/create-art.dto';
import { RegisterDto } from './auth/dto/auth.dto';
import { UpdateArtDTO } from './arts/dto/update-art.dto';
import { UpdateAuthorDto } from './authors/dto/update-author.dto';
import { AuthorsController } from './authors/authors.controller';
import { AuthorsService } from './authors/authors.service';
import { AuthorFollowService } from './authors/author-follow.service';
import { ArtsController } from './arts/arts.controller';
import { ArtsService } from './arts/arts.service';
import { SubscriptionService } from './subscriptions/subscriptions.service';
import { FilesService, MAX_FILE_SIZE } from './files/files.service';

const user = { id: 7, email: 'author@example.com', role: Role.Author };
const logger = { log: jest.fn(), error: jest.fn() };

test('followers are notified only when moderation publishes an available work', async () => {
  for (const [previous, approved, status, count] of [
    [false, false, 'on_sale', 0],
    [false, true, 'on_sale', 1],
    [true, true, 'on_sale', 0],
    [false, true, 'archived', 0],
  ] as const) {
    const transaction = {
      LOCK: { UPDATE: 'UPDATE' },
      commit: jest.fn(),
      rollback: jest.fn(),
    };
    const notifyFollowers = jest.fn();
    const service = serviceWith(ArtsService.prototype, {
      sequelize: { transaction: () => Promise.resolve(transaction) },
      artRepository: {
        findByPk: () =>
          Promise.resolve({
            id: 4,
            author_id: 7,
            title: 'Morning',
            status,
            moderate: JSON.stringify({ moderate: previous }),
          }),
        update: jest.fn(),
      },
      notifyFollowers,
      updateScore: jest.fn(),
      findArtWithLocation: jest.fn(),
    });
    await service.moderateArt({ moderate: approved, moderator_id: 1 }, 4);
    expect(notifyFollowers).toHaveBeenCalledTimes(count);
    if (count)
      expect(notifyFollowers).toHaveBeenCalledWith(
        7,
        4,
        'Morning',
        transaction,
      );
    expect(transaction.commit).toHaveBeenCalled();
  }
});

function serviceWith<T extends object>(prototype: T, dependencies: object): T {
  return Object.assign(Object.create(prototype) as T, dependencies);
}

afterEach(() => jest.restoreAllMocks());

test('registration validates and keeps optional country and city identifiers', async () => {
  const pipe = new ValidationPipe();
  const data = {
    email: 'qa@example.test',
    password: 'Secret123',
    name: 'Name',
    surname: 'Surname',
    date_birthday: '1990-01-01',
    gender: 'M',
    country_id: 1,
    city_id: 2,
  };
  const result = (await pipe.transform(data, {
    type: 'body',
    metatype: RegisterDto,
  })) as RegisterDto;
  expect(result.country_id).toBe(1);
  expect(result.city_id).toBe(2);
  await expect(
    pipe.transform(
      { ...data, country_id: 0 },
      { type: 'body', metatype: RegisterDto },
    ),
  ).rejects.toThrow(HttpException);
});

test('protected author mutations and subscriptions require authentication and role guards', () => {
  for (const name of [
    'moderateAuthor',
    'restoreAuthor',
    'deleteAuthor',
    'getSubscriptionInfo',
    'purchaseSubscription',
    'cancelSubscription',
  ]) {
    const method = AuthorsController.prototype[name as keyof AuthorsController];
    const guards = Reflect.getMetadata(GUARDS_METADATA, method) as unknown[];
    expect(guards).toEqual(
      expect.arrayContaining([JwtAccessGuard, RolesGuard]),
    );
  }
});

test('moderation stores the authenticated actor instead of a supplied actor', () => {
  const moderateAuthor = jest.fn();
  const controller = new AuthorsController(
    { moderateAuthor } as unknown as AuthorsService,
    {} as SubscriptionService,
    {} as AuthorFollowService,
  );
  void controller.moderateAuthor({ moderate: true, moderator_id: 999 }, 12, 7);
  expect(moderateAuthor).toHaveBeenCalledWith(
    { moderate: true, moderator_id: 7 },
    12,
  );
});

test('multipart art fields are converted and an author can create their own art', async () => {
  const dto = (await new ValidationPipe().transform(
    {
      title: 'Art',
      description: '',
      date_published: '2026-01-01',
      author_id: '7',
      is_adult: 'false',
      tags: '["landscape"]',
      moderate: '{"moderate":true}',
    },
    { type: 'body', metatype: CreateArtDto },
  )) as CreateArtDto;
  expect(dto.author_id).toBe(7);
  expect(dto.is_adult).toBe(false);
  expect(dto.tags).toEqual(['landscape']);
  expect(dto).not.toHaveProperty('moderate');
  const createArt = jest.fn();
  const controller = new ArtsController({
    createArt,
  } as unknown as ArtsService);
  void controller.createArt(dto, undefined, user);
  expect(createArt).toHaveBeenCalledWith(dto, undefined, 7);
  expect(() =>
    controller.createArt({ ...dto, author_id: 8 }, undefined, user),
  ).toThrow(HttpException);
});

test('art updates cannot overwrite ownership, moderation, or counters', async () => {
  const dto = (await new ValidationPipe().transform(
    {
      title: 'Updated',
      author_id: 999,
      artist_id: 999,
      moderate: '{}',
      likes: 999,
      views: 999,
      score: 999,
      image_path: '/outside/file',
    },
    { type: 'body', metatype: UpdateArtDTO },
  )) as UpdateArtDTO;
  expect(Object.keys(dto)).toEqual(['title']);
});

test('profile clearing preserves explicit null location and empty text fields', async () => {
  const dto = (await new ValidationPipe().transform(
    {
      country_id: 'null',
      city_id: null,
      avatar_path: 'null',
      biography: '',
      second_name: '',
    },
    { type: 'body', metatype: UpdateAuthorDto },
  )) as UpdateAuthorDto;
  expect(dto).toMatchObject({
    country_id: null,
    city_id: null,
    avatar_path: null,
    biography: '',
    second_name: '',
  });
});

test('access requires a live session and uses current account role', async () => {
  const users = {
    findByPk: jest
      .fn()
      .mockResolvedValue({ ...user, role: Role.User, is_deleted: false }),
  };
  const sessions = {
    findOne: jest
      .fn()
      .mockResolvedValue({ expiresAt: new Date(Date.now() + 60000) }),
  };
  const strategy = new JwtAccessStrategy(
    new ConfigService({ JWT_ACCESS_SECRET: 'test-secret' }),
    users as unknown as typeof User,
    sessions as unknown as typeof RefreshToken,
  );
  const payload = {
    sub: 7,
    email: user.email,
    role: Role.Admin,
    jti: 'a-live-session',
  };
  await expect(strategy.validate(payload)).resolves.toMatchObject({
    role: Role.User,
  });
  sessions.findOne.mockResolvedValueOnce(null);
  await expect(strategy.validate(payload)).rejects.toThrow(HttpException);
  users.findByPk.mockResolvedValueOnce({ ...user, is_deleted: true });
  await expect(strategy.validate(payload)).rejects.toThrow(HttpException);
});

test('deleted accounts cannot log in', async () => {
  const auth = serviceWith(AuthService.prototype, {
    userRepository: {
      findOne: jest.fn().mockResolvedValue({ ...user, is_deleted: true }),
    },
    logger,
  });
  await expect(
    auth.login(
      { email: user.email, password: 'password123' },
      undefined,
      undefined,
    ),
  ).rejects.toThrow(HttpException);
});

test('unapproved or archived art is hidden from guests but available to its owner', async () => {
  const draft = {
    id: 3,
    author_id: 7,
    status: 'on_sale',
    moderate: { moderate: false },
    author: { is_deleted: false, user: { is_deleted: false } },
  };
  const service = serviceWith(ArtsService.prototype, {
    getArtById: jest.fn().mockResolvedValue(draft),
  });
  await expect(service.getAccessibleArtById(3)).rejects.toThrow(HttpException);
  await expect(service.getAccessibleArtById(3, user)).resolves.toEqual(draft);
  const getArtById = jest.spyOn(service, 'getArtById');
  getArtById.mockResolvedValueOnce({
    ...draft,
    moderate: { moderate: true },
  } as unknown as Awaited<ReturnType<ArtsService['getArtById']>>);
  await expect(service.getAccessibleArtById(3)).resolves.toMatchObject({
    id: 3,
  });
  getArtById.mockResolvedValueOnce({
    ...draft,
    moderate: { moderate: true },
    status: 'archived',
  } as unknown as Awaited<ReturnType<ArtsService['getArtById']>>);
  await expect(service.getAccessibleArtById(3)).rejects.toThrow(HttpException);
});

test('author restoration loads deleted accounts rather than hiding them', async () => {
  const transaction = { commit: jest.fn(), rollback: jest.fn() };
  const update = jest.fn();
  const findOne = jest.fn().mockResolvedValue({ id: 7, update });
  const service = serviceWith(AuthorsService.prototype, {
    sequelize: { transaction: jest.fn().mockResolvedValue(transaction) },
    userRepository: { findOne },
    authorProfileModel: {
      findOne: jest.fn().mockResolvedValue({
        is_deleted: true,
        deleted_at: new Date(),
        update,
      }),
    },
    logger,
  });
  await expect(service.restoreAuthor(7)).resolves.toMatchObject({
    success: true,
  });
  const calls = findOne.mock.calls as Array<
    [{ where: Record<string, unknown> }]
  >;
  const options = calls[0][0];
  expect(options.where).not.toHaveProperty('is_deleted');
});

test('HTML disguised as an image is rejected and extensions come from image bytes', async () => {
  const service = new FilesService();
  await expect(
    service.createFile({
      buffer: Buffer.from('<script>alert(1)</script>'),
      size: 25,
      mimetype: 'image/jpeg',
      originalname: 'payload.html',
    }),
  ).rejects.toThrow(HttpException);
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jXioAAAAASUVORK5CYII=',
    'base64',
  );
  jest.spyOn(fs, 'mkdir').mockResolvedValue(undefined);
  const write = jest.spyOn(fs, 'writeFile').mockResolvedValue(undefined);
  await expect(
    service.createFile({
      buffer: png,
      size: png.length,
      mimetype: 'image/jpeg',
      originalname: 'payload.html',
    }),
  ).resolves.toMatch(/\.png$/);
  expect(write).toHaveBeenCalledTimes(1);
  await expect(
    service.createFile({
      buffer: Buffer.alloc(MAX_FILE_SIZE + 1),
      size: 0,
      mimetype: 'image/png',
      originalname: 'big.png',
    }),
  ).rejects.toThrow(HttpException);
});

test('user list queries explicitly exclude password hashes', async () => {
  const findAll = jest.fn().mockResolvedValue([]);
  const service = serviceWith(UsersService.prototype, {
    userRepository: { findAll },
  });
  await service.getAllUsers();
  expect(findAll).toHaveBeenCalledWith(
    expect.objectContaining({ attributes: { exclude: ['password'] } }),
  );
});

test('art creation stores the author and writes tags in the same transaction', async () => {
  const transaction = { commit: jest.fn(), rollback: jest.fn() };
  const art = {
    id: 3,
    author_id: 7,
    likes: 0,
    views: 0,
    date_published: new Date(),
    $set: jest.fn(),
    update: jest.fn(),
  };
  const create = jest.fn().mockResolvedValue(art);
  const service = serviceWith(ArtsService.prototype, {
    authorProfileModel: {
      findByPk: jest
        .fn()
        .mockResolvedValue({ is_deleted: false, user: { is_deleted: false } }),
      findOne: jest.fn().mockResolvedValue({ subscription: null }),
    },
    sequelize: { transaction: jest.fn().mockResolvedValue(transaction) },
    artRepository: { create },
    fileService: {
      createFile: jest
        .fn()
        .mockResolvedValue('http://localhost/static/test.png'),
    },
    tagsService: { findOrCreateTags: jest.fn().mockResolvedValue([]) },
    notifyFollowers: jest.fn(),
    findArtWithLocation: jest.fn().mockResolvedValue(art),
  });
  await service.createArt(
    {
      title: 'Art',
      description: '',
      author_id: 7,
      date_published: new Date(),
      tags: ['landscape'],
    },
    undefined,
    7,
  );
  expect(create).toHaveBeenCalledWith(
    expect.objectContaining({ author_id: 7 }),
    { transaction },
  );
  expect(art.$set).toHaveBeenCalledWith('tags', [], { transaction });
  expect(transaction.commit).toHaveBeenCalledTimes(1);
});

test('email verification issues a short-lived, hashed, one-use deletion proof', async () => {
  const record = {
    id: 3,
    user_id: 7,
    attempts: 0,
    expires_at: new Date(Date.now() + 60000),
    code_hash: await bcrypt.hash('123456', 4),
  };
  const update = jest.fn().mockResolvedValue([1]);
  const auth = serviceWith(AuthService.prototype, {
    userRepository: { findByPk: jest.fn().mockResolvedValue(user) },
    deleteCodeRepo: { findOne: jest.fn().mockResolvedValue(record), update },
  });
  const result = await auth.verifyAccountDeletionCode(7, { code: '123456' });
  expect(result.deletionToken).toMatch(/^[A-Za-z0-9_-]{43}$/);
  expect(update).toHaveBeenCalledTimes(1);
  const calls = update.mock.calls as Array<
    [
      { code_hash: string; expires_at: Date },
      { where: { id: number; user_id: number; code_hash: string } },
    ]
  >;
  expect(calls[0][0].code_hash).toBe(
    `deletion:${createHash('sha256').update(result.deletionToken).digest('hex')}`,
  );
  expect(calls[0][1].where).toMatchObject({
    id: 3,
    user_id: 7,
    code_hash: record.code_hash,
  });
  expect(calls[0][0].expires_at.getTime() - Date.now()).toBeLessThanOrEqual(
    5 * 60 * 1000,
  );
});

test('self deletion requires a matching unexpired proof, consumed atomically once', async () => {
  const token = randomBytes(32).toString('base64url');
  const hash = `deletion:${createHash('sha256').update(token).digest('hex')}`;
  const records = [
    { user_id: 7, code_hash: hash, expires_at: new Date(Date.now() + 60000) },
  ];
  const destroy = jest
    .fn()
    .mockImplementation(
      ({ where }: { where: { user_id: number; code_hash: string } }) => {
        const index = records.findIndex(
          (record) =>
            record.user_id === where.user_id &&
            record.code_hash === where.code_hash &&
            record.expires_at > new Date(),
        );
        if (index < 0) return Promise.resolve(0);
        records.splice(index, 1);
        return Promise.resolve(1);
      },
    );
  const guard = new AccountDeletionGuard({
    destroy,
  } as unknown as typeof AccountDeletionCode);
  const context = (
    actor = user,
    headers: Record<string, string> = {},
    target = '7',
  ) =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ user: actor, params: { id: target }, headers }),
      }),
    }) as unknown as ExecutionContext;
  await expect(guard.canActivate(context())).rejects.toThrow(HttpException);
  await expect(
    guard.canActivate(
      context(user, {
        'x-account-deletion-token': randomBytes(32).toString('base64url'),
      }),
    ),
  ).rejects.toThrow(HttpException);
  await expect(
    guard.canActivate(
      context({ ...user, id: 8 }, { 'x-account-deletion-token': token }, '8'),
    ),
  ).rejects.toThrow(HttpException);
  await expect(
    guard.canActivate(context(user, { 'x-account-deletion-token': token })),
  ).resolves.toBe(true);
  await expect(
    guard.canActivate(context(user, { 'x-account-deletion-token': token })),
  ).rejects.toThrow(HttpException);
  for (const controller of [UsersController, AuthorsController]) {
    const method = Reflect.get(
      controller.prototype,
      controller === UsersController ? 'deleteUser' : 'deleteAuthor',
    ) as object;
    const guards = Reflect.getMetadata(GUARDS_METADATA, method) as unknown[];
    expect(guards).toContain(AccountDeletionGuard);
  }
  records.push({
    user_id: 7,
    code_hash: hash,
    expires_at: new Date(Date.now() - 60000),
  });
  await expect(
    guard.canActivate(context(user, { 'x-account-deletion-token': token })),
  ).rejects.toThrow(HttpException);
  await expect(
    guard.canActivate(context({ ...user, role: Role.Admin }, {}, '8')),
  ).resolves.toBe(true);
  await expect(
    guard.canActivate(context({ ...user, role: Role.Admin })),
  ).rejects.toThrow(HttpException);
});
