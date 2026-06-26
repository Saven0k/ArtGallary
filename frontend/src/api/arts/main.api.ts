import type { Exhibition } from "../exhibitions/main.api";
import type { Genre } from "../genres/main.api";
import { BASE_URL_API, type ModerateData } from "../main.api";
import type { Style } from "../styles/main.api";

const BASE_URL = `${BASE_URL_API}/arts`;

export type CurrencyType = "USD" | "EUR" | "RUB" | "UAH";

export interface Art {
    id: number;
    title: string;
    description: string;
    image_path: string;
    cost?: number;
    currency?: CurrencyType;
    likes?: number;
    metadata?: string;
    date_published: string;
    moderate?: ModerateData | boolean;
    is_adult?: boolean;
    artist_id?: number;
    city_id?: number;
    country_id?: number;
    genre_id?: number;
    type_id?: number;
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
    city?: { id: number; name: string } | null;
    country?: { id: number; name: string } | null;
    genre?: Genre;
    style?: Style;
    exhibitions?: Exhibition[];
}

export interface CreateArtDto {
    title: string;
    description: string;
    cost?: number;
    currency?: CurrencyType;
    image_path?: File | null;
    metadata?: string;
    date_published: string;
    artist_id?: number | string;
    city_id?: number | string;
    country_id?: number | string;
    genre_id?: number | string;
    style_id?: number | string;
    is_adult?: boolean;
    likes?: number;
}

export type UpdateArtDto = Partial<CreateArtDto>;

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
export const getAllArts = async (page: number = 1, limit: number = 10, lang: string = 'ru'): Promise<ArtsResponse | null> => {
    try {
        const res = await fetch(`${BASE_URL}?page=${page}&limit=${limit}&lang=${lang}`, {
            credentials: "include",
        });

        if (!res.ok) throw new Error();

        const data = await res.json();
        return data;
    } catch (e) {
        return null;
    }
};
export const getModeratedArts = async (page: number = 1, limit: number = 10, lang: string = 'ru'): Promise<ArtsResponse | null> => {
    try {
        const res = await fetch(`${BASE_URL}/moderated?page=${page}&limit=${limit}&lang=${lang}`, {
            credentials: "include",
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        return data;
    } catch (e) {
        return null;
    }
};
export const getUnmoderatedArts = async (page: number = 1, limit: number = 10, lang: string = 'ru'): Promise<ArtsResponse | null> => {
    try {
        const res = await fetch(`${BASE_URL}/unmoderated?page=${page}&limit=${limit}&lang=${lang}`, {
            credentials: "include",
        });
        if (!res.ok) throw new Error();
        return await res.json();
    } catch (e) {
        return null;
    }
};
export const getArtById = async (id: number, lang: string = 'ru'): Promise<Art | null> => {
    try {
        const res = await fetch(`${BASE_URL}/${id}?lang=${lang}`, {
            credentials: "include",
        });

        if (!res.ok) throw new Error();

        return await res.json();
    } catch (e) {
        return null;
    }
};
export const getArtsByArtist = async (artistId: number, page: number = 1, limit: number = 10, lang: string = 'ru'): Promise<ArtsResponse | null> => {
    try {
        const res = await fetch(`${BASE_URL}/artist/${artistId}?page=${page}&limit=${limit}&lang=${lang}`, {
            credentials: "include",
        });

        if (!res.ok) throw new Error();
        return await res.json();
    } catch (e) {
        return null;
    }
};
export const createArt = async (data: CreateArtDto): Promise<Art | null> => {
    try {
        const formData = new FormData();

        formData.append("title", data.title);
        formData.append("description", data.description);
        formData.append("date_published", data.date_published);

        if (data.image_path && data.image_path instanceof File) {
            formData.append("image_path", data.image_path);
        }

        if (data.cost) formData.append("cost", String(data.cost));
        if (data.currency) formData.append("currency", data.currency);
        if (data.metadata) formData.append("metadata", data.metadata);
        if (data.artist_id) formData.append("artist_id", String(data.artist_id));
        if (data.city_id) formData.append("city_id", String(data.city_id));
        if (data.country_id) formData.append("country_id", String(data.country_id));
        if (data.genre_id) formData.append("genre_id", String(data.genre_id));
        if (data.style_id) formData.append("type_id", String(data.style_id));
        if (data.is_adult) formData.append("is_adult", String(data.is_adult));

        const res = await fetch(BASE_URL, {
            method: "POST",
            credentials: "include",
            body: formData,
        });

        if (!res.ok) throw new Error();

        return await res.json();
    } catch (e) {
        return null;
    }
};
export const updateArt = async (id: number, data: UpdateArtDto): Promise<Art | null> => {
    try {
        const res = await fetch(`${BASE_URL}/${id}`, {
            method: "PATCH",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });

        if (!res.ok) throw new Error();

        return await res.json();
    } catch (e) {
        return null;
    }
};
export const likeArt = async (id: number, currentLikes: number, action: 'increment' | 'decrement'): Promise<Art | null> => {
    const newLikes = action === 'increment' ? currentLikes : Math.max(0, currentLikes - 1);
    return updateArt(id, { likes: newLikes });
};
export const deleteArt = async (id: number): Promise<boolean> => {
    try {
        const res = await fetch(`${BASE_URL}/${id}`, {
            method: "DELETE",
            credentials: "include",
        });

        if (!res.ok) throw new Error();

        return true;
    } catch (e) {
        return false;
    }
};
export const moderateArt = async (id: number, data: ModerateData): Promise<Art | null> => {
    try {
        const res = await fetch(`${BASE_URL}/${id}/moderate`, {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });

        if (!res.ok) throw new Error();

        return await res.json();
    } catch (e) {
        return null;
    }
};