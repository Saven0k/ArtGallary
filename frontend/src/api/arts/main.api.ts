// src/api/arts/main.api.ts
import { BASE_URL_API } from "../main.api";
import type { Genre } from "../genres/main.api";
import type { Style } from "../styles/main.api";

const BASE_URL = `${BASE_URL_API}/arts`;

export type CurrencyType = "USD" | "EUR" | "RUB" | "UAH";
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
    author_id?: number;
    city_id?: number | null;
    country_id?: number | null;
    genre_id?: number;
    style_id?: number;
    shares?: number;
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
    tags?: { id: number; name: string }[];
}

export interface CreateArtData {
    title: string;
    description: string;
    cost?: number | null;
    currency?: string | null;
    image_path?: File | null;
    specifications?: string;
    date_published: string;
    author_id?: number;
    city_id?: number | null;
    country_id?: number | null;
    genre_id?: number;
    style_id?: number;
    is_adult?: boolean;
    tags?: string[];
}

export interface ModerateArtData {
    moderate: boolean;
    moderator_id: number;
    errors?: Record<string, string>;
    comment?: string | null;
}

export type UpdateArtData = Partial<{
    title: string;
    description: string;
    cost: number | null;
    currency: string | null;
    specifications: string;
    date_published: string;
    author_id: number;
    city_id: number | null;
    country_id: number | null;
    genre_id: number;
    style_id: number;
    is_adult: boolean;
    tags: string[];
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
    } catch (e) { console.error("getAllArts error:", e); return null; }
};

export const getModeratedArts = async (page = 1, limit = 10, lang = 'ru'): Promise<ArtsResponse | null> => {
    try {
        const res = await fetch(`${BASE_URL}/moderated?page=${page}&limit=${limit}&lang=${lang}`, { credentials: "include" });
        if (!res.ok) throw new Error();
        return await res.json();
    } catch (e) { console.error("getModeratedArts error:", e); return null; }
};

export const getUnmoderatedArts = async (page = 1, limit = 10, lang = 'ru'): Promise<ArtsResponse | null> => {
    try {
        const res = await fetch(`${BASE_URL}/unmoderated?page=${page}&limit=${limit}&lang=${lang}`, { credentials: "include" });
        if (!res.ok) throw new Error();
        return await res.json();
    } catch (e) { console.error("getUnmoderatedArts error:", e); return null; }
};

export const getArtById = async (id: number, lang = 'ru'): Promise<Art | null> => {
    try {
        const res = await fetch(`${BASE_URL}/${id}?lang=${lang}`, { credentials: "include" });
        if (!res.ok) throw new Error();
        return await res.json();
    } catch (e) { console.error("getArtById error:", e); return null; }
};

export const getArtsByAuthor = async (authorId: number, page = 1, limit = 10, lang = 'ru'): Promise<ArtsResponse | null> => {
    try {
        const res = await fetch(`${BASE_URL}/author/${authorId}?page=${page}&limit=${limit}&lang=${lang}`, { credentials: "include" });
        if (!res.ok) throw new Error();
        return await res.json();
    } catch (e) { console.error("getArtsByAuthor error:", e); return null; }
};

export const createArt = async (data: CreateArtData): Promise<Art | null> => {
    try {
        const formData = new FormData();
        formData.append("title", data.title);
        formData.append("description", data.description);
        formData.append("date_published", data.date_published);
        if (data.image_path instanceof File) formData.append("image_path", data.image_path);
        if (data.cost != null) formData.append("cost", String(data.cost));
        if (data.currency) formData.append("currency", data.currency);
        if (data.specifications) formData.append("specifications", data.specifications);
        if (data.author_id) formData.append("author_id", String(data.author_id));
        if (data.city_id != null) formData.append("city_id", String(data.city_id));
        if (data.country_id != null) formData.append("country_id", String(data.country_id));
        if (data.genre_id) formData.append("genre_id", String(data.genre_id));
        if (data.style_id) formData.append("style_id", String(data.style_id));
        if (data.is_adult != null) formData.append("is_adult", String(data.is_adult));
        if (data.tags) formData.append("tags", JSON.stringify(data.tags));

        const res = await fetch(BASE_URL, { method: "POST", credentials: "include", body: formData });
        if (!res.ok) throw new Error();
        return await res.json();
    } catch (e) { console.error("createArt error:", e); return null; }
};

