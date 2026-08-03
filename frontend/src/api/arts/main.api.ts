import { BASE_URL_API } from "../main.api";
import type { Genre } from "../genres/main.api";
import type { Style } from "../styles/main.api";

const BASE_URL = `${BASE_URL_API}/arts`;

export type CurrencyType = "USD" | "EUR" | "RUB" | "UAH";

// === SERVER: Arts model fields ===
// title, description, image_path, cost (float|null), currency (string|null)
// specifications (string JSON), date_published (Date), moderate (string JSON)
// artist_id (int|null), genre_id (int), style_id (int), city_id/country_id (int|null)
// is_adult, likes, views, score, is_featured, featured_until

export interface Art {
    id: number;
    title: string;
    description: string;
    image_path: string;
    cost?: number | null;
    currency?: string | null;
    likes?: number;
    views?: number;
    specifications: string;
    date_published: string;
    moderate?: string;
    is_adult?: boolean;
    score?: number;
    is_featured?: boolean;
    featured_until?: string;
    artist_id?: number;
    city_id?: number | null;
    country_id?: number | null;
    genre_id?: number;
    style_id?: number;
    artist?: {
        id: number;
        user_id: number;
        user?: {
            id: number;
            name: string;
            surname: string;
            avatar_path?: string | null;
        };
    };
    city?: { id: number; name_en: string; name_ru?: string } | null;
    country?: { id: number; name_en: string; name_ru?: string; iso2: string } | null;
    genre?: Genre;
    style?: Style;
}

export interface CreateArtDto {
    title: string;
    description: string;
    cost?: number | null;
    currency?: string | null;
    image_path?: File | null;
    specifications?: string;
    date_published: string;
    artist_id?: number;
    city_id?: number | null;
    country_id?: number | null;
    genre_id?: number;
    style_id?: number;
    is_adult?: boolean;
    tags?: string[];
}

// Server Art.moderate is a JSON string. Controller may accept DTO or raw.
export interface ModerateArtData {
    moderate: boolean;
    moderator_id: number;
    errors?: Record<string, string>;
    comment?: string | null;
}

export type UpdateArtDto = Partial<{
    title: string;
    description: string;
    cost: number | null;
    currency: string | null;
    specifications: string;
    date_published: string;
    artist_id: number;
    city_id: number | null;
    country_id: number | null;
    genre_id: number;
    style_id: number;
    is_adult: boolean;
}>;

export interface ArtsResponse {
    arts: Art[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
    };
}

export const getAllArts = async (page = 1, limit = 10, lang = 'ru'): Promise<ArtsResponse | null> => {
    try {
        const res = await fetch(`${BASE_URL}?page=${page}&limit=${limit}&lang=${lang}`, { credentials: "include" });
        if (!res.ok) throw new Error();
        return await res.json();
    } catch (e) { return null; }
};

export const getModeratedArts = async (page = 1, limit = 10, lang = 'ru'): Promise<ArtsResponse | null> => {
    try {
        const res = await fetch(`${BASE_URL}/moderated?page=${page}&limit=${limit}&lang=${lang}`, { credentials: "include" });
        if (!res.ok) throw new Error();
        return await res.json();
    } catch (e) { return null; }
};

export const getUnmoderatedArts = async (page = 1, limit = 10, lang = 'ru'): Promise<ArtsResponse | null> => {
    try {
        const res = await fetch(`${BASE_URL}/unmoderated?page=${page}&limit=${limit}&lang=${lang}`, { credentials: "include" });
        if (!res.ok) throw new Error();
        return await res.json();
    } catch (e) { return null; }
};

export const getArtById = async (id: number, lang = 'ru'): Promise<Art | null> => {
    try {
        const res = await fetch(`${BASE_URL}/${id}?lang=${lang}`, { credentials: "include" });
        if (!res.ok) throw new Error();
        return await res.json();
    } catch (e) { return null; }
};

export const getArtsByArtist = async (artistId: number, page = 1, limit = 10, lang = 'ru'): Promise<ArtsResponse | null> => {
    try {
        const res = await fetch(`${BASE_URL}/artist/${artistId}?page=${page}&limit=${limit}&lang=${lang}`, { credentials: "include" });
        if (!res.ok) throw new Error();
        return await res.json();
    } catch (e) { return null; }
};

