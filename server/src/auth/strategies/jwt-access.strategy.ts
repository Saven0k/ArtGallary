import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/sequelize';
import { User } from '../../users/users.model';
import { RefreshToken } from '../models/refresh-token.model';

export interface JwtPayload {
  sub: number;
  email: string;
  role: string;
  jti: string;
}

@Injectable()
export class JwtAccessStrategy extends PassportStrategy(
  Strategy,
  'jwt-access',
) {
  constructor(
    private config: ConfigService,
    @InjectModel(User) private users: typeof User,
    @InjectModel(RefreshToken) private sessions: typeof RefreshToken,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => {
          const token = (req.cookies as Record<string, unknown> | undefined)
            ?.accessToken;
          return typeof token === 'string' ? token : null;
        },
      ]),
      secretOrKey: config.get<string>('JWT_ACCESS_SECRET'),
      ignoreExpiration: false,
    });
  }

  async validate(payload: JwtPayload) {
    if (
      typeof payload.sub !== 'number' ||
      typeof payload.jti !== 'string' ||
      !payload.jti
    )
      throw new UnauthorizedException();
    const [user, session] = await Promise.all([
      this.users.findByPk(payload.sub, {
        attributes: ['id', 'email', 'role', 'is_deleted'],
      }),
      this.sessions.findOne({
        where: { id: payload.jti, userId: payload.sub },
      }),
    ]);
    if (
      !user ||
      user.is_deleted ||
      !session ||
      session.expiresAt <= new Date()
    ) {
      throw new UnauthorizedException();
    }
    return { id: user.id, email: user.email, role: user.role };
  }
}
