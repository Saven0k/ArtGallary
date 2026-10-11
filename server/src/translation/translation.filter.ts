import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { contentLanguage } from './translation-text';
import { TranslationService } from './translation.service';

@Catch(HttpException)
export class TranslationFilter implements ExceptionFilter<HttpException> {
  constructor(private readonly translations: TranslationService) {}

  async catch(exception: HttpException, host: ArgumentsHost): Promise<void> {
    const request = host.switchToHttp().getRequest<Request>();
    const response = host.switchToHttp().getResponse<Response>();
    const status = exception.getStatus();
    const body = exception.getResponse();
    const data =
      typeof body === 'string' ? { statusCode: status, message: body } : body;
    const language = contentLanguage(request.query.lang);
    response.setHeader('Content-Language', language);
    const result =
      this.translations.enabled && request.query.original !== 'true'
        ? await this.translations.localize(data, language, request.path, 200)
        : { data, status: 'original' };
    response.setHeader('X-Translation-Status', result.status);
    response.status(status).json(result.data);
  }
}
