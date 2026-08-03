import { BASE_URL_API } from '../main.api';
const BASE_URL = `${BASE_URL_API}/location`;
export interface CountrySuggestion {
    id: number;
    iso2: string;
    iso3?: string;
    name_en: string;
    name_ru?: string;
    geonames_id?: number;
    phone_code?: string;
    currency?: string;
    continent?: string;
}
export interface CitySuggestion {
    id: number;
    geonames_id: number;
    name_en: string;
    name_ru?: string;
    country_id: number;
    country_code: string;
    region?: string;
    latitude?: number;
    longitude?: number;
    population?: number;
    timezone?: string;
}

async function apiFetch<T>(url: string, fallback: T): Promise<T> {
    try {
        const res = await fetch(url, { credentials: 'include' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
    } catch (error) {
        console.error(`[LocationAPI] ${url}:`, error);
        return fallback;
    }
}

export const searchCountries = async (query: string, lang: 'ru' | 'en' = 'ru'): Promise<CountrySuggestion[]> => {
    if (!query || query.length < 2) return [];
    return apiFetch(`${BASE_URL}/countries/search?q=${encodeURIComponent(query)}&lang=${lang}`, []);
};

export const getCountryByCode = async (code: string, lang: 'ru' | 'en' = 'ru'): Promise<CountrySuggestion | null> => {
    if (!code || code.length !== 2) return null;
    return apiFetch(`${BASE_URL}/countries/by-code/${code.toUpperCase()}?lang=${lang}`, null);
};

export const getCountryById = async (id: number, lang: 'ru' | 'en' = 'ru'): Promise<CountrySuggestion | null> => {
    return apiFetch(`${BASE_URL}/countries/${id}?lang=${lang}`, null);
};

export const getAllCountries = async (lang: 'ru' | 'en' = 'ru'): Promise<CountrySuggestion[]> => {
    return apiFetch(`${BASE_URL}/countries?lang=${lang}`, []);
};

export const searchCities = async (query: string, countryCode?: string, lang: 'ru' | 'en' = 'ru'): Promise<CitySuggestion[]> => {
    if (!query || query.length < 2) return [];
    let url = `${BASE_URL}/cities/search?q=${encodeURIComponent(query)}&lang=${lang}`;
    if (countryCode) url += `&countryCode=${countryCode.toUpperCase()}`;
    return apiFetch(url, []);
};

export const getCityById = async (id: number, lang: 'ru' | 'en' = 'ru'): Promise<CitySuggestion | null> => {
    return apiFetch(`${BASE_URL}/cities/${id}?lang=${lang}`, null);
};

export const getCitiesByCountryCode = async (code: string, lang: 'ru' | 'en' = 'ru', limit: number = 50): Promise<CitySuggestion[]> => {
    return apiFetch(`${BASE_URL}/countries/by-code/${code.toUpperCase()}/cities?lang=${lang}&limit=${limit}`, []);
};

let _countriesCache: CountrySuggestion[] | null = null;
let _countriesCacheLang: string | null = null;

export const getAllCountriesCached = async (lang: 'ru' | 'en' = 'ru'): Promise<CountrySuggestion[]> => {
    if (_countriesCache && _countriesCacheLang === lang) return _countriesCache;
    _countriesCache = await getAllCountries(lang);
    _countriesCacheLang = lang;
    return _countriesCache;
};
