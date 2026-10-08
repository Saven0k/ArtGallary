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
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(private config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => {
          const token = (req.cookies as Record<string, unknown> | undefined)
            ?.refreshToken;
          return typeof token === 'string' ? token : null;
        },
      ]),
      secretOrKey: config.get<string>('JWT_REFRESH_SECRET'),
      passReqToCallback: true,
      ignoreExpiration: false,
    });
  }

  validate(req: Request, payload: JwtRefreshPayload) {
    const rawToken = (req.cookies as Record<string, unknown> | undefined)
      ?.refreshToken;
    if (typeof rawToken !== 'string' || !payload.jti || !payload.sub)
      throw new UnauthorizedException();
    return { ...payload, rawToken };
  }
}
