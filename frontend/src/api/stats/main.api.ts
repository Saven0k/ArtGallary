// src/api/stats/main.api.ts
import { BASE_URL_API } from "../main.api";

const BASE_URL = `${BASE_URL_API}/stats`;

export interface ViewsTimelineData {
    date: string;
    views: number;
}

export interface GenderStatsData {
    male: number;
    female: number;
    unknown: number;
}

export interface CountryStatsData {
    country: string;
    percentage: number;
}

export interface AgeStatsData {
    range: string;
    percentage: number;
}

export const getViewsTimeline = async (
    authorId: number,
    period: 'week' | 'month' | 'year' = 'month'
): Promise<ViewsTimelineData[] | null> => {
    try {
        const res = await fetch(`${BASE_URL}/author/${authorId}/views/timeline?period=${period}`, {
            credentials: "include",
        });
        if (!res.ok) throw new Error();
        return await res.json();
    } catch (e) {
        console.error("getViewsTimeline error:", e);
        return null;
    }
};

export const getViewersGenderStats = async (authorId: number): Promise<GenderStatsData | null> => {
    try {
        const res = await fetch(`${BASE_URL}/author/${authorId}/viewers/gender`, {
            credentials: "include",
        });
        if (!res.ok) throw new Error();
        return await res.json();
    } catch (e) {
        console.error("getViewersGenderStats error:", e);
        return null;
    }
};

export const getViewersTopCountries = async (authorId: number): Promise<CountryStatsData[] | null> => {
    try {
        const res = await fetch(`${BASE_URL}/author/${authorId}/viewers/countries`, {
            credentials: "include",
        });
        if (!res.ok) throw new Error();
        return await res.json();
    } catch (e) {
        console.error("getViewersTopCountries error:", e);
        return null;
    }
};

export const getViewersAgeStats = async (authorId: number): Promise<AgeStatsData[] | null> => {
    try {
        const res = await fetch(`${BASE_URL}/author/${authorId}/viewers/age`, {
            credentials: "include",
        });
        if (!res.ok) throw new Error();
        return await res.json();
    } catch (e) {
        console.error("getViewersAgeStats error:", e);
        return null;
    }
};