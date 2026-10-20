import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import { Op, Transaction } from 'sequelize';
import { AuthService } from './auth.service';
import { PasswordService } from '../password/password.service';
import { type ContentLanguage } from '../translation/translation-text';
import { ValidationPipe } from '../pipes/validation.pipe';
import { ChangePasswordDto } from './dto/change-password.dto';
import { VerifyAccountCodeDto } from './dto/request-code.dto';
import { UsersController } from '../users/users.controller';
import { AuthorsController } from '../authors/authors.controller';
import { Role } from './enums/role.enum';

type Code = {
  id: number;
  user_id: number;
  code_hash: string;
  expires_at: Date;
  attempts: number;
  new_email?: string;
};
type Where = { where: Record<string, unknown>; transaction?: Transaction };

function codes() {
  let row: Code | null = null;
  let sequence = 0;
  const matches = (where: Record<string, unknown>) =>
    row !== null &&
    Object.entries(where).every(([key, value]) => {
      const actual = row[key as keyof Code];
      if (value && typeof value === 'object') {
        const filter = value as { [Op.gt]?: Date; [Op.lt]?: number };
        return filter[Op.gt]
          ? actual instanceof Date && actual > filter[Op.gt]
          : filter[Op.lt] !== undefined &&
              typeof actual === 'number' &&
              actual < filter[Op.lt];
      }
      return actual === value;
    });
  const snapshot = () =>
    row && {
      ...row,
      destroy: jest.fn(() => {
        row = null;
        return Promise.resolve();
      }),
      increment: jest.fn(() => {
        if (row) row.attempts++;
        return Promise.resolve();
      }),
    };
  return {
    get row() {
      return row;
    },
    restore(value: Code | null) {
      row = value;
    },
    findOne: jest.fn(({ where }: Where) =>
      Promise.resolve(matches(where) ? snapshot() : null),
    ),
    findByPk: jest.fn((id: number) =>
      Promise.resolve(row?.id === id ? snapshot() : null),
    ),
    create: jest.fn((data: Omit<Code, 'id' | 'attempts'>) => {
      row = { ...data, id: ++sequence, attempts: 0 };
      return Promise.resolve(snapshot());
    }),
    destroy: jest.fn(({ where }: Where) => {
      if (!matches(where)) return Promise.resolve(0);
      row = null;
      return Promise.resolve(1);
    }),
    update: jest.fn((data: Partial<Code>, { where }: Where) => {
      if (!matches(where)) return Promise.resolve([0]);
      row = { ...row, ...data };
      return Promise.resolve([1]);
    }),
  };
}

function fixture() {
  const reset = codes();
  const email = codes();
  const deletion = codes();
  const user = {
    id: 7,
    email: 'owner@example.test',
    password: 'old-hash',
    is_deleted: false,
    update: jest.fn((data: { password: string }) => {
      user.password = data.password;
      return Promise.resolve();
    }),
  };
  const mail = {
    sendPasswordResetCode: jest
      .fn<Promise<void>, [string, string, ContentLanguage]>()
      .mockResolvedValue(undefined),
    sendEmailChangeCode: jest
      .fn<Promise<void>, [string, string, string, ContentLanguage]>()
      .mockResolvedValue(undefined),
    sendAccountDeletionCode: jest
      .fn<Promise<void>, [string, string, ContentLanguage]>()
      .mockResolvedValue(undefined),
  };
  const sessions = { destroy: jest.fn(() => Promise.resolve(1)) };
  const transaction = { LOCK: { UPDATE: 'UPDATE' } } as Transaction;
  let queue = Promise.resolve();
  const users = {
    findByPk: jest.fn((id: number) =>
      Promise.resolve(id === user.id ? user : null),
    ),
    findOne: jest.fn(({ where }: { where: { email: string } }) =>
      Promise.resolve(where.email === user.email ? user : null),
    ),
    update: jest.fn(
      (
        data: { email: string },
        {
          where,
        }: { where: { id: number; email: string }; transaction: Transaction },
      ) => {
        if (where.id !== user.id || where.email !== user.email)
          return Promise.resolve([0]);
        user.email = data.email;
        return Promise.resolve([1]);
      },
    ),
    sequelize: {
      transaction: jest.fn((work: (tx: Transaction) => Promise<void>) => {
        const run = queue.then(async () => {
          const before = [reset.row, email.row, deletion.row];
          const previousEmail = user.email;
          const previousPassword = user.password;
          try {
            await work(transaction);
          } catch (error) {
            reset.restore(before[0]);
            email.restore(before[1]);
            deletion.restore(before[2]);
            user.email = previousEmail;
            user.password = previousPassword;
            throw error;
          }
        });
        queue = run.then<void, void>(
          () => undefined,
          () => undefined,
        );
        return run;
      }),
    },
  };
  const passwords = {
    comparePassword: jest.fn((value: string) =>
      Promise.resolve(value === 'OldPassword1'),
    ),
    hashPassword: jest.fn((value: string) => Promise.resolve(`hash:${value}`)),
  };
  const service: AuthService = Object.assign(
    Object.create(AuthService.prototype) as AuthService,
    {
      jwtService: new JwtService(),
      config: new ConfigService({
        JWT_ACCESS_SECRET: 'test-account-code-secret',
      }),
      userRepository: users,
      passwordService: passwords as unknown as PasswordService,
      tokenRepository: sessions,
      resetCodeRepo: reset,
      emailChangeRepo: email,
      deleteCodeRepo: deletion,
      mailService: mail,
      logger: { log: jest.fn(), error: jest.fn() },
    },
  );
  return {
    service,
    user,
    users,
    mail,
    reset,
    email,
    deletion,
    passwords,
    sessions,
    transaction,
  };
}

