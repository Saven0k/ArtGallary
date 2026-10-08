import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { createHash } from 'crypto';
import { Request } from 'express';
import { Op } from 'sequelize';
import { CurrentUserData } from '../decorators/current-user.decorator';
import { Role } from '../enums/role.enum';
import { AccountDeletionCode } from '../models/account-deletion-code.model';

@Injectable()
export class AccountDeletionGuard implements CanActivate {
  constructor(
    @InjectModel(AccountDeletionCode) private codes: typeof AccountDeletionCode,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: CurrentUserData }>();
    const user = request.user;
    if (!user) throw new ForbiddenException('Требуется авторизация');
    const targetId = Number(request.params.id);
    if (
      targetId !== user.id &&
      (user.role === Role.Admin || user.role === Role.Moderator)
    )
      return true;
    if (targetId !== user.id)
      throw new ForbiddenException('Вы можете удалить только свой профиль');
    const token = request.headers['x-account-deletion-token'];
    if (typeof token !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(token)) {
      throw new ForbiddenException('Подтвердите удаление кодом из письма');
    }
    const consumed = await this.codes.destroy({
      where: {
        user_id: user.id,
        code_hash: `deletion:${createHash('sha256').update(token).digest('hex')}`,
        expires_at: { [Op.gt]: new Date() },
      },
    });
    if (!consumed)
      throw new ForbiddenException(
        'Подтверждение удаления истекло или уже использовано',
      );
    return true;
  }
}
