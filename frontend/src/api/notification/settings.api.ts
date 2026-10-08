import { apiFetch } from '../request';
import { BASE_URL_API } from '../main.api';
import type { Language } from '../../context/contexts';

export interface NotificationPreferences {
    emailEnabled: boolean;
    pushEnabled: boolean;
    language: Language;
    mailConfigured: boolean;
    pushConfigured: boolean;
    vapidPublicKey: string | null;
}

export class NotificationRequestError extends Error {
    constructor(public status: number) { super(`HTTP ${status}`); }
}

async function request<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
    const response = await apiFetch(`${BASE_URL_API}/notifications/${path}`, {
        method, credentials: 'include',
        ...(body !== undefined && { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
    });
    if (!response.ok) throw new NotificationRequestError(response.status);
    return response.json();
}

export const getNotificationSettings = () => request<NotificationPreferences>('settings');
export const updateNotificationSettings = (body: Partial<Pick<NotificationPreferences, 'emailEnabled' | 'pushEnabled' | 'language'>>) => request<NotificationPreferences>('settings', 'PATCH', body);
export const savePushSubscription = (subscription: PushSubscription) => request('push', 'POST', subscription.toJSON());
export const deletePushSubscription = (endpoint: string) => request('push', 'DELETE', { endpoint });
export const sendTestNotification = (channel: 'email' | 'push') => request('test', 'POST', { channel });
