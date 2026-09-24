import { ConflictException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
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
import { v4 as uuidv4 } from 'uuid';
import { InjectModel } from '@nestjs/sequelize';
import { ChangePasswordDto } from './dto/change-password.dto';

import { randomInt } from 'crypto';
import { PasswordResetCode } from './models/password-reset-code.model';
import { MailService } from '../mail/mail.service';
import { RequestCodeDto, VerifyCodeDto } from './dto/request-code.dto';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Op } from 'sequelize';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { EmailChangeCode } from './models/email-change-code.model';
import { ConfirmEmailChangeDto, RequestEmailChangeCodeDto, VerifyCurrentEmailDto, VerifyPasswordDto } from './dto/email-change.dto';

const COOKIE_BASE = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: 'lax' as const,
    path: '/'
}

const ACCESS_TOKEN_TTL_MS = 24 * 60 * 60 * 1000
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000


const RESET_CODE_TTL_MS = 15 * 60 * 1000;
const RESET_MAX_ATTEMPTS = 5;

const EMAIL_CODE_TTL_MS = 15 * 60 * 1000;
const EMAIL_MAX_ATTEMPTS = 5;

@Injectable()
export class AuthService {

    constructor(
        private jwtService: JwtService,
        private config: ConfigService,
        @InjectModel(User) private userRepository: typeof User,
        private passwordService: PasswordService,
        @InjectModel(RefreshToken) private tokenRepository: typeof RefreshToken,
        @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: WinstonLogger,
        @InjectModel(PasswordResetCode) private resetCodeRepo: typeof PasswordResetCode,
        private mailService: MailService,
        @InjectModel(EmailChangeCode) private emailChangeRepo: typeof EmailChangeCode,
    ) { }

    async register(dto: RegisterDto, res: Response | any) {
        this.logger.log('info', JSON.stringify({
            message: "Начало регистрации пользователя"
        }));

        const exists = await this.userRepository.findOne({
            where: { email: dto.email }
        });

        if (exists) {
            this.logger.error('error', JSON.stringify({
                message: "Пользователь с такой почтой уже существует",
            }));
            throw new ConflictException("Пользователь с такой почтой уже существует");
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
                role: 'user'
            });

            this.logger.log('success', JSON.stringify({
                message: "Пользователь успешно создан"
            }));

