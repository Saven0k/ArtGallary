// src/api/stats/main.api.ts
import { BASE_URL_API } from "../main.api";

const BASE_URL = `${BASE_URL_API}/stats`;

export interface StatsFilter {
    startDate?: string;
    endDate?: string;
    gender?: 'M' | 'F';
    ageFrom?: number;
    ageTo?: number;
    cityId?: number;
    countryId?: number;
}

export interface GenderStats {
    male: number;
    female: number;
    unknown: number;
}

export interface AgeStats {
    '18-25': number;
    '26-35': number;
    '36-50': number;
    '50+': number;
}

export interface CountryStats {
    countryId: number;
    countryName: string;
    count: number;
}

export interface TimelineData {
    date: string;
    count: number;
}

export interface StatsResponse {
    totalLikes: number;
    totalViews: number;
    uniqueUsers: number;
    likesByGender: GenderStats;
    viewsByGender: GenderStats;
    likesByAge: AgeStats;
    viewsByAge: AgeStats;
    likesByCountry: CountryStats[];
    viewsByCountry: CountryStats[];
    likesTimeline: TimelineData[];
    viewsTimeline: TimelineData[];
}

export interface ArtistStatsResponse extends StatsResponse {
    recentLikes: {
        id: number;
        user: {
            id: number;
            name: string;
            surname: string;
            avatar_path?: string;
        };
        createdAt: string;
    }[];
}

export const getAuthorDetailedStats = async (
    authorId: number,
    filter?: StatsFilter
): Promise<ArtistStatsResponse | null> => {
    try {
        const params = new URLSearchParams();
        if (filter?.startDate) params.append("startDate", filter.startDate);
        if (filter?.endDate) params.append("endDate", filter.endDate);
        if (filter?.gender) params.append("gender", filter.gender);
        if (filter?.ageFrom !== undefined) params.append("ageFrom", String(filter.ageFrom));
        if (filter?.ageTo !== undefined) params.append("ageTo", String(filter.ageTo));
        if (filter?.cityId) params.append("cityId", String(filter.cityId));
        if (filter?.countryId) params.append("countryId", String(filter.countryId));

        const query = params.toString();
        const res = await fetch(`${BASE_URL}/author/${authorId}?${query}`, {
            credentials: "include",
        });
        if (!res.ok) throw new Error();
        return await res.json();
    } catch (e) {
        console.error("getAuthorDetailedStats error:", e);
        return null;
    }
};

export const getArtDetailedStats = async (
    artId: number,
    filter?: StatsFilter
): Promise<StatsResponse | null> => {
    try {
        const params = new URLSearchParams();
        if (filter?.startDate) params.append("startDate", filter.startDate);
        if (filter?.endDate) params.append("endDate", filter.endDate);
        if (filter?.gender) params.append("gender", filter.gender);
        if (filter?.ageFrom !== undefined) params.append("ageFrom", String(filter.ageFrom));
        if (filter?.ageTo !== undefined) params.append("ageTo", String(filter.ageTo));
        if (filter?.cityId) params.append("cityId", String(filter.cityId));
        if (filter?.countryId) params.append("countryId", String(filter.countryId));

        const query = params.toString();
        const res = await fetch(`${BASE_URL}/art/${artId}?${query}`, {
            credentials: "include",
        });
        if (!res.ok) throw new Error();
        return await res.json();
    } catch (e) {
        console.error("getArtDetailedStats error:", e);
        return null;
    }
};