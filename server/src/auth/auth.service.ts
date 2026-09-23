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

const COOKIE_BASE = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: 'lax' as const,
    path: '/'
}

const ACCESS_TOKEN_TTL_MS = 24 * 60 * 60 * 1000
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000

@Injectable()
export class AuthService {

    constructor(
        private jwtService: JwtService,
        private config: ConfigService,
        @InjectModel(User) private userRepository: typeof User,
        private passwordService: PasswordService,
        @InjectModel(RefreshToken) private tokenRepository: typeof RefreshToken,
        @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: WinstonLogger
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
}