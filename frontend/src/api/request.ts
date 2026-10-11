import { BASE_URL_API } from './main.api';

let refreshing: Promise<Response | null> | null = null;

export const languageUrl = (url: string): string => {
    if (typeof localStorage === 'undefined' || !(url === BASE_URL_API || url.startsWith(`${BASE_URL_API}/`))) return url;
    const saved = localStorage.getItem('language');
    const language = saved === 'en' || saved === 'zh' ? saved : 'ru';
    const [base, fragment] = url.split('#', 2);
    const [path, query] = base.split('?', 2);
    const params = new URLSearchParams(query);
    params.set('lang', language);
    return `${path}?${params}${fragment ? `#${fragment}` : ''}`;
};

export const apiRequest = (url: string, init?: RequestInit): Promise<Response> =>
    fetch(languageUrl(url), { credentials: 'include', ...init });

export const getOriginal = async <T>(resource: string, id: number): Promise<T | null> => {
    const response = await apiFetch(`${BASE_URL_API}/${resource}/${id}?original=true`).catch(() => null);
    return response?.ok ? response.json().catch(() => null) as Promise<T | null> : null;
};

export const refreshSession = (): Promise<Response | null> => {
    refreshing ??= apiRequest(`${BASE_URL_API}/auth/refresh`, { method: 'POST', credentials: 'include' })
        .catch(() => null).finally(() => { refreshing = null; });
    return refreshing;
};

export const apiFetch = async (url: string, init?: RequestInit): Promise<Response> => {
    const options = { credentials: 'include' as const, ...init };
    const localized = languageUrl(url);
    let response = await fetch(localized, options);
    if (response.status === 401 && (await refreshSession())?.ok) response = await fetch(localized, options);
    if (response.ok && (init?.method ?? 'GET').toUpperCase() === 'GET' && response.headers.get('X-Translation-Status') === 'pending') {
        const retry = await fetch(localized, options).catch(() => null);
        if (retry) {
            await response.body?.cancel();
            response = retry;
        }
    }
    if (response.headers.get('X-Translation-Status') === 'pending' || response.headers.get('X-Translation-Status') === 'partial') {
        if (typeof window !== 'undefined') window.dispatchEvent(new Event('gallery:translation-pending'));
    }
    return response;
};