it('rejects the old current-password contract and nonnumeric confirmation codes', async () => {
  const pipe = new ValidationPipe();
  await expect(
    pipe.transform(
      { currentPassword: 'OldPassword1', newPassword: 'NewPassword1' },
      { type: 'body', metatype: ChangePasswordDto },
    ),
  ).rejects.toMatchObject({ status: 400 });
  await expect(
    pipe.transform(
      { code: 'abcdef' },
      { type: 'body', metatype: VerifyAccountCodeDto },
    ),
  ).rejects.toMatchObject({ status: 400 });
});

it.each([Role.User, Role.Author, Role.Moderator, Role.Admin])(
  '%s cannot bypass self-verification through profile updates',
  async (role) => {
    const actor = { id: 7, email: 'owner@example.test', role };
    const users = Object.create(UsersController.prototype) as UsersController;
    const authors = Object.create(
      AuthorsController.prototype,
    ) as AuthorsController;
    await expect(
      users.updateUser(7, { email: 'new@example.test' }, actor),
    ).rejects.toMatchObject({ status: 403 });
    expect(() =>
      authors.updateAuthor(7, { password: 'NewPassword1' }, undefined, actor),
    ).toThrow('Используйте подтверждение');
  },
);

it('changes the password using the authenticated account email, a code and a single-use proof', async () => {
  const f = fixture();
  await f.service.requestPasswordChangeCode(7, 'zh');
  const [recipient, code, language] =
    f.mail.sendPasswordResetCode.mock.calls[0];
  expect([recipient, language]).toEqual([f.user.email, 'zh']);
  expect(code).toMatch(/^\d{6}$/);
  expect(f.reset.row?.code_hash).not.toBe(code);
  expect(f.user.password).toBe('old-hash');
  const { resetToken } = await f.service.verifyPasswordChangeCode(7, { code });
  await expect(
    f.service.verifyPasswordChangeCode(7, { code }),
  ).rejects.toMatchObject({ status: 401 });
  await expect(
    f.service.resetPassword({ resetToken, newPassword: 'NewPassword1' }, 8),
  ).rejects.toMatchObject({ status: 401 });
  expect(f.user.password).toBe('old-hash');
  const clearCookie = jest.fn();
  const response = { clearCookie } as unknown as Response;
  await f.service.changePassword(
    7,
    { resetToken, newPassword: 'NewPassword1' },
    response,
  );
  expect(f.user.password).toBe('hash:NewPassword1');
  expect(f.sessions.destroy).toHaveBeenCalledWith({
    where: { userId: 7 },
    transaction: f.transaction,
  });
  expect(clearCookie).toHaveBeenCalledTimes(2);
  await expect(
    f.service.resetPassword({ resetToken, newPassword: 'AnotherPassword1' }),
  ).rejects.toMatchObject({ status: 401 });
});