            return this.issueTokensAndSetCookies(user, res);
        } catch (error: any) {
            this.logger.error('error', JSON.stringify({
                message: "Ошибка при создании пользователя",
                error: error.message
            }));
            throw new InternalServerErrorException('Ошибка при создании пользователя');
        }
    }

    async login(dto: AuthUserDto, req: Request, res: Response | any) {
        this.logger.log('info', JSON.stringify({
            "message": "Начало авторизации пользователя"
        }))

        const user = await this.userRepository.findOne({ where: { email: dto.email } });

        if (!user) {
            this.logger.error('user', JSON.stringify({
                "message": "Неверные данные при входе. Ошибка"
            }))
            throw new UnauthorizedException("Неверные данные")
        }
        const passwordMatch = await this.passwordService.comparePassword(dto.password, user.password);
        if (!passwordMatch) {
            this.logger.error('user', JSON.stringify({
                "message": "Неверные данные при входе. Ошибка"
            }))
            throw new UnauthorizedException("Неверные данные")
        }
        return this.issueTokensAndSetCookies(user, res, req);
    }


    async refresh(payload: JwtRefreshPayload & { rawToken: string }, res: Response | any, req: Request) {
        try {

            const tokenRecord = await this.tokenRepository.findOne({ where: { id: payload.jti, userId: payload.sub } })

            if (!tokenRecord) {
                this.logger.error("error", JSON.stringify({
                    message: "Refresh token not found"
                }))
                throw new UnauthorizedException("Refresh token not found");
            }


            if (tokenRecord.expiresAt < new Date()) {
                this.logger.error("error", JSON.stringify({
                    "message": "Refresh token expired"
                }))
                await tokenRecord.destroy();
                this.clearCookies(res);
                throw new UnauthorizedException("Refresh token expired");
            }

            const tokenMatch = await bcrypt.compare(payload.rawToken, tokenRecord.tokenHash);

            if (!tokenMatch) {
                await tokenRecord.destroy();
                this.clearCookies(res);
                throw new UnauthorizedException('Сессия недействительна, войдите заново');
            }
            await this.tokenRepository.destroy({
                where: { id: tokenRecord.id }
            });

            const user = await this.userRepository.findByPk(payload.sub);
            if (!user) {
                this.logger.error("error", JSON.stringify({
                    "message": "User not found"
                }))
                throw new UnauthorizedException();
            }

            return this.issueTokensAndSetCookies(user, res, req);
        } catch (e: any) {
            this.logger.error("error", JSON.stringify({
                message: "Error refreshing token",
                error: e.message,
                stack: e.stack
            }));
            throw e;
        }
    }

    async requestResetCode(dto: RequestCodeDto) {
        const user = await this.userRepository.findOne({ where: { email: dto.email } });

        if (user) {
            await this.resetCodeRepo.destroy({ where: { user_id: user.id } });

            const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
            const codeHash = await bcrypt.hash(code, 10);

            await this.resetCodeRepo.create({
                user_id: user.id,
                code_hash: codeHash,
                expires_at: new Date(Date.now() + RESET_CODE_TTL_MS),
            });

            await this.mailService.sendPasswordResetCode(user.email, code);
        }

        // Всегда одинаковый ответ — нельзя перебором узнать, зарегистрирован email или нет
        return { message: 'Если email зарегистрирован, код отправлен' };
    }

    async verifyResetCode(dto: VerifyCodeDto): Promise<{ resetToken: string; message: string }> {
        const user = await this.userRepository.findOne({ where: { email: dto.email } });
        if (!user) throw new UnauthorizedException('Неверный код или email');

        const record = await this.resetCodeRepo.findOne({
            where: { user_id: user.id },
            order: [['id', 'DESC']],
        });

        if (!record) throw new UnauthorizedException('Код не найден, запросите новый');
        if (record.expires_at < new Date()) {
            await record.destroy();
            throw new UnauthorizedException('Код истёк');
        }
        if (record.attempts >= RESET_MAX_ATTEMPTS) {
            await record.destroy();
            throw new UnauthorizedException('Слишком много попыток');
        }

        const match = await bcrypt.compare(dto.code, record.code_hash);
        if (!match) {
            record.attempts += 1;
            await record.save();
            throw new UnauthorizedException('Неверный код');
        }

        // Код верный → выдаём resetToken на 5 минут
        const resetToken = await this.jwtService.signAsync(
            { sub: user.id, jti: record.id, purpose: 'password-reset' },
            {
                secret: this.config.getOrThrow('JWT_ACCESS_SECRET'),
                expiresIn: '5m',
            } as any,
        );

        return {
            resetToken,
            message: 'Код верный, задайте новый пароль',
        };
    }


    async logout(userId: number, res: Response | any) {
        await this.tokenRepository.destroy({ where: { userId } });
        this.clearCookies(res);
        return { message: "Выход из профиля успешен" }
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
        const jti = uuidv4();

        const [accessToken, refreshToken] = await Promise.all([
            this.signAccessToken(user.id, user.email, user.role),
            this.signRefreshToken(user.id, user.email, user.role, jti),
        ])

        const tokenHash = await bcrypt.hash(refreshToken, 10);

        await this.tokenRepository.create({
            id: jti,
            userId: user.id,
            tokenHash,
            userAgent: req?.headers['user-agent'] ?? null,
            ip: req?.ip ?? null,
            expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS)
        });

        res.cookie('accessToken', accessToken, {
            ...COOKIE_BASE,
            maxAge: ACCESS_TOKEN_TTL_MS,
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === 'production'
        })

        res.cookie('refreshToken', refreshToken, {
            ...COOKIE_BASE,
            maxAge: REFRESH_TOKEN_TTL_MS,
            path: "/",
            httpOnly: true
        })

        return {
            user: { id: user.id, email: user.email, role: user.role }
        }
    }


    async signAccessToken(userId: number, email: string, role: string): Promise<string> {
        return this.jwtService.signAsync(
            { sub: userId, email, role },
            {
                secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
                expiresIn: '24h',
            } as any
        )
    }

    async signRefreshToken(userId: number, email: string, role: string, jti: string): Promise<string> {
        return this.jwtService.signAsync(
            { sub: userId, email, role, jti },
            {
                secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
                expiresIn: '7d',
            } as any,
        )
    }

    private clearCookies(res: Response) {
        res.clearCookie('accessToken', { ...COOKIE_BASE });
        res.clearCookie('refreshToken', { ...COOKIE_BASE, path: '/' });
    }

    // Добавить в конец класса AuthService

    async changePassword(
        userId: number,
        dto: ChangePasswordDto,
        res: Response | any,
        req: Request,
    ) {
        this.logger.log('info', JSON.stringify({
            message: 'Запрос на смену пароля',
            userId,
        }));

        const user = await this.userRepository.findByPk(userId);
        if (!user) {
            throw new UnauthorizedException('Пользователь не найден');
        }

        const match = await this.passwordService.comparePassword(
            dto.currentPassword,
            user.password,
        );
        if (!match) {
            this.logger.error('error', JSON.stringify({
                message: 'Неверный текущий пароль',
                userId,
            }));
            throw new UnauthorizedException('Неверный текущий пароль');
        }
        const isSame = await this.passwordService.comparePassword(
            dto.newPassword,
            user.password,
        );
        if (isSame) {
            throw new ConflictException('Новый пароль совпадает с текущим');
        }

        const newHash = await this.passwordService.hashPassword(dto.newPassword);
        user.password = newHash;
        await user.save();

        await this.tokenRepository.destroy({ where: { userId } });

        this.logger.log('success', JSON.stringify({
            message: 'Пароль успешно изменён, все сессии сброшены',
            userId,
        }));

        await this.issueTokensAndSetCookies(user, res, req);

        return { message: 'Пароль успешно изменён' };
    }

    @Cron(CronExpression.EVERY_30_MINUTES)
    async cleanupExpiredResetCodes() {
        const result = await this.resetCodeRepo.destroy({
            where: { expires_at: { [Op.lt]: new Date() } },
        });
        if (result > 0) {
            this.logger.log('info', JSON.stringify({
                message: `Cleaned up ${result} expired reset codes`,
            }));
        }
    }


    async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
        let payload: any;
        try {
            payload = await this.jwtService.verifyAsync(dto.resetToken, {
                secret: this.config.getOrThrow('JWT_ACCESS_SECRET'),
            });
        } catch {
            throw new UnauthorizedException('Токен истёк, запросите новый код');
        }

        if (payload.purpose !== 'password-reset') {
            throw new UnauthorizedException('Неверный тип токена');
        }

        const record = await this.resetCodeRepo.findByPk(payload.jti);
        if (!record) {
            throw new UnauthorizedException('Код уже использован, запросите новый');
        }

        const user = await this.userRepository.findByPk(payload.sub);
        if (!user) throw new UnauthorizedException('Пользователь не найден');

        const isSame = await this.passwordService.comparePassword(dto.newPassword, user.password);
        if (isSame) throw new ConflictException('Новый пароль совпадает с текущим');

        user.password = await this.passwordService.hashPassword(dto.newPassword);
        await user.save();

        // Код одноразовый
        await record.destroy();

        // Убиваем все refresh-сессии
        await this.tokenRepository.destroy({ where: { userId: user.id } });

        this.logger.log('info', JSON.stringify({
            message: 'Пароль восстановлен через код',
            userId: user.id,
        }));

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
    async requestEmailChangeCode(userId: number, dto: RequestEmailChangeCodeDto) {
        const user = await this.userRepository.findByPk(userId);
        if (!user) throw new UnauthorizedException('Пользователь не найден');

        if (user.email.toLowerCase() === dto.newEmail.toLowerCase()) {
            throw new ConflictException('Новый email совпадает с текущим');
        }

        const busy = await this.userRepository.findOne({ where: { email: dto.newEmail } });
        if (busy) {
            throw new ConflictException('Этот email уже зарегистрирован');
        }

        // Удаляем старые коды этого пользователя
        await this.emailChangeRepo.destroy({ where: { user_id: user.id } });

        const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
        const codeHash = await bcrypt.hash(code, 10);

        await this.emailChangeRepo.create({
            user_id: user.id,
            new_email: dto.newEmail,
            code_hash: codeHash,
            expires_at: new Date(Date.now() + EMAIL_CODE_TTL_MS),
        });

        await this.mailService.sendEmailChangeCode(dto.newEmail, code);

        this.logger.log('info', JSON.stringify({
            message: 'Email change code sent',
            userId: user.id,
            newEmail: dto.newEmail,
        }));

        return { message: 'Код отправлен на новый email' };
    }

    async confirmEmailChange(userId: number, dto: ConfirmEmailChangeDto) {
        const user = await this.userRepository.findByPk(userId);
        if (!user) throw new UnauthorizedException('Пользователь не найден');

        // 1. Пароль
        const match = await this.passwordService.comparePassword(dto.password, user.password);
        if (!match) {
            this.logger.error('error', JSON.stringify({
                message: 'Email change: wrong password',
                userId: user.id,
            }));
            throw new UnauthorizedException('Неверный пароль');
        }

        // 2. Код
        const record = await this.emailChangeRepo.findOne({
            where: { user_id: user.id, new_email: dto.newEmail },
            order: [['id', 'DESC']],
        });

        if (!record) throw new UnauthorizedException('Код не найден, запросите новый');
        if (record.expires_at < new Date()) {
            await record.destroy();
            throw new UnauthorizedException('Код истёк');
        }
        if (record.attempts >= EMAIL_MAX_ATTEMPTS) {
            await record.destroy();
            throw new UnauthorizedException('Слишком много попыток');
        }

        const codeMatch = await bcrypt.compare(dto.code, record.code_hash);
        if (!codeMatch) {
            record.attempts += 1;
            await record.save();
            throw new UnauthorizedException('Неверный код');
        }

        // 3. На всякий случай: не занят ли email кем-то ещё
        const busy = await this.userRepository.findOne({ where: { email: dto.newEmail } });
        if (busy && busy.id !== user.id) {
            throw new ConflictException('Этот email уже зарегистрирован');
        }

        // 4. Меняем email, удаляем код
        user.email = dto.newEmail;
        await user.save();
        await record.destroy();

        this.logger.log('info', JSON.stringify({
            message: 'Email changed successfully',
            userId: user.id,
            newEmail: dto.newEmail,
        }));

        return { message: 'Email успешно изменён' };
    } async verifyPassword(userId: number, dto: VerifyPasswordDto) {
        const user = await this.userRepository.findByPk(userId);
        if (!user) throw new UnauthorizedException('Пользователь не найден');

        const match = await this.passwordService.comparePassword(dto.password, user.password);
        if (!match) throw new UnauthorizedException('Неверный пароль');

        return { ok: true };
    } @Cron(CronExpression.EVERY_30_MINUTES)
    async cleanupExpiredEmailCodes() {
        const result = await this.emailChangeRepo.destroy({
            where: { expires_at: { [Op.lt]: new Date() } },
        });
        if (result > 0) {
            this.logger.log('info', JSON.stringify({
                message: `Cleaned up ${result} expired email change codes`,
            }));
        }
    }

}