export const updateArt = async (id: number, data: UpdateArtData): Promise<Art | null> => {
    try {
        const res = await fetch(`${BASE_URL}/${id}`, {
            method: "PATCH",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error();
        return await res.json();
    } catch (e) { console.error("updateArt error:", e); return null; }
};

export const deleteArt = async (id: number): Promise<boolean> => {
    try {
        const res = await fetch(`${BASE_URL}/${id}`, { method: "DELETE", credentials: "include" });
        if (!res.ok) throw new Error();
        return true;
    } catch (e) { console.error("deleteArt error:", e); return false; }
};

export const moderateArt = async (id: number, data: ModerateArtData): Promise<Art | null> => {
    try {
        const res = await fetch(`${BASE_URL}/${id}/moderate`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error();
        return await res.json();
    } catch (e) { console.error("moderateArt error:", e); return null; }
};

export const getTopArts = async (limit = 10, lang = 'ru'): Promise<Art[] | null> => {
    try {
        const res = await fetch(`${BASE_URL}/top?limit=${limit}&lang=${lang}`, { credentials: "include" });
        if (!res.ok) throw new Error();
        return await res.json();
    } catch (e) { console.error("getTopArts error:", e); return null; }
};

export const addArtToFeatured = async (id: number, days = 7): Promise<Art | null> => {
    try {
        const res = await fetch(`${BASE_URL}/${id}/featured?days=${days}`, { method: "POST", credentials: "include" });
        if (!res.ok) throw new Error();
        return await res.json();
    } catch (e) { console.error("addArtToFeatured error:", e); return null; }
};

export const removeArtFromFeatured = async (id: number): Promise<boolean> => {
    try {
        const res = await fetch(`${BASE_URL}/${id}/featured`, { method: "DELETE", credentials: "include" });
        if (!res.ok) throw new Error();
        return true;
    } catch (e) { console.error("removeArtFromFeatured error:", e); return false; }
};

export const updateAllScores = async (): Promise<boolean> => {
    try {
        const res = await fetch(`${BASE_URL}/update-scores`, { method: "POST", credentials: "include" });
        if (!res.ok) throw new Error();
        return true;
    } catch (e) { console.error("updateAllScores error:", e); return false; }
};

export const refreshFeatured = async (): Promise<boolean> => {
    try {
        const res = await fetch(`${BASE_URL}/refresh-featured`, { method: "POST", credentials: "include" });
        if (!res.ok) throw new Error();
        return true;
    } catch (e) { console.error("refreshFeatured error:", e); return false; }
};

export const incrementView = async (id: number): Promise<Art | null> => {
    try {
        const res = await fetch(`${BASE_URL}/${id}/view`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
        });
        if (!res.ok) throw new Error();
        return await res.json();
    } catch (e) { console.error("incrementView error:", e); return null; }
};

export const incrementArtShares = async (id: number): Promise<{ success: boolean; shares: number } | null> => {
    try {
        const res = await fetch(`${BASE_URL}/${id}/share`, {
            method: "POST",
            credentials: "include",
        });
        if (!res.ok) throw new Error();
        return await res.json();
    } catch (e) { console.error("incrementArtShares error:", e); return null; }
};

export const getArtShares = async (id: number): Promise<{ shares: number } | null> => {
    try {
        const res = await fetch(`${BASE_URL}/${id}/share/count`, {
            method: "GET",
            credentials: "include",
        });
        if (!res.ok) throw new Error();
        return await res.json();
    } catch (e) { console.error("getArtShares error:", e); return null; }
};

export const likeArt = async (id: number): Promise<{ success: boolean; message: string } | null> => {
    try {
        const res = await fetch(`${BASE_URL}/${id}/like`, {
            method: "POST",
            credentials: "include",
        });
        if (!res.ok) throw new Error();
        return await res.json();
    } catch (e) { console.error("likeArt error:", e); return null; }
};

export const getArtLikes = async (id: number, page = 1, limit = 20): Promise<any | null> => {
    try {
        const res = await fetch(`${BASE_URL}/${id}/likes?page=${page}&limit=${limit}`, {
            method: "GET",
            credentials: "include",
        });
        if (!res.ok) throw new Error();
        return await res.json();
    } catch (e) { console.error("getArtLikes error:", e); return null; }
};

export const getArtLikesCount = async (id: number): Promise<{ count: number } | null> => {
    try {
        const res = await fetch(`${BASE_URL}/${id}/likes/count`, {
            method: "GET",
            credentials: "include",
        });
        if (!res.ok) throw new Error();
        return await res.json();
    } catch (e) { console.error("getArtLikesCount error:", e); return null; }
};

export const getArtViewsCount = async (id: number): Promise<{ count: number } | null> => {
    try {
        const res = await fetch(`${BASE_URL}/${id}/views/count`, {
            method: "GET",
            credentials: "include",
        });
        if (!res.ok) throw new Error();
        return await res.json();
    } catch (e) { console.error("getArtViewsCount error:", e); return null; }
};