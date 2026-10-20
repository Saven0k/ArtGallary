import type { PromoCode } from './types';
import type { DisplayPrice } from '../../../../api/arts/main.api';
import { formatArtPrice } from '../../../../utils/art-price';

export const PROMO_CODES: Record<PromoCode, number> = {
    SALE10: 10,
    SALE15: 15,
    ART20: 20,
};

export const isPromoCode = (code: string): code is PromoCode =>
    Object.prototype.hasOwnProperty.call(PROMO_CODES, code);

export const formatPrice = (value: number, currency: string, language: string): string => {
    const symbol = currency === 'RUB' ? '₽' : currency;
    return `${value.toLocaleString(language)} ${symbol}`;
};

export const formatDisplayPrice = (value: number, currency: string, price: DisplayPrice | undefined, language: string): string =>
    formatArtPrice({ cost: value, currency, display_price: price ? { ...price, amount: Math.round(value * price.rate * 100) / 100 } : undefined }, language) ?? formatPrice(value, currency, language);

export const isOriginalByPrice = (price: number): boolean => price > 5000;

export const clampQuantity = (quantity: number): number => {
    if (!Number.isFinite(quantity) || quantity < 1) return 1;
    return Math.min(Math.floor(quantity), 999);
};
