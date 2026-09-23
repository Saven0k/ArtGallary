// src/api/site/main.api.ts
import { BASE_URL_API } from '../main.api';

const BASE_URL = `${BASE_URL_API}/site`;

export interface SiteStatsData {
    totalVisits: number;
    todayVisits: number;
    weekVisits: number;
    monthVisits: number;
    uniqueUsers: number;
    averageRating: number;
    ratingsCount: number;
    topPaths: { path: string; count: number }[];
}

const request = async <T>(url: string, init?: RequestInit): Promise<T | null> => {
    try {
        const res = await fetch(url, { credentials: 'include', ...init });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        // 204 — пустое тело
        if (res.status === 204) return null;
        return (await res.json()) as T;
    } catch (e) {
        console.error('site api error:', e);
        return null;
    }
};

const json = (body: unknown): RequestInit => ({
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
});

/** Трекинг посещения — вызывается один раз при монтировании App */
export const trackSiteVisit = (path: string = window.location.pathname) =>
    request<null>(`${BASE_URL}/visit`, json({ path }));

export const getSiteStats = () => request<SiteStatsData>(`${BASE_URL}/stats`);

export const rateSite = (value: number) =>
    request<{ value: number }>(`${BASE_URL}/rating`, json({ value }));

export const getMySiteRating = () =>
    request<{ value: number | null }>(`${BASE_URL}/rating/me`);