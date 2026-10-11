import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { mergeMap } from 'rxjs';
import { contentLanguage } from './translation-text';
import { TranslationService } from './translation.service';

@Injectable()
export class TranslationInterceptor implements NestInterceptor {
  constructor(private readonly translations: TranslationService) {}

  intercept(context: ExecutionContext, next: CallHandler) {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    if (
      !this.translations.enabled ||
      request.query.original === 'true' ||
      request.path === '/health'
    )
      return next.handle();
    const language = contentLanguage(request.query.lang);
    response.setHeader('Content-Language', language);
    return next.handle().pipe(
      mergeMap(async (data: unknown) => {
        if (data === undefined) return data;
        const result = await this.translations.localize(
          data,
          language,
          request.path,
          request.method === 'GET' ? 15000 : 200,
        );
        response.setHeader('X-Translation-Status', result.status);
        return result.data;
      }),
    );
  }
}
