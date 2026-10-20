import {
  ConflictException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../users/users.model';
import { WINSTON_MODULE_PROVIDER, WinstonLogger } from 'nest-winston';
import { Inject } from '@nestjs/common';
import { AuthUserDto } from '../users/dto/auth-user.dto';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { RegisterDto } from './dto/auth.dto';
import { PasswordService } from '../password/password.service';
import { JwtRefreshPayload } from './strategies/jwt-refresh.strategy';
import { RefreshToken } from './models/refresh-token.model';
import { InjectModel } from '@nestjs/sequelize';
import { ChangePasswordDto } from './dto/change-password.dto';

import { createHash, randomBytes, randomInt, randomUUID } from 'crypto';
import { PasswordResetCode } from './models/password-reset-code.model';
import { MailService } from '../mail/mail.service';
import {
  RequestCodeDto,
  VerifyCodeDto,
  VerifyAccountCodeDto,
} from './dto/request-code.dto';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Op, UniqueConstraintError } from 'sequelize';
import { type ContentLanguage } from '../translation/translation-text';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { EmailChangeCode } from './models/email-change-code.model';
import {
  ConfirmEmailChangeDto,
  RequestEmailChangeCodeDto,
  VerifyCurrentEmailDto,
  VerifyPasswordDto,
} from './dto/email-change.dto';
import { ConfirmDeleteAccountDto } from './dto/delete-account.dto';
import { AccountDeletionCode } from './models/account-deletion-code.model';

// Secure-cookie ставится только если сайт отдаётся по HTTPS.
// COOKIE_SECURE=false нужен, когда production работает по голому http://<ip> (без TLS):
// иначе браузер не сохранит cookie и логин не будет работать.
const COOKIE_SECURE = process.env.COOKIE_SECURE
  ? process.env.COOKIE_SECURE === 'true'
  : process.env.NODE_ENV === 'production';

const COOKIE_BASE = {
  httpOnly: true,
  secure: COOKIE_SECURE,
  sameSite: 'lax' as const,
  path: '/',
};

const ACCESS_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const RESET_CODE_TTL_MS = 15 * 60 * 1000;
const RESET_MAX_ATTEMPTS = 5;

const EMAIL_CODE_TTL_MS = 15 * 60 * 1000;
const EMAIL_MAX_ATTEMPTS = 5;

