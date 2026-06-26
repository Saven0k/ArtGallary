import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';

export interface JwtPayload {
    sub: number;
    email: string;
    role: string;
}

@Injectable()
export class JwtAccessStrategy extends PassportStrategy(Strategy, 'jwt-access') {
    constructor(private config: ConfigService) {
        super({
            jwtFromRequest: ExtractJwt.fromExtractors([
                (req: Request) => req?.cookies?.accessToken ?? null,
            ]),
            secretOrKey: config.get<string>('JWT_ACCESS_SECRET'),
            ignoreExpiration: false,
        } as any);
    }

    async validate(payload: JwtPayload) {
        if (!payload.sub) throw new UnauthorizedException();
        return { id: payload.sub, email: payload.email, role: payload.role };
    }
}