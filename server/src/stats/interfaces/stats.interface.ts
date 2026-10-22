export interface GenderStats {
  male: number;
  female: number;
  unknown: number;
}

export interface AgeStats {
  '<18': number;
  '18-24': number;
  '25-34': number;
  '35-44': number;
  '45-54': number;
  '55+': number;
  unknown: number;
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
