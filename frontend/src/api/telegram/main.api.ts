import { BASE_URL_API } from '../main.api';
import { apiFetch } from '../request';

export interface TelegramStatus { configured: boolean; linked: boolean }

async function request<T>(path: string, method = 'GET'): Promise<T> {
    const response = await apiFetch(`${BASE_URL_API}/telegram/${path}`, { method });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
}

export const getTelegramStatus = () => request<TelegramStatus>('status');
export const createTelegramLink = () => request<{ url: string; expiresAt: string }>('link', 'POST');
export const unlinkTelegram = () => request<{ linked: false }>('link', 'DELETE');
