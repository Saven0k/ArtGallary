import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAccessGuard extends AuthGuard('jwt-access') {}

@Injectable()
export class JwtRefreshGuard extends AuthGuard('jwt-refresh') {}

@Injectable()
export class OptionalJwtAccessGuard extends JwtAccessGuard {
  handleRequest<TUser>(error: unknown, user: TUser): TUser {
    if (error && !(error instanceof UnauthorizedException)) throw error;
    return user || null;
  }
}
