import { BASE_URL_API } from '../main.api';
import { apiFetch } from '../request';

export type SubscriptionPlanKey = 'free' | 'pro' | 'vip';
export interface SubscriptionPlan {
    name: SubscriptionPlanKey;
    price: number;
    features: string[];
    weight: number;
    durationOptions: { label: string; value: 30 | 90 | 365; price: number }[];
}
export interface AvailablePlans {
    plans: SubscriptionPlan[];
    currency: string;
    paymentMethods: { value: 'card' | 'qr_code'; label: string }[];
}
export interface SubscriptionInfo {
    plan: SubscriptionPlanKey;
    expiresAt: string | null;
    isActive: boolean;
    planWeight: number;
    daysLeft: number | null;
    features: string[];
    history?: { paymentId?: string; paymentStatus?: 'pending' | 'success' | 'failed' }[];
}
export interface PurchaseSubscriptionDto {
    plan: 'pro' | 'vip';
    durationDays?: 30 | 90 | 365;
    paymentMethod?: 'card' | 'qr_code';
}
export interface PaymentInit {
    paymentId: string;
    paymentUrl?: string;
    amount: number;
    currency: string;
}
const request = async <T>(url: string, init?: RequestInit): Promise<T> => {
    const res = await apiFetch(url, init);
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(typeof data?.message === 'string' ? data.message : 'Не удалось выполнить запрос');
    return data as T;
};
const json = (data: unknown): RequestInit => ({ method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
export const getSubscriptionInfo = () => request<SubscriptionInfo>(`${BASE_URL_API}/authors/subscription/info`);
export const getAvailablePlans = () => request<AvailablePlans>(`${BASE_URL_API}/authors/subscription/plans`);
export const purchaseSubscription = (data: PurchaseSubscriptionDto) => request<PaymentInit>(`${BASE_URL_API}/authors/subscription/purchase`, json(data));
export const confirmSubscriptionPayment = (paymentId: string) => request<{ success: boolean; message: string }>(`${BASE_URL_API}/subscriptions/confirm`, json({ paymentId }));
export const cancelSubscription = () => request<{ success: boolean; message: string }>(`${BASE_URL_API}/authors/subscription/cancel`, { method: 'DELETE' });
