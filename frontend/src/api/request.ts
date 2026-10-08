import { BASE_URL_API } from './main.api';

let refreshing: Promise<Response | null> | null = null;

export const refreshSession = (): Promise<Response | null> => {
    refreshing ??= fetch(`${BASE_URL_API}/auth/refresh`, { method: 'POST', credentials: 'include' })
        .catch(() => null).finally(() => { refreshing = null; });
    return refreshing;
};

export const apiFetch = async (url: string, init?: RequestInit): Promise<Response> => {
    const options = { credentials: 'include' as const, ...init };
    const response = await fetch(url, options);
    if (response.status !== 401) return response;
    if ((await refreshSession())?.ok) return fetch(url, options);
    return response;
};
