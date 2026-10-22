import { BASE_URL_API } from '../main.api';
import { apiFetch } from '../request';

export interface AppliedPromoCode {
    code: string;
    percent: number;
    expiresAt: string | null;
}
export interface PromoCode extends AppliedPromoCode {
    id: number;
    active: boolean;
    createdAt: string;
}
export interface PromoCodePage {
    items: PromoCode[];
    total: number;
    page: number;
    limit: number;
}

export class PromoCodeError extends Error {
    constructor(
        message: string,
        public readonly status: number,
    ) {
        super(message);
    }
}

const request = async <T>(path = '', init?: RequestInit): Promise<T> => {
    const response = await apiFetch(`${BASE_URL_API}/promo-codes${path}`, init);
    if (!response.ok) {
        const data: { code?: string; message?: string | string[] } = await response.json().catch(() => ({}));
        throw new PromoCodeError(data.code ?? (typeof data.message === 'string' ? data.message : 'PROMO_REQUEST_FAILED'), response.status);
    }
    return response.json();
};
const json = (body: unknown): RequestInit => ({
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
});

export const getPromoCodes = (page = 1, signal?: AbortSignal) => request<PromoCodePage>(`?page=${page}&limit=20`, { signal });
export const createPromoCode = (data: { code: string; percent: number; expiresAt: string | null }) => request<PromoCode>('', json(data));
export const setPromoCodeActive = (id: number, active: boolean) => request<PromoCode>(`/${id}`, { ...json({ active }), method: 'PATCH' });
export const validatePromoCode = (code: string) => request<AppliedPromoCode>('/validate', json({ code }));
