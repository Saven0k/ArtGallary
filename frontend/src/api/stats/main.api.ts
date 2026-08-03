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

export interface LikeResponse {
    success: boolean;
    message: string;
}

export interface CountResponse {
    count: number;
}

export const getArtistLikesCount = async (artistId: number): Promise<CountResponse | null> => {
    try {
        const res = await fetch(`${BASE_URL}/artist/${artistId}/likes/count`, {
            credentials: "include",
        });
        if (!res.ok) throw new Error();
        return await res.json();
    } catch (e) {
        console.error("getArtistLikesCount error:", e);
        return null;
    }
};

export const getArtistViewsCount = async (artistId: number): Promise<CountResponse | null> => {
    try {
        const res = await fetch(`${BASE_URL}/artist/${artistId}/views/count`, {
            credentials: "include",
        });
        if (!res.ok) throw new Error();
        return await res.json();
    } catch (e) {
        console.error("getArtistViewsCount error:", e);
        return null;
    }
};

export const getArtLikesCount = async (artId: number): Promise<CountResponse | null> => {
    try {
        const res = await fetch(`${BASE_URL}/art/${artId}/likes/count`, {
            credentials: "include",
        });
        if (!res.ok) throw new Error();
        return await res.json();
    } catch (e) {
        console.error("getArtLikesCount error:", e);
        return null;
    }
};

export const getArtViewsCount = async (artId: number): Promise<CountResponse | null> => {
    try {
        const res = await fetch(`${BASE_URL}/art/${artId}/views/count`, {
            credentials: "include",
        });
        if (!res.ok) throw new Error();
        return await res.json();
    } catch (e) {
        console.error("getArtViewsCount error:", e);
        return null;
    }
};

export const likeArtist = async (artistId: number): Promise<LikeResponse | null> => {
    try {
        const res = await fetch(`${BASE_URL}/artist/${artistId}/like`, {
            method: "POST",
            credentials: "include",
        });
        if (!res.ok) throw new Error();
        return await res.json();
    } catch (e) {
        console.error("likeArtist error:", e);
        return null;
    }
};

export const getArtistLikes = async (
    artistId: number,
    page: number = 1,
    limit: number = 20
): Promise<{ data: any[]; total: number; pagination: any } | null> => {
    try {
        const res = await fetch(`${BASE_URL}/artist/${artistId}/likes?page=${page}&limit=${limit}`, {
            credentials: "include",
        });
        if (!res.ok) throw new Error();
        return await res.json();
    } catch (e) {
        console.error("getArtistLikes error:", e);
        return null;
    }
};

export const viewArtist = async (artistId: number): Promise<void> => {
    try {
        await fetch(`${BASE_URL}/artist/${artistId}/view`, {
            method: "POST",
            credentials: "include",
        });
    } catch (e) {
        console.error("viewArtist error:", e);
    }
};

export const likeArt = async (artId: number): Promise<LikeResponse | null> => {
    try {
        const res = await fetch(`${BASE_URL}/art/${artId}/like`, {
            method: "POST",
            credentials: "include",
        });
        if (!res.ok) throw new Error();
        return await res.json();
    } catch (e) {
        console.error("likeArt error:", e);
        return null;
    }
};

export const getArtLikes = async (
    artId: number,
    page: number = 1,
    limit: number = 20
): Promise<{ data: any[]; total: number; pagination: any } | null> => {
    try {
        const res = await fetch(`${BASE_URL}/art/${artId}/likes?page=${page}&limit=${limit}`, {
            credentials: "include",
        });
        if (!res.ok) throw new Error();
        return await res.json();
    } catch (e) {
        console.error("getArtLikes error:", e);
        return null;
    }
};

export const viewArt = async (artId: number): Promise<void> => {
    try {
        await fetch(`${BASE_URL}/art/${artId}/view`, {
            method: "POST",
            credentials: "include",
        });
    } catch (e) {
        console.error("viewArt error:", e);
    }
};

export const getArtistStats = async (
    artistId: number,
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
        const res = await fetch(`${BASE_URL}/artist/${artistId}?${query}`, {
            credentials: "include",
        });
        if (!res.ok) throw new Error();
        return await res.json();
    } catch (e) {
        console.error("getArtistStats error:", e);
        return null;
    }
};

export const getArtStats = async (
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
        console.error("getArtStats error:", e);
        return null;
    }
};