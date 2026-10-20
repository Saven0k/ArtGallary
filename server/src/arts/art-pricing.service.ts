import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ContentLanguage } from '../translation/translation-text';

const LANGUAGE_CURRENCY = { ru: 'RUB', en: 'USD', zh: 'CNY' } as const;
const HOUR = 60 * 60 * 1000;
const MAX_RATE_AGE = 7 * 24 * HOUR;

type Rates = { date: string; rubles: Record<string, number> };

@Injectable()
export class ArtPricingService implements OnApplicationBootstrap {
  private readonly logger = new Logger(ArtPricingService.name);
  private rates: Rates | null = null;
  private retryAt = 0;
  private pending: Promise<Rates | null> | null = null;

  onApplicationBootstrap() {
    void this.getRates();
  }

  async localize(data: unknown, language: ContentLanguage): Promise<unknown> {
    const target = LANGUAGE_CURRENCY[language];
    let snapshot: Promise<Rates | null> | undefined;
    const visit = async (value: unknown): Promise<unknown> => {
      if (!value || typeof value !== 'object' || value instanceof Date)
        return value;
      if (Array.isArray(value)) return Promise.all(value.map(visit));
      const object = value as Record<string, unknown>;
      if (typeof object.toJSON === 'function')
        return visit((object.toJSON as () => unknown)());
      const result = Object.fromEntries<unknown>(
        await Promise.all(
          Object.entries(object).map(
            async ([key, item]) => [key, await visit(item)] as const,
          ),
        ),
      );
      if (
        typeof object.image_path !== 'string' ||
        typeof object.cost !== 'number' ||
        !Number.isFinite(object.cost) ||
        object.cost < 0
      )
        return result;
      const source =
        typeof object.currency === 'string' ? object.currency : 'RUB';
      if (source === target) {
        result.display_price = {
          amount: object.cost,
          currency: target,
          rate: 1,
          rate_date: null,
        };
        return result;
      }
      const rates = await (snapshot ??= this.getRates());
      const rate = rates && rates.rubles[source] / rates.rubles[target];
      const amount = rate && Math.round(object.cost * rate * 100) / 100;
      if (
        rates &&
        rate &&
        Number.isFinite(amount) &&
        Number.isSafeInteger(Math.round(Number(amount) * 100))
      )
        result.display_price = {
          amount,
          currency: target,
          rate,
          rate_date: rates.date,
        };
      return result;
    };
    return visit(data);
  }

  private getRates(): Promise<Rates | null> {
    const usable = () =>
      this.rates && Date.now() - Date.parse(this.rates.date) <= MAX_RATE_AGE
        ? this.rates
        : null;
    if (this.pending !== null) return this.pending;
    if (Date.now() < this.retryAt) return Promise.resolve(usable());
    this.pending = this.refreshRates()
      .then((rates) => {
        this.rates = rates;
        this.retryAt = Date.now() + HOUR;
        return rates;
      })
      .catch(() => {
        this.retryAt = Date.now() + 60 * 1000;
        this.logger.warn(
          'Exchange rates unavailable; keeping original artwork prices when no recent rate is cached',
        );
        return usable();
      })
      .finally(() => {
        this.pending = null;
      });
    return this.pending;
  }

  private async refreshRates(): Promise<Rates> {
    const response = await fetch('https://www.cbr.ru/scripts/XML_daily.asp', {
      signal: AbortSignal.timeout(4000),
    });
    if (!response.ok) throw new Error(`CBR HTTP ${response.status}`);
    const xml = await response.text();
    const date = xml.match(/<ValCurs\b[^>]*\bDate="(\d{2})\.(\d{2})\.(\d{4})"/);
    if (!date) throw new Error('Missing rate date');
    const rateDate = `${date[3]}-${date[2]}-${date[1]}`;
    const age = Date.now() - Date.parse(rateDate);
    if (!Number.isFinite(age) || age > MAX_RATE_AGE || age < -2 * 24 * HOUR)
      throw new Error('Invalid rate date');
    const rubles: Record<string, number> = { RUB: 1 };
    for (const [, item] of xml.matchAll(
      /<Valute\b[^>]*>([\s\S]*?)<\/Valute>/g,
    )) {
      const code = item.match(/<CharCode>([A-Z]{3})<\/CharCode>/)?.[1];
      const nominal = Number(item.match(/<Nominal>(\d+)<\/Nominal>/)?.[1]);
      const value = Number(
        item.match(/<Value>([\d,]+)<\/Value>/)?.[1]?.replace(',', '.'),
      );
      if (code && Number.isFinite(value) && value > 0 && nominal > 0)
        rubles[code] = value / nominal;
    }
    if (!rubles.USD || !rubles.CNY)
      throw new Error('Incomplete exchange rates');
    return { date: rateDate, rubles };
  }
}
