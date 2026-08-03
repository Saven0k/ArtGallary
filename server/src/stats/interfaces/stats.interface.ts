// src/stats/interfaces/stats.interface.ts
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

export interface ArtistStatsResponse extends StatsResponse {
    recentLikes: RecentLike[];
}

export interface RecentLike {
    id: number;
    user: {
        id: number;
        name: string;
        surname: string;
        avatar_path?: string;
    };
    createdAt: Date;
}