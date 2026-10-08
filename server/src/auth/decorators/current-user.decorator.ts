import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { Role } from '../enums/role.enum';

export interface CurrentUserData {
  id: number;
  email: string;
  role: Role;
}

export const CurrentUser = createParamDecorator(
  (field: keyof CurrentUserData | undefined, ctx: ExecutionContext) => {
    const request = ctx
      .switchToHttp()
      .getRequest<Request & { user?: CurrentUserData }>();
    const user = request.user;
    return field ? user?.[field] : user;
  },
);
