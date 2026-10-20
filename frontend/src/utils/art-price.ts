import type { Art } from '../api/arts/main.api';

export const formatArtPrice = (art: Pick<Art, 'cost' | 'currency' | 'display_price'>, locale: string): string | null => {
    if (art.cost == null || !Number.isFinite(art.cost)) return null;
    const price = art.display_price;
    const amount = price?.amount ?? art.cost;
    const currency = price?.currency ?? art.currency ?? 'RUB';
    const converted = currency !== (art.currency ?? 'RUB');
    if (!/^[A-Z]{3}$/.test(currency)) return `${new Intl.NumberFormat(locale).format(amount)} ${currency}`;
    const formatted = new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 2 }).format(amount);
    return `${converted ? '≈ ' : ''}${formatted}`;
};
