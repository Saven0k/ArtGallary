import { apiFetch } from '../request';

import { BASE_URL_API } from '../main.api';

const BASE_URL = `${BASE_URL_API}/stats`;

export interface GenderStatsData {
    male: number;
    female: number;
    unknown: number;
}

export interface AgeStatsData {
    '<18': number;
    '18-24': number;
    '25-34': number;
    '35-44': number;
    '45-54': number;
    '55+': number;
    unknown: number;
}

export interface CountryStatsItem {
    countryId: number;
    countryName: string;
    count: number;
}

export interface TimelineItem {
    date: string;
    count: number;
}

export interface BaseStats {
    totalLikes: number;
    totalViews: number;

    likesByGender: GenderStatsData;
    likesByAge: AgeStatsData;
    likesByCountry: CountryStatsItem[];
    likesTimeline: TimelineItem[];

    viewsByGender: GenderStatsData;
    viewsByAge: AgeStatsData;
    viewsByCountry: CountryStatsItem[];
    viewsTimeline: TimelineItem[];

    uniqueUsers: number;
}

export interface AuthorStatsData extends BaseStats {
    authorId: number;
    newFollowers: number;
    changes: {
        likes: number | null;
        views: number | null;
        followers: number | null;
    };
    popularArts: {
        id: number;
        title: string;
        image_path: string;
        likes: number;
        views: number;
    }[];
    artViews: number;
    authorViews: number;
}

export interface ArtStatsData extends BaseStats {
    artId: number;
    authorId: number;
    title: string;
}

export interface StatsQuery {
    startDate?: string;
    endDate?: string;
    gender?: 'M' | 'F';
    ageFrom?: number;
    ageTo?: number;
    cityId?: number;
    countryId?: number;
}

const buildQuery = (filter?: StatsQuery): string => {
    if (!filter) return '';
    const params = new URLSearchParams();
    Object.entries(filter).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            params.append(key, String(value));
        }
    });
    const qs = params.toString();
    return qs ? `?${qs}` : '';
};

export const getMyAuthorStats = async (
    filter?: StatsQuery,
    lang = 'ru',
    signal?: AbortSignal,
): Promise<AuthorStatsData | null> => {
    try {
        const query = buildQuery(filter);
        const res = await apiFetch(
            `${BASE_URL}/me${query}${query ? '&' : '?'}lang=${lang}`,
            { credentials: 'include', signal },
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
    } catch (e) {
        if (!signal?.aborted) console.error('getMyAuthorStats error:', e);
        return null;
    }
};

export const getArtStats = async (
    artId: number,
    filter?: StatsQuery,
    lang = 'ru',
): Promise<ArtStatsData | null> => {
    try {
        const query = buildQuery(filter);
        const res = await apiFetch(
            `${BASE_URL}/art/${artId}${query}${query ? '&' : '?'}lang=${lang}`,
            { credentials: 'include' },
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
    } catch (e) {
        console.error('getArtStats error:', e);
        return null;
    }
};
