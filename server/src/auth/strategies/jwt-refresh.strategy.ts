import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';

export interface JwtRefreshPayload {
    sub: number;
    email: string;
    role: string;
    jti: string;
}

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
    constructor(private config: ConfigService) {
        super({
            jwtFromRequest: ExtractJwt.fromExtractors([
                (req: Request) => req?.cookies?.refreshToken ?? null,
            ]),
            secretOrKey: config.get<string>('JWT_REFRESH_SECRET'),
            passReqToCallback: true,
            ignoreExpiration: false,
        } as any);
    }

    async validate(req: Request, payload: JwtRefreshPayload) {
        const rawToken = req.cookies?.refreshToken;
        if (!rawToken) throw new UnauthorizedException();
        return { ...payload, rawToken };
    }
}