it('keeps public password recovery working and rejects an expired proof', async () => {
  const f = fixture();
  await f.service.requestResetCode({ email: f.user.email }, 'en');
  const { resetToken } = await f.service.verifyResetCode({
    email: f.user.email,
    code: f.mail.sendPasswordResetCode.mock.calls[0][1],
  });
  f.reset.row.expires_at = new Date(0);
  await expect(
    f.service.resetPassword({ resetToken, newPassword: 'NewPassword1' }),
  ).rejects.toMatchObject({ status: 401 });
  expect(f.user.password).toBe('old-hash');
});

it('only one simultaneous password change can consume the verified proof', async () => {
  const f = fixture();
  await f.service.requestPasswordChangeCode(7);
  const { resetToken } = await f.service.verifyPasswordChangeCode(7, {
    code: f.mail.sendPasswordResetCode.mock.calls[0][1],
  });
  const results = await Promise.allSettled([
    f.service.resetPassword({ resetToken, newPassword: 'FirstPassword1' }),
    f.service.resetPassword({ resetToken, newPassword: 'SecondPassword1' }),
  ]);
  expect(
    results.filter((result) => result.status === 'fulfilled'),
  ).toHaveLength(1);
  expect(f.user.update).toHaveBeenCalledTimes(1);
  expect(f.sessions.destroy).toHaveBeenCalledTimes(1);
});

it('keeps the password proof when saving a new password fails', async () => {
  const f = fixture();
  await f.service.requestPasswordChangeCode(7);
  const { resetToken } = await f.service.verifyPasswordChangeCode(7, {
    code: f.mail.sendPasswordResetCode.mock.calls[0][1],
  });
  f.user.update.mockRejectedValueOnce(new Error('DB unavailable'));
  await expect(
    f.service.resetPassword({ resetToken, newPassword: 'NewPassword1' }),
  ).rejects.toThrow('DB unavailable');
  expect(f.reset.row).not.toBeNull();
  expect(f.user.password).toBe('old-hash');
  expect(f.sessions.destroy).not.toHaveBeenCalled();
  await f.service.resetPassword({ resetToken, newPassword: 'NewPassword1' });
  expect(f.user.password).toBe('hash:NewPassword1');
});

it('invalidates pending password and deletion confirmations issued before an email change', async () => {
  const f = fixture();
  await f.service.requestPasswordChangeCode(7);
  const { resetToken } = await f.service.verifyPasswordChangeCode(7, {
    code: f.mail.sendPasswordResetCode.mock.calls[0][1],
  });
  await f.service.requestAccountDeletionCode(7);
  const deletionCode = f.mail.sendAccountDeletionCode.mock.calls[0][1];
  await f.service.requestEmailChangeCode(7, { newEmail: 'new@example.test' });
  await f.service.confirmEmailChange(7, {
    newEmail: 'new@example.test',
    code: f.mail.sendEmailChangeCode.mock.calls[0][1],
  });
  expect([f.reset.row, f.deletion.row]).toEqual([null, null]);
  await expect(
    f.service.resetPassword({ resetToken, newPassword: 'NewPassword1' }),
  ).rejects.toMatchObject({ status: 401 });
  await expect(
    f.service.verifyAccountDeletionCode(7, { code: deletionCode }),
  ).rejects.toMatchObject({ status: 401 });
});

it('sends email change codes to the current address, binds the new address and needs no password', async () => {
  const f = fixture();
  await f.service.requestEmailChangeCode(
    7,
    { newEmail: ' New@Example.test ' },
    'en',
  );
  const [recipient, code, next, language] =
    f.mail.sendEmailChangeCode.mock.calls[0];
  expect([recipient, next, language]).toEqual([
    'owner@example.test',
    'new@example.test',
    'en',
  ]);
  expect(f.user.email).toBe('owner@example.test');
  await expect(
    f.service.confirmEmailChange(8, { newEmail: next, code }),
  ).rejects.toMatchObject({ status: 401 });
  await expect(
    f.service.confirmEmailChange(7, { newEmail: 'other@example.test', code }),
  ).rejects.toMatchObject({ status: 401 });
  await f.service.confirmEmailChange(7, { newEmail: next, code });
  expect(f.user.email).toBe(next);
  expect(f.passwords.comparePassword).not.toHaveBeenCalled();
  await expect(
    f.service.confirmEmailChange(7, { newEmail: next, code }),
  ).rejects.toMatchObject({ status: 401 });
});

it('rejects an email change code when the current address has changed', async () => {
  const f = fixture();
  await f.service.requestEmailChangeCode(7, { newEmail: 'new@example.test' });
  f.user.email = 'changed@example.test';
  await expect(
    f.service.confirmEmailChange(7, {
      newEmail: 'new@example.test',
      code: f.mail.sendEmailChangeCode.mock.calls[0][1],
    }),
  ).rejects.toMatchObject({ status: 401 });
  expect(f.user.email).toBe('changed@example.test');
});

it('rolls back email code consumption if saving the new email fails', async () => {
  const f = fixture();
  await f.service.requestEmailChangeCode(7, { newEmail: 'new@example.test' });
  const payload = {
    newEmail: 'new@example.test',
    code: f.mail.sendEmailChangeCode.mock.calls[0][1],
  };
  f.users.update.mockRejectedValueOnce(new Error('DB unavailable'));
  await expect(f.service.confirmEmailChange(7, payload)).rejects.toThrow(
    'DB unavailable',
  );
  expect(f.email.row).not.toBeNull();
  expect(f.user.email).toBe('owner@example.test');
  await f.service.confirmEmailChange(7, payload);
  expect(f.user.email).toBe('new@example.test');
});

it.each(['password', 'email', 'deletion'] as const)(
  '%s codes expire, reject wrong attempts and throttle resends',
  async (action) => {
    const f = fixture();
    const request = () =>
      action === 'password'
        ? f.service.requestPasswordChangeCode(7)
        : action === 'email'
          ? f.service.requestEmailChangeCode(7, {
              newEmail: 'new@example.test',
            })
          : f.service.requestAccountDeletionCode(7);
    const verify = (code: string) =>
      action === 'password'
        ? f.service.verifyPasswordChangeCode(7, { code })
        : action === 'email'
          ? f.service.confirmEmailChange(7, {
              newEmail: 'new@example.test',
              code,
            })
          : f.service.verifyAccountDeletionCode(7, { code });
    const repository =
      action === 'password'
        ? f.reset
        : action === 'email'
          ? f.email
          : f.deletion;
    await request();
    await expect(request()).rejects.toMatchObject({ status: 429 });
    repository.row.expires_at = new Date(0);
    await expect(verify('123456')).rejects.toMatchObject({ status: 401 });
    await request();
    const correct =
      action === 'password'
        ? f.mail.sendPasswordResetCode.mock.calls.at(-1)[1]
        : action === 'email'
          ? f.mail.sendEmailChangeCode.mock.calls.at(-1)[1]
          : f.mail.sendAccountDeletionCode.mock.calls.at(-1)[1];
    const wrong = correct === '000000' ? '111111' : '000000';
    for (let attempt = 0; attempt < 5; attempt++)
      await expect(verify(wrong)).rejects.toMatchObject({ status: 401 });
    expect(repository.row.attempts).toBe(5);
    await expect(verify(correct)).rejects.toMatchObject({ status: 401 });
    expect(f.user.password).toBe('old-hash');
    expect(f.user.email).toBe('owner@example.test');
  },
);

it.each(['password', 'email', 'deletion'] as const)(
  '%s requests remove undelivered codes on SMTP failure',
  async (action) => {
    const f = fixture();
    f.mail.sendPasswordResetCode.mockRejectedValue(
      new Error('SMTP unavailable'),
    );
    f.mail.sendEmailChangeCode.mockRejectedValue(new Error('SMTP unavailable'));
    f.mail.sendAccountDeletionCode.mockRejectedValue(
      new Error('SMTP unavailable'),
    );
    const request = () =>
      action === 'password'
        ? f.service.requestPasswordChangeCode(7)
        : action === 'email'
          ? f.service.requestEmailChangeCode(7, {
              newEmail: 'new@example.test',
            })
          : f.service.requestAccountDeletionCode(7);
    await expect(request()).rejects.toThrow('SMTP unavailable');
    expect([f.reset.row, f.email.row, f.deletion.row]).toEqual([
      null,
      null,
      null,
    ]);
  },
);

it('only one of two simultaneous correct email confirmations can consume a code', async () => {
  const f = fixture();
  await f.service.requestEmailChangeCode(7, { newEmail: 'new@example.test' });
  const payload = {
    newEmail: 'new@example.test',
    code: f.mail.sendEmailChangeCode.mock.calls[0][1],
  };
  const results = await Promise.allSettled([
    f.service.confirmEmailChange(7, payload),
    f.service.confirmEmailChange(7, payload),
  ]);
  expect(
    results.filter((result) => result.status === 'fulfilled'),
  ).toHaveLength(1);
  expect(f.users.update).toHaveBeenCalledTimes(1);
});