const DELETE_CODE_TTL_MS = 15 * 60 * 1000;
const DELETE_MAX_ATTEMPTS = 5;

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private config: ConfigService,
    @InjectModel(User) private userRepository: typeof User,
    private passwordService: PasswordService,
    @InjectModel(RefreshToken) private tokenRepository: typeof RefreshToken,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: WinstonLogger,
    @InjectModel(PasswordResetCode)
    private resetCodeRepo: typeof PasswordResetCode,
    private mailService: MailService,
    @InjectModel(EmailChangeCode)
    private emailChangeRepo: typeof EmailChangeCode,
    @InjectModel(AccountDeletionCode)
    private deleteCodeRepo: typeof AccountDeletionCode,
  ) {}

  async register(dto: RegisterDto, res: Response) {
    this.logger.log(
      'info',
      JSON.stringify({
        message: 'Начало регистрации пользователя',
      }),
    );

    const exists = await this.userRepository.findOne({
      where: { email: dto.email },
    });

    if (exists) {
      this.logger.error(
        'error',
        JSON.stringify({
          message: 'Пользователь с такой почтой уже существует',
        }),
      );
      throw new ConflictException('Пользователь с такой почтой уже существует');
    }

    const passwordHash = await this.passwordService.hashPassword(dto.password);

    try {
      const user = await this.userRepository.create({
        email: dto.email,
        password: passwordHash,
        name: dto.name,
        surname: dto.surname,
        second_name: dto.second_name || '',
        date_birthday: dto.date_birthday,
        gender: dto.gender,
        city_id: dto.city_id ?? null,
        country_id: dto.country_id ?? null,
        role: 'user',
      });

      this.logger.log(
        'success',
        JSON.stringify({
          message: 'Пользователь успешно создан',
        }),
      );

      return this.issueTokensAndSetCookies(user, res);
    } catch (error: unknown) {
      this.logger.error(
        'error',
        JSON.stringify({
          message: 'Ошибка при создании пользователя',
          error:
            error instanceof Error
              ? error.message
              : typeof error === 'string'
                ? error
                : 'Unknown error',
        }),
      );
      throw new InternalServerErrorException(
        'Ошибка при создании пользователя',
      );
    }
  }

  async login(dto: AuthUserDto, req: Request, res: Response) {
    this.logger.log(
      'info',
      JSON.stringify({
        message: 'Начало авторизации пользователя',
      }),
    );

    const user = await this.userRepository.findOne({
      where: { email: dto.email },
    });

    if (!user || user.is_deleted) {
      this.logger.error(
        'user',
        JSON.stringify({
          message: 'Неверные данные при входе. Ошибка',
        }),
      );
      throw new UnauthorizedException('Неверные данные');
    }
    const passwordMatch = await this.passwordService.comparePassword(
      dto.password,
      user.password,
    );
    if (!passwordMatch) {
      this.logger.error(
        'user',
        JSON.stringify({
          message: 'Неверные данные при входе. Ошибка',
        }),
      );
      throw new UnauthorizedException('Неверные данные');
    }
    return this.issueTokensAndSetCookies(user, res, req);
  }

  async refresh(
    payload: JwtRefreshPayload & { rawToken: string },
    res: Response,
    req: Request,
  ) {
    try {
      const tokenRecord = await this.tokenRepository.findOne({
        where: { id: payload.jti, userId: payload.sub },
      });

      if (!tokenRecord) {
        this.logger.error(
          'error',
          JSON.stringify({
            message: 'Refresh token not found',
          }),
        );
        throw new UnauthorizedException('Refresh token not found');
      }

      if (tokenRecord.expiresAt < new Date()) {
        this.logger.error(
          'error',
          JSON.stringify({
            message: 'Refresh token expired',
          }),
        );
        await tokenRecord.destroy();
        this.clearCookies(res);
        throw new UnauthorizedException('Refresh token expired');
      }

      const tokenMatch = await bcrypt.compare(
        payload.rawToken,
        tokenRecord.tokenHash,
      );

      if (!tokenMatch) {
        await tokenRecord.destroy();
        this.clearCookies(res);
        throw new UnauthorizedException(
          'Сессия недействительна, войдите заново',
        );
      }
      const removed = await this.tokenRepository.destroy({
        where: { id: tokenRecord.id },
      });
      if (!removed) throw new UnauthorizedException('Сессия уже обновлена');

      const user = await this.userRepository.findByPk(payload.sub);
      if (!user || user.is_deleted) {
        this.logger.error(
          'error',
          JSON.stringify({
            message: 'User not found',
          }),
        );
        throw new UnauthorizedException();
      }

      return this.issueTokensAndSetCookies(user, res, req);
    } catch (e: unknown) {
      this.logger.error(
        'error',
        JSON.stringify({
          message: 'Error refreshing token',
          error:
            e instanceof Error
              ? e.message
              : typeof e === 'string'
                ? e
                : 'Unknown error',
          stack: e instanceof Error ? e.stack : undefined,
        }),
      );
      throw e;
    }
  }

  private assertCodeCooldown(record: { expires_at: Date } | null, ttl: number) {
    if (record && record.expires_at.getTime() - ttl + 60_000 > Date.now())
      throw new HttpException(
        'Повторный код можно запросить через минуту',
        429,
      );
  }

  async requestPasswordChangeCode(
    userId: number,
    language: ContentLanguage = 'ru',
  ) {
    const user = await this.userRepository.findByPk(userId);
    if (!user) throw new UnauthorizedException('Пользователь не найден');
    return this.requestResetCode({ email: user.email }, language);
  }

  async verifyPasswordChangeCode(userId: number, dto: VerifyAccountCodeDto) {
    const user = await this.userRepository.findByPk(userId);
    if (!user) throw new UnauthorizedException('Пользователь не найден');
    return this.verifyResetCode({ email: user.email, code: dto.code });
  }

  async requestResetCode(
    dto: RequestCodeDto,
    language: ContentLanguage = 'ru',
  ) {
    const user = await this.userRepository.findOne({
      where: { email: dto.email },
    });
    if (user) {
      const previous = await this.resetCodeRepo.findOne({
        where: { user_id: user.id },
        order: [['id', 'DESC']],
      });
      this.assertCodeCooldown(previous, RESET_CODE_TTL_MS);
      await this.resetCodeRepo.destroy({ where: { user_id: user.id } });
      const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
      const record = await this.resetCodeRepo.create({
        user_id: user.id,
        code_hash: await bcrypt.hash(code, 10),
        expires_at: new Date(Date.now() + RESET_CODE_TTL_MS),
      });
      try {
        await this.mailService.sendPasswordResetCode(
          user.email,
          code,
          language,
        );
      } catch (error) {
        await record.destroy();
        throw error;
      }
    }
    return { message: 'Если email зарегистрирован, код отправлен' };
  }

  async verifyResetCode(
    dto: VerifyCodeDto,
  ): Promise<{ resetToken: string; message: string }> {
    const user = await this.userRepository.findOne({
      where: { email: dto.email },
    });
    if (!user) throw new UnauthorizedException('Неверный код или email');

    const record = await this.resetCodeRepo.findOne({
      where: { user_id: user.id },
      order: [['id', 'DESC']],
    });

    if (!record)
      throw new UnauthorizedException('Код не найден, запросите новый');
    if (record.expires_at <= new Date()) {
      await record.destroy();
      throw new UnauthorizedException('Код истёк');
    }
    if (record.attempts >= RESET_MAX_ATTEMPTS) {
      await record.destroy();
      throw new UnauthorizedException('Слишком много попыток');
    }

    const match = await bcrypt.compare(dto.code, record.code_hash);
    if (!match) {
      await record.increment('attempts');
      throw new UnauthorizedException('Неверный код');
    }

    const resetToken = await this.jwtService.signAsync(
      { sub: user.id, jti: record.id, purpose: 'password-reset' },
      {
        secret: this.config.getOrThrow('JWT_ACCESS_SECRET'),
        expiresIn: '5m',
      },
    );

    const [updated] = await this.resetCodeRepo.update(
      {
        code_hash:
          'password-reset:' +
          createHash('sha256').update(resetToken).digest('hex'),
        expires_at: new Date(Date.now() + 5 * 60 * 1000),
      },
      {
        where: {
          id: record.id,
          user_id: user.id,
          code_hash: record.code_hash,
          attempts: { [Op.lt]: RESET_MAX_ATTEMPTS },
          expires_at: { [Op.gt]: new Date() },
        },
      },
    );
    if (!updated)
      throw new UnauthorizedException('Код уже использован, запросите новый');
    return {
      resetToken,
      message: 'Код верный, задайте новый пароль',
    };
  }

  async logout(userId: number, res: Response) {
    await this.tokenRepository.destroy({ where: { userId } });
    this.clearCookies(res);
    return { message: 'Выход из профиля успешен' };
  }

  async logoutCurrentSession(jti: string, userId: number, res: Response) {
    await this.tokenRepository.destroy({ where: { id: jti, userId } });
    this.clearCookies(res);
    return { message: 'Session ended' };
  }

  private async issueTokensAndSetCookies(
    user: User,
    res: Response,
    req?: Request,
  ) {
    const jti = randomUUID();

    const [accessToken, refreshToken] = await Promise.all([
      this.signAccessToken(user.id, user.email, user.role, jti),
      this.signRefreshToken(user.id, user.email, user.role, jti),
    ]);

    const tokenHash = await bcrypt.hash(refreshToken, 10);

    await this.tokenRepository.create({
      id: jti,
      userId: user.id,
      tokenHash,
      userAgent: req?.headers['user-agent'] ?? null,
      ip: req?.ip ?? null,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    });

    res.cookie('accessToken', accessToken, {
      ...COOKIE_BASE,
      maxAge: ACCESS_TOKEN_TTL_MS,
    });

    res.cookie('refreshToken', refreshToken, {
      ...COOKIE_BASE,
      maxAge: REFRESH_TOKEN_TTL_MS,
      path: '/',
      httpOnly: true,
    });

    return {
      user: { id: user.id, email: user.email, role: user.role },
    };
  }

  async signAccessToken(
    userId: number,
    email: string,
    role: string,
    jti: string,
  ): Promise<string> {
    return this.jwtService.signAsync(
      { sub: userId, email, role, jti },
      {
        secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
        expiresIn: '24h',
      },
    );
  }

  async signRefreshToken(
    userId: number,
    email: string,
    role: string,
    jti: string,
  ): Promise<string> {
    return this.jwtService.signAsync(
      { sub: userId, email, role, jti },
      {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: '7d',
      },
    );
  }

  private clearCookies(res: Response) {
    res.clearCookie('accessToken', { ...COOKIE_BASE });
    res.clearCookie('refreshToken', { ...COOKIE_BASE, path: '/' });
  }

  async changePassword(userId: number, dto: ChangePasswordDto, res: Response) {
    const result = await this.resetPassword(dto, userId);
    this.clearCookies(res);
    return result;
  }

  @Cron(CronExpression.EVERY_30_MINUTES)
  async cleanupExpiredResetCodes() {
    const result = await this.resetCodeRepo.destroy({
      where: { expires_at: { [Op.lt]: new Date() } },
    });
    if (result > 0) {
      this.logger.log(
        'info',
        JSON.stringify({
          message: `Cleaned up ${result} expired reset codes`,
        }),
      );
    }
  }

  async resetPassword(
    dto: ResetPasswordDto,
    expectedUserId?: number,
  ): Promise<{ message: string }> {
    let payload: { sub: number; jti: number; purpose: string };
    try {
      payload = await this.jwtService.verifyAsync<{
        sub: number;
        jti: number;
        purpose: string;
      }>(dto.resetToken, {
        secret: this.config.getOrThrow('JWT_ACCESS_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Токен истёк, запросите новый код');
    }
    if (
      payload.purpose !== 'password-reset' ||
      (expectedUserId !== undefined && expectedUserId !== payload.sub)
    )
      throw new UnauthorizedException('Неверное подтверждение смены пароля');
    const codeHash =
      'password-reset:' +
      createHash('sha256').update(dto.resetToken).digest('hex');
    const record = await this.resetCodeRepo.findByPk(payload.jti);
    if (
      !record ||
      record.user_id !== payload.sub ||
      record.code_hash !== codeHash ||
      record.expires_at <= new Date()
    )
      throw new UnauthorizedException(
        'Код истёк или уже использован, запросите новый',
      );
    const user = await this.userRepository.findByPk(payload.sub);
    if (!user || user.is_deleted)
      throw new UnauthorizedException('Пользователь не найден');
    if (
      await this.passwordService.comparePassword(dto.newPassword, user.password)
    )
      throw new ConflictException('Новый пароль совпадает с текущим');
    const password = await this.passwordService.hashPassword(dto.newPassword);
    await this.userRepository.sequelize.transaction(async (transaction) => {
      const consumed = await this.resetCodeRepo.destroy({
        where: {
          id: record.id,
          user_id: user.id,
          code_hash: codeHash,
          expires_at: { [Op.gt]: new Date() },
        },
        transaction,
      });
      if (!consumed)
        throw new UnauthorizedException(
          'Подтверждение уже использовано, запросите новый код',
        );
      await user.update({ password }, { transaction });
      await this.tokenRepository.destroy({
        where: { userId: user.id },
        transaction,
      });
    });
    this.logger.log(
      'info',
      JSON.stringify({
        message: 'Пароль изменён с подтверждением почты',
        userId: user.id,
      }),
    );
    return { message: 'Пароль успешно изменён. Войдите заново.' };
  }

  async verifyCurrentEmail(userId: number, dto: VerifyCurrentEmailDto) {
    const user = await this.userRepository.findByPk(userId);
    if (!user) throw new UnauthorizedException('Пользователь не найден');

    if (user.email.toLowerCase() !== dto.email.toLowerCase()) {
      throw new UnauthorizedException('Email не совпадает с текущим');
    }

    return { ok: true };
  }
  private emailChangeCodeValue(
    user: Pick<User, 'id' | 'email'>,
    newEmail: string,
    code: string,
  ) {
    return createHash('sha256')
      .update(
        JSON.stringify([
          'email-change',
          user.id,
          user.email.toLowerCase(),
          newEmail,
          code,
        ]),
      )
      .digest('hex');
  }

  async requestEmailChangeCode(
    userId: number,
    dto: RequestEmailChangeCodeDto,
    language: ContentLanguage = 'ru',
  ) {
    const user = await this.userRepository.findByPk(userId);
    if (!user) throw new UnauthorizedException('Пользователь не найден');
    const newEmail = dto.newEmail.trim().toLowerCase();
    if (user.email.toLowerCase() === newEmail)
      throw new ConflictException('Новый email совпадает с текущим');
    if (await this.userRepository.findOne({ where: { email: newEmail } }))
      throw new ConflictException('Этот email уже зарегистрирован');
    const previous = await this.emailChangeRepo.findOne({
      where: { user_id: user.id },
      order: [['id', 'DESC']],
    });
    this.assertCodeCooldown(previous, EMAIL_CODE_TTL_MS);
    await this.emailChangeRepo.destroy({ where: { user_id: user.id } });
    const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
    const record = await this.emailChangeRepo.create({
      user_id: user.id,
      new_email: newEmail,
      code_hash: await bcrypt.hash(
        this.emailChangeCodeValue(user, newEmail, code),
        10,
      ),
      expires_at: new Date(Date.now() + EMAIL_CODE_TTL_MS),
    });
    try {
      await this.mailService.sendEmailChangeCode(
        user.email,
        code,
        newEmail,
        language,
      );
    } catch (error) {
      await record.destroy();
      throw error;
    }
    this.logger.log(
      'info',
      JSON.stringify({ message: 'Email change code sent', userId: user.id }),
    );
    return { message: 'Код отправлен на текущую почту аккаунта' };
  }

  async confirmEmailChange(userId: number, dto: ConfirmEmailChangeDto) {
    const user = await this.userRepository.findByPk(userId);
    if (!user) throw new UnauthorizedException('Пользователь не найден');
    const newEmail = dto.newEmail.trim().toLowerCase();
    const record = await this.emailChangeRepo.findOne({
      where: { user_id: user.id, new_email: newEmail },
      order: [['id', 'DESC']],
    });
    if (!record)
      throw new UnauthorizedException('Код не найден, запросите новый');
    if (
      record.expires_at <= new Date() ||
      record.attempts >= EMAIL_MAX_ATTEMPTS
    )
      throw new UnauthorizedException('Код истёк или превышен лимит попыток');
    if (
      !(await bcrypt.compare(
        this.emailChangeCodeValue(user, newEmail, dto.code),
        record.code_hash,
      ))
    ) {
      await record.increment('attempts');
      throw new UnauthorizedException('Неверный код');
    }
    const busy = await this.userRepository.findOne({
      where: { email: newEmail },
    });
    if (busy && busy.id !== user.id)
      throw new ConflictException('Этот email уже зарегистрирован');
    try {
      await this.userRepository.sequelize.transaction(async (transaction) => {
        const consumed = await this.emailChangeRepo.destroy({
          where: {
            id: record.id,
            user_id: userId,
            code_hash: record.code_hash,
            attempts: { [Op.lt]: EMAIL_MAX_ATTEMPTS },
            expires_at: { [Op.gt]: new Date() },
          },
          transaction,
        });
        if (!consumed)
          throw new UnauthorizedException(
            'Код уже использован, запросите новый',
          );
        const [updated] = await this.userRepository.update(
          { email: newEmail },
          { where: { id: userId, email: user.email }, transaction },
        );
        if (!updated)
          throw new UnauthorizedException(
            'Email уже изменился, запросите новый код',
          );
        await this.resetCodeRepo.destroy({
          where: { user_id: userId },
          transaction,
        });
        await this.deleteCodeRepo.destroy({
          where: { user_id: userId },
          transaction,
        });
      });
    } catch (error) {
      if (error instanceof UniqueConstraintError)
        throw new ConflictException('Этот email уже зарегистрирован');
      throw error;
    }
    this.logger.log(
      'info',
      JSON.stringify({ message: 'Email changed successfully', userId }),
    );
    return { message: 'Email успешно изменён' };
  }

  async verifyPassword(userId: number, dto: VerifyPasswordDto) {
    const user = await this.userRepository.findByPk(userId);
    if (!user) throw new UnauthorizedException('Пользователь не найден');

    const match = await this.passwordService.comparePassword(
      dto.password,
      user.password,
    );
    if (!match) throw new UnauthorizedException('Неверный пароль');

    return { ok: true };
  }
  @Cron(CronExpression.EVERY_30_MINUTES)
  async cleanupExpiredEmailCodes() {
    const result = await this.emailChangeRepo.destroy({
      where: { expires_at: { [Op.lt]: new Date() } },
    });
    if (result > 0) {
      this.logger.log(
        'info',
        JSON.stringify({
          message: `Cleaned up ${result} expired email change codes`,
        }),
      );
    }
  }

  async requestAccountDeletionCode(
    userId: number,
    language: ContentLanguage = 'ru',
  ) {
    const user = await this.userRepository.findByPk(userId);
    if (!user) throw new UnauthorizedException('Пользователь не найден');
    const previous = await this.deleteCodeRepo.findOne({
      where: { user_id: user.id },
      order: [['id', 'DESC']],
    });
    this.assertCodeCooldown(previous, DELETE_CODE_TTL_MS);
    await this.deleteCodeRepo.destroy({ where: { user_id: user.id } });
    const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
    const record = await this.deleteCodeRepo.create({
      user_id: user.id,
      code_hash: await bcrypt.hash(code, 10),
      expires_at: new Date(Date.now() + DELETE_CODE_TTL_MS),
    });
    try {
      await this.mailService.sendAccountDeletionCode(
        user.email,
        code,
        language,
      );
    } catch (error) {
      await record.destroy();
      throw error;
    }
    this.logger.log(
      'info',
      JSON.stringify({
        message: 'Account deletion code sent',
        userId: user.id,
      }),
    );
    return { message: 'Код отправлен на почту' };
  }

  async verifyAccountDeletionCode(
    userId: number,
    dto: ConfirmDeleteAccountDto,
  ) {
    const user = await this.userRepository.findByPk(userId);
    if (!user) throw new UnauthorizedException('Пользователь не найден');

    const record = await this.deleteCodeRepo.findOne({
      where: { user_id: user.id },
      order: [['id', 'DESC']],
    });

    if (!record)
      throw new UnauthorizedException('Код не найден, запросите новый');
    if (record.expires_at <= new Date()) {
      await record.destroy();
      throw new UnauthorizedException('Код истёк');
    }
    if (record.attempts >= DELETE_MAX_ATTEMPTS) {
      await record.destroy();
      throw new UnauthorizedException('Слишком много попыток');
    }

    const match = await bcrypt.compare(dto.code, record.code_hash);
    if (!match) {
      await record.increment('attempts');
      throw new UnauthorizedException('Неверный код');
    }

    const deletionToken = randomBytes(32).toString('base64url');
    const [updated] = await this.deleteCodeRepo.update(
      {
        code_hash: `deletion:${createHash('sha256').update(deletionToken).digest('hex')}`,
        expires_at: new Date(Date.now() + 5 * 60 * 1000),
        attempts: 0,
      },
      {
        where: {
          id: record.id,
          user_id: userId,
          code_hash: record.code_hash,
          attempts: { [Op.lt]: DELETE_MAX_ATTEMPTS },
          expires_at: { [Op.gt]: new Date() },
        },
      },
    );
    if (!updated)
      throw new UnauthorizedException('Код уже использован, запросите новый');
    return { ok: true, deletionToken };
  }

  @Cron(CronExpression.EVERY_30_MINUTES)
  async cleanupExpiredDeleteCodes() {
    await this.deleteCodeRepo.destroy({
      where: { expires_at: { [Op.lt]: new Date() } },
    });
  }
}