export const createArt = async (data: CreateArtDto): Promise<Art | null> => {
    try {
        const formData = new FormData();
        formData.append("title", data.title);
        formData.append("description", data.description);
        formData.append("date_published", data.date_published);
        if (data.image_path instanceof File) formData.append("image_path", data.image_path);
        if (data.cost != null) formData.append("cost", String(data.cost));
        if (data.currency) formData.append("currency", data.currency);
        if (data.specifications) formData.append("specifications", data.specifications);
        if (data.artist_id) formData.append("artist_id", String(data.artist_id));
        if (data.city_id != null) formData.append("city_id", String(data.city_id));
        if (data.country_id != null) formData.append("country_id", String(data.country_id));
        if (data.genre_id) formData.append("genre_id", String(data.genre_id));
        if (data.style_id) formData.append("style_id", String(data.style_id));
        if (data.is_adult != null) formData.append("is_adult", String(data.is_adult));
        if (data.tags) formData.append("tags", String(data.tags));

        const res = await fetch(BASE_URL, { method: "POST", credentials: "include", body: formData });
        if (!res.ok) throw new Error();
        return await res.json();
    } catch (e) { return null; }
};

export const updateArt = async (id: number, data: UpdateArtDto): Promise<Art | null> => {
    try {
        const res = await fetch(`${BASE_URL}/${id}`, {
            method: "PATCH", credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error();
        return await res.json();
    } catch (e) { return null; }
};

export const likeArt = async (id: number, currentLikes: number, action: 'increment' | 'decrement'): Promise<Art | null> => {
    const newLikes = action === 'increment' ? currentLikes + 1 : Math.max(0, currentLikes - 1);
    return updateArt(id, { likes: newLikes } as any);
};

export const deleteArt = async (id: number): Promise<boolean> => {
    try {
        const res = await fetch(`${BASE_URL}/${id}`, { method: "DELETE", credentials: "include" });
        if (!res.ok) throw new Error();
        return true;
    } catch (e) { return false; }
};

export const moderateArt = async (id: number, data: ModerateArtData): Promise<Art | null> => {
    try {
        const res = await fetch(`${BASE_URL}/${id}/moderate`, {
            method: "POST", credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error();
        return await res.json();
    } catch (e) { return null; }
};

export const getTopArts = async (limit = 10, lang = 'ru'): Promise<Art[] | null> => {
    try {
        const res = await fetch(`${BASE_URL}/top?limit=${limit}&lang=${lang}`, { credentials: "include" });
        if (!res.ok) throw new Error();
        return await res.json();
    } catch (e) { return null; }
};

export const addArtToFeatured = async (id: number, days = 7): Promise<Art | null> => {
    try {
        const res = await fetch(`${BASE_URL}/${id}/featured?days=${days}`, { method: "POST", credentials: "include" });
        if (!res.ok) throw new Error();
        return await res.json();
    } catch (e) { return null; }
};

export const removeArtFromFeatured = async (id: number): Promise<boolean> => {
    try {
        const res = await fetch(`${BASE_URL}/${id}/featured`, { method: "DELETE", credentials: "include" });
        if (!res.ok) throw new Error();
        return true;
    } catch (e) { return false; }
};

export const updateAllScores = async (): Promise<boolean> => {
    try {
        const res = await fetch(`${BASE_URL}/update-scores`, { method: "POST", credentials: "include" });
        if (!res.ok) throw new Error();
        return true;
    } catch (e) { return false; }
};

export const refreshFeatured = async (): Promise<boolean> => {
    try {
        const res = await fetch(`${BASE_URL}/refresh-featured`, { method: "POST", credentials: "include" });
        if (!res.ok) throw new Error();
        return true;
    } catch (e) { return false; }
};

export const incrementView = async (id: number): Promise<Art | null> => {
    try {
        const res = await fetch(`${BASE_URL}/${id}/view`, {
            method: "POST", credentials: "include",
            headers: { "Content-Type": "application/json" },
        });
        if (!res.ok) throw new Error();
        return await res.json();
    } catch (e) { console.error('Error incrementing view:', e); return null; }
};
