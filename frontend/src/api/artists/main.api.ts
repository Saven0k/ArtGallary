import { BASE_URL_API } from "../main.api";
const BASE_URL = `${BASE_URL_API}/artists`;
export type Gender = "M" | "F";

export interface CountryResponse {
    id: number,
    name_en: string,
    name_ru:string,
    iso2: string;
    iso3: string
}
export interface CityResponse {
    id: number,
    name_en: string,
    name_ru:string,
    country_id: number,
    country_code: string;
}


export interface ArtistProfileResponse {
    id: number;
    email: string;
    name: string;
    surname: string;
    second_name?: string;
    phone_number: string;
    avatar_path?: string | null;
    role: string;
    gender: Gender;
    date_birthday: string;
    city: CityResponse | null;
    country: CountryResponse | null;
    artistProfile: {
        user_id: number;
        biography?: string;
        moderate?: any;
        profession_id?: number;
        plan: string;
        planExpiresAt?: string | null;
        planStatus?: boolean;
        likes?: number;
        views?: number;
        is_deleted?: boolean;
        deleted_at?: string | null;
        profession?: { id: number; name: string };
        artsCount?: number;
        totalLikes?: number;
        arts?: any[];
    };
}

type ArtistUser = ArtistProfileResponse & {
    user_id: number;
    date_birthday?: string;
    biography?: string;
    moderate?: any;
    profession_id?: number;
    plan: string;
    planExpiresAt?: string | null;
    planStatus?: boolean;
    likes?: number;
    views?: number;
    is_deleted?: boolean;
    deleted_at?: string | null;
    profession?: { id: number; name: string };
    artsCount?: number;
    totalLikes?: number;
    arts?: any[];
    city?: { id: number; name_en: string; name_ru?: string } | null;
    country?: { id: number; name_en: string; name_ru?: string; iso2: string } | null;
};

export interface CreateArtistData {
    email: string;
    password: string;
    name: string;
    surname: string;
    second_name: string;
    phone_number: string;
    avatar_path: File | null;
    date_birthday: string | null;
    biography?: string | null;
    gender: Gender;
    profession_id: number;
    country_id: number | null;
    city_id: number | null;
}

export interface UpdateArtistData {
    name?: string;
    surname?: string;
    second_name?: string;
    phone_number?: string;
    date_birthday?: string;
    biography?: string;
    avatar_path?: File | string | null;
    likes?: number;
    gender?: Gender;
    profession_id?: number;
    country_id?: number | null;
    city_id?: number | null;
}

export interface ModerateArtistData {
    moderate: boolean;
    moderator_id: number;
    errors?: Record<string, string>;
    comment?: string | null;
}

export const getArtists = async (page = 1, limit = 12, lang = 'ru') => {
    try {
        const res = await fetch(`${BASE_URL}?page=${page}&limit=${limit}&lang=${lang}`, { credentials: "include" });
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || res.statusText);
        return await res.json();
    } catch (e) { console.error("getArtists error:", e); return null; }
};

export const getArtistById = async (id: number, lang = 'ru') => {
    try {
        const res = await fetch(`${BASE_URL}/${id}?lang=${lang}`, { credentials: "include" });
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || res.statusText);
        return await res.json();
    } catch (e) { console.error("getArtistById error:", e); return null; }
};

export const createArtist = async (data: CreateArtistData): Promise<ArtistProfileResponse | null> => {
    try {
        const formData = new FormData();
        formData.append("email", data.email);
        formData.append("password", data.password);
        formData.append("name", data.name);
        formData.append("surname", data.surname);
        formData.append("gender", data.gender);
        if (data.second_name) formData.append("second_name", data.second_name);
        if (data.phone_number) formData.append("phone_number", data.phone_number);
        if (data.biography) formData.append("biography", data.biography);
        if (data.country_id != null) formData.append("country_id", String(data.country_id));
        if (data.city_id != null) formData.append("city_id", String(data.city_id));
        if (data.date_birthday) {
            const d = data.date_birthday instanceof Date ? data.date_birthday.toISOString().split('T')[0] : String(data.date_birthday);
            formData.append("date_birthday", d);
        }
        if (typeof data.avatar_path === 'object' && data.avatar_path !== null && 'webkitRelativePath' in data.avatar_path) {
            formData.append("avatar_path", data.avatar_path as any);
        }

        const res = await fetch(BASE_URL, { method: "POST", credentials: "include", body: formData });
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || res.statusText);
        return await res.json();
    } catch (e) { console.error("createArtist error:", e); return null; }
};

export const updateArtist = async (id: number, data: UpdateArtistData): Promise<ArtistProfileResponse | null> => {
    try {
        const formData = new FormData();
        if (data.name) formData.append("name", data.name);
        if (data.surname) formData.append("surname", data.surname);
        if (data.second_name) formData.append("second_name", data.second_name);
        if (data.phone_number) formData.append("phone_number", data.phone_number);
        if (data.date_birthday) formData.append("date_birthday", data.date_birthday);
        if (data.biography) formData.append("biography", data.biography);
        if (data.gender) formData.append("gender", data.gender);
        if (data.likes != null) formData.append("likes", String(data.likes));
        if (data.country_id !== undefined && data.country_id !== null) formData.append("country_id", String(data.country_id));
        if (data.city_id !== undefined && data.city_id !== null) formData.append("city_id", String(data.city_id));
        if (typeof data.avatar_path === 'object' && data.avatar_path !== null && 'webkitRelativePath' in data.avatar_path) {
            formData.append("avatar_path", data.avatar_path as any);
        }

        const res = await fetch(`${BASE_URL}/${id}`, { method: "PATCH", credentials: "include", body: formData });
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || res.statusText);
        return await res.json();
    } catch (e) { console.error("updateArtist error:", e); return null; }
};

export const likeArtist = async (id: number, currentLikes: number, action: 'increment' | 'decrement') =>
    updateArtist(id, { likes: action === 'increment' ? currentLikes + 1 : Math.max(0, currentLikes - 1) });

export const deleteArtistById = async (id: number): Promise<boolean> => {
    try {
        const res = await fetch(`${BASE_URL}/${id}`, { method: "DELETE", credentials: "include" });
        if (!res.ok) throw new Error();
        return true;
    } catch (e) { console.error("deleteArtist error:", e); return false; }
};

export const moderateArtist = async (id: number, data: ModerateArtistData): Promise<ArtistProfileResponse | null> => {
    try {
        const res = await fetch(`${BASE_URL}/${id}/moderate`, {
            method: "POST", credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || res.statusText);
        return await res.json();
    } catch (e) { console.error("moderateArtist error:", e); return null; }
};

export const getUnmoderatedArtists = async (page = 1, limit = 12, lang = 'ru') => {
    try {
        const res = await fetch(`${BASE_URL}/unmoderated?page=${page}&limit=${limit}&lang=${lang}`, { credentials: "include" });
        if (!res.ok) throw new Error();
        return await res.json();
    } catch (e) { console.error("getUnmoderatedArtists error:", e); return null; }
};

export const getModeratedArtists = async (page = 1, limit = 12, lang = 'ru') => {
    try {
        const res = await fetch(`${BASE_URL}/moderated?page=${page}&limit=${limit}&lang=${lang}`, { credentials: "include" });
        if (!res.ok) throw new Error();
        return await res.json();
    } catch (e) { console.error("getModeratedArtists error:", e); return null; }
};

export const getArtsByArtist = async (id: number) => {
    try {
        const res = await fetch(`${BASE_URL}/${id}/arts`, { credentials: "include" });
        if (!res.ok) throw new Error();
        return await res.json();
    } catch (e) { console.error("getArtsByArtist error:", e); return null; }
};

export const getTopArtists = async (limit = 10, lang = 'ru') => {
    try {
        const res = await fetch(`${BASE_URL_API}/artists/top?limit=${limit}&lang=${lang}`, { credentials: "include" });
        if (!res.ok) throw new Error();
        return await res.json();
    } catch (e) { console.error('getTopArtists error:', e); return null; }
};
