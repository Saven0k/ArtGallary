// src/api/notifications/main.api.ts
import { BASE_URL_API } from '../main.api';

const BASE_URL = `${BASE_URL_API}/notifications`;

export type NotificationType =
    | 'art_like'
    | 'author_like'
    | 'new_follower'
    | 'new_art';

export type NotificationStatus = 'unread' | 'read';

export interface NotificationItem {
    id: number;
    user_id: number;
    type: NotificationType;
    message: string;
    link: string | null;
    target_id: number | null;
    status: NotificationStatus;
    metadata: any;
    created_at: string;
}

export interface Pagination {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
}

export interface NotificationsResponse {
    data: NotificationItem[];
    pagination: Pagination;
    unread_count: number;
}

const request = async <T>(url: string, init?: RequestInit): Promise<T | null> => {
    try {
        const res = await fetch(url, { credentials: 'include', ...init });
        if (!res.ok) {
            const message = await res.text().catch(() => '');
            throw new Error(`HTTP ${res.status} ${message}`);
        }
        return (await res.json()) as T;
    } catch (e) {
        console.error('notifications api error:', e);
        return null;
    }
};

export const getNotifications = (page = 1, limit = 20) =>
    request<NotificationsResponse>(`${BASE_URL}?page=${page}&limit=${limit}`);

export const getUnreadCount = () =>
    request<{ count: number }>(`${BASE_URL}/unread/count`);

export const markNotificationAsRead = (id: number) =>
    request<{ success: boolean }>(`${BASE_URL}/${id}/read`, { method: 'PATCH' });

export const markAllNotificationsAsRead = () =>
    request<{ success: boolean }>(`${BASE_URL}/read/all`, { method: 'PATCH' });

export const deleteNotification = (id: number) =>
    request<{ success: boolean; id: number }>(
        `${BASE_URL}/${id}`,
        { method: 'DELETE' },
    );

export const deleteAllNotifications = () =>
    request<{ success: boolean; deleted: number }>(
        `${BASE_URL}/delete/all`,
        { method: 'DELETE' },
    );