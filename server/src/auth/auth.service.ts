import { ConflictException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcryptjs';
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

const COOKIE_BASE = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: 'strict' as const,
    path: '/'
}

const ACCESS_TOKEN_TTL_MS = 15 * 60 * 1000
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000

@Injectable()
export class AuthService {

    constructor(
        private userService: UsersService,
        private jwtService: JwtService,
        private config: ConfigService,
        @InjectModel(User) private userRepository: typeof User,
        private passwordService: PasswordService,
        @InjectModel(RefreshToken) private tokenRepository: typeof RefreshToken,
        @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: WinstonLogger
    ) { }

    async register(dto: RegisterDto, res: Response | any) {
        this.logger.log('info', JSON.stringify({
            "message": "Начало Регистрации пользователя"
        }))

        const exists = await this.userRepository.findOne({ where: { email: dto.email } });
        if (exists) {
            this.logger.error('error', JSON.stringify({
                message: "Пользователь с такой почтой уже существует",
            }))
            throw new ConflictException("Пользователь с такой почтой уже существует");
        }
        const passwordHash = await this.passwordService.hashPassword(dto.password);

        try {
            const newUser: any = {};
            if (dto.email) newUser.email = dto.email;
            if (dto.password) newUser.password = passwordHash;
            if (dto.name) newUser.name = dto.name;
            if (dto.surname) newUser.surname = dto.surname;
            if (dto.second_name) newUser.second_name = dto.second_name;
            if (dto.phone_number) newUser.phone_number = dto.phone_number;
            newUser.role = "user";

            const user = await this.userRepository.create(newUser);
            this.logger.log('success', JSON.stringify({
                message: " Пользователь успешно создан"
            }))
            return this.issueTokensAndSetCookies(user, res);
        }
        catch {
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
                this.logger.error("error", JSON.stringify({
                    "message": "Refresh token mismatch"
                }))
                await this.tokenRepository.destroy({ where: { userId: payload.sub } });
                this.clearCookies(res);
                throw new UnauthorizedException("Refresh token mismatch");
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
        } catch (e:any) {
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
            this.signRefershToken(user.id, user.email, user.role, jti),
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
            secure: false
        })

        res.cookie('refreshToken', refreshToken, {
            ...COOKIE_BASE,
            maxAge: REFRESH_TOKEN_TTL_MS,
            path: "/auth/refresh",
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
                secret: this.config.get("JWT_ACCESS_SECRET"),
                expiresIn: '15m',
            } as any
        )
    }

    async signRefershToken(userId: number, email: string, role: string, jti: string): Promise<string> {
        return this.jwtService.signAsync(
            { sub: userId, email, role, jti },
            {
                secret: this.config.get("JWT_REFRESH_SECRET"),
                expiresIn: '7d',
            } as any,
        )
    }

    private clearCookies(res: Response) {
        res.clearCookie('accessToken', { ...COOKIE_BASE });
        res.clearCookie('refreshToken', { ...COOKIE_BASE, path: '/auth/refresh' });
    }
}