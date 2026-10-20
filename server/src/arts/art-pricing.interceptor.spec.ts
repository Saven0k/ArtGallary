import { ExecutionContext } from '@nestjs/common';
import { lastValueFrom, of } from 'rxjs';
import { ArtPricingInterceptor } from './art-pricing.interceptor';
import { ArtPricingService } from './art-pricing.service';

it.each([
  ['/arts', 'GET', {}, 'ru'],
  ['/arts/moderated', 'GET', { lang: 'en-US' }, 'en'],
  ['/authors/7/arts', 'GET', { lang: 'zh-CN' }, 'zh'],
  ['/arts/1', 'GET', { lang: 'en', original: 'true' }, null],
  ['/arts/1', 'PATCH', { lang: 'en' }, null],
  ['/arts', 'POST', { lang: 'en' }, null],
  ['/cart-history', 'GET', { lang: 'en' }, null],
  ['/subscriptions/available', 'GET', { lang: 'en' }, null],
] as const)(
  'prices %s %s only for display requests',
  async (path, method, query, language) => {
    const service = new ArtPricingService();
    const localize = jest
      .spyOn(service, 'localize')
      .mockResolvedValue({ converted: true });
    const interceptor = new ArtPricingInterceptor(service);
    const context = {
      switchToHttp: () => ({ getRequest: () => ({ path, method, query }) }),
    } as unknown as ExecutionContext;
    const result: unknown = await lastValueFrom(
      interceptor.intercept(context, { handle: () => of({ id: 1 }) }),
    );
    if (language) {
      expect(localize).toHaveBeenCalledWith({ id: 1 }, language);
      expect(result).toEqual({ converted: true });
    } else {
      expect(localize).not.toHaveBeenCalled();
      expect(result).toEqual({ id: 1 });
    }
  },
);
