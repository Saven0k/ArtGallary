// src/stats/interfaces/stats.interface.ts
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

export interface AuthorStatsResponse {
    authorId: number;

    totalLikes: number;
    totalViews: number;

    likesByGender: GenderStats;
    likesByAge: AgeStats;
    likesByCountry: CountryStats[];
    likesTimeline: TimelineData[];

    viewsByGender: GenderStats;
    viewsByAge: AgeStats;
    viewsByCountry: CountryStats[];
    viewsTimeline: TimelineData[];

    artViews: number;
    authorViews: number;
    uniqueUsers: number;
}

export interface ArtStatsResponse {
    artId: number;
    authorId: number;
    title: string;

    totalLikes: number;
    totalViews: number;

    likesByGender: GenderStats;
    likesByAge: AgeStats;
    likesByCountry: CountryStats[];
    likesTimeline: TimelineData[];

    viewsByGender: GenderStats;
    viewsByAge: AgeStats;
    viewsByCountry: CountryStats[];
    viewsTimeline: TimelineData[];

    uniqueUsers: number;
}