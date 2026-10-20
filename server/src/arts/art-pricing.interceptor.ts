import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request } from 'express';
import { mergeMap } from 'rxjs';
import { contentLanguage } from '../translation/translation-text';
import { ArtPricingService } from './art-pricing.service';

@Injectable()
export class ArtPricingInterceptor implements NestInterceptor {
  constructor(private readonly pricing: ArtPricingService) {}

  intercept(context: ExecutionContext, next: CallHandler) {
    const request = context.switchToHttp().getRequest<Request>();
    if (
      request.method !== 'GET' ||
      request.query.original === 'true' ||
      !/^\/(arts|authors)(\/|$)/.test(request.path)
    )
      return next.handle();
    return next
      .handle()
      .pipe(
        mergeMap((data: unknown) =>
          this.pricing.localize(data, contentLanguage(request.query.lang)),
        ),
      );
  }
}
