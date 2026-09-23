// src/site/interfaces/site.interface.ts
export interface SiteStatsResponse {
    totalVisits: number;
    todayVisits: number;
    weekVisits: number;
    monthVisits: number;
    uniqueUsers: number;
    averageRating: number;
    ratingsCount: number;
    topPaths: { path: string; count: number }[];
}