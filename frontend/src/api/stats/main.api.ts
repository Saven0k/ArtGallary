// src/api/stats/main.api.ts
import { BASE_URL_API } from "../main.api";

const BASE_URL = `${BASE_URL_API}/stats`;

// -------------------- types --------------------

export interface GenderStatsData {
    male: number;
    female: number;
    unknown: number;
}

export interface AgeStatsData {
    '18-25': number;
    '26-35': number;
    '36-50': number;
    '50+': number;
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

// -------------------- helpers --------------------

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

// -------------------- author --------------------

export const getAuthorStats = async (
    authorId: number,
    filter?: StatsQuery,
): Promise<AuthorStatsData | null> => {
    try {
        const res = await fetch(
            `${BASE_URL}/author/${authorId}${buildQuery(filter)}`,
            { credentials: 'include' },
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
    } catch (e) {
        console.error('getAuthorStats error:', e);
        return null;
    }
};

// -------------------- art --------------------

export const getArtStats = async (
    artId: number,
    filter?: StatsQuery,
): Promise<ArtStatsData | null> => {
    try {
        const res = await fetch(
            `${BASE_URL}/art/${artId}${buildQuery(filter)}`,
            { credentials: 'include' },
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
    } catch (e) {
        console.error('getArtStats error:', e);
        return null;
    }
};