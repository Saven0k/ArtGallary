import type { PromoCode } from './types';

export const PROMO_CODES: Record<PromoCode, number> = {
    SALE10: 10,
    SALE15: 15,
    ART20: 20,
};

export const isPromoCode = (code: string): code is PromoCode =>
    Object.prototype.hasOwnProperty.call(PROMO_CODES, code);

export const formatPrice = (value: number, currency = 'RUB'): string => {
    const symbol = currency === 'RUB' ? '₽' : currency;
    return `${value.toLocaleString('ru-RU')} ${symbol}`;
};

export const isOriginalByPrice = (price: number): boolean => price > 5000;

export const clampQuantity = (quantity: number): number => {
    if (!Number.isFinite(quantity) || quantity < 1) return 1;
    return Math.min(Math.floor(quantity), 999);
};
