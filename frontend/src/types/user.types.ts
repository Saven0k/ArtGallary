// @ts-ignore — ArtistUser extends User but intentionally overrides role/city_id/country_id types
import type { User } from '../api/users/main.api';

// @ts-ignore — extend User, override only artist-specific fields
export interface ArtistUser extends User {
    artistProfile?: {
        user_id: number;
        date_birthday?: string;
        biography?: string;
        moderate?: any;
        profession_id?: number;
        plan?: string;
        planExpiresAt?: string | null;
        planStatus?: boolean;
        likes?: number;
        views?: number;
        is_deleted?: boolean;
        deleted_at?: string | null;
        profession?: { id: number; name: string; description?: string };
        artsCount?: number;
        totalLikes?: number;
        arts?: any[];
        exhibitionsCount?: number;
        city?: { id: number; name_en: string; name_ru?: string; region?: string } | null;
        country?: { id: number; name_en: string; name_ru?: string; iso2: string } | null;
    };
}
