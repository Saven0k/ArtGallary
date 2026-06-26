import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { DEFAULT_LANGUAGE } from './languages.config';

export const Language = createParamDecorator(
    (data: unknown, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();
        return request.query.lang || 
               request.headers['accept-language']?.split(',')[0]?.split('-')[0] || 
               DEFAULT_LANGUAGE;
    },
);