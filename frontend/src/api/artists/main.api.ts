import { BASE_URL_API, type ModerateData } from "../main.api";

const BASE_URL = `${BASE_URL_API}/artists`;

export interface ArtistProfileResponse {
    id: number;
    email: string;
    name: string;
    surname: string;
    second_name?: string;
    phone_number: string;
    avatar_path?: string | null;
    role: string;
    createdAt: string;
    updatedAt: string;
    artistProfile?: {
        user_id: number;
        date_birthday?: string;
        biography?: string;
        moderate?: ModerateData;
        city_id?: number;
        country_id?: number;
        city?: {
            id: number;
            name: string;
            _translation?: any;
        } | null;
        country?: {
            id: number;
            name: string;
            _translation?: any;
        } | null;
        artsCount?: number;
        exhibitionsCount?: number;
        likes?: number;
    };
};
export interface ArtistsResponse {
    data: ArtistProfileResponse[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
    };
}
export interface CreateArtistData {
    email: string;
    password: string;
    name: string;
    surname: string;
    second_name?: string;
    phone_number: string;
    avatar_path?: File | null;
    date_birthday?: Date | string | null;
    biography?: string | null;
    city_id?: number | null;
    country_id?: number | null;
}
export interface UpdateArtistData {
    name?: string;
    surname?: string;
    second_name?: string;
    phone_number?: string;
    date_birthday?: string;
    biography?: string;
    city_id?: number;
    country_id?: number;
    avatar_path?: File | string | null;
    likes?: number;
}
export interface ModerateArtistData {
    moderate: boolean;
    moderator_id: number;
    errors?: Record<string, string>;
    comment?: string | null;
}
export const getArtists = async (page: number = 1, limit: number = 12, lang: string = 'ru') => {
    try {
        const res = await fetch(`${BASE_URL}?page=${page}&limit=${limit}&lang=${lang}`, {
            method: "GET",
            credentials: "include",
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.message || res.statusText);
        }

        return await res.json();
    } catch (e) {
        console.error("getArtists error:", e);
        return null;
    }
};
export const getArtistById = async (id: number, lang: string = 'ru') => {
    try {
        const res = await fetch(`${BASE_URL}/${id}?lang=${lang}`, {
            method: "GET",
            credentials: "include",
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.message || res.statusText);
        }

        return await res.json();
    } catch (e) {
        console.error("getArtistById error:", e);
        return null;
    }
};
export const createArtist = async (data: CreateArtistData): Promise<ArtistProfileResponse | null> => {
    try {
        const formData = new FormData();

        formData.append("email", data.email);
        formData.append("password", data.password);
        formData.append("name", data.name);
        formData.append("surname", data.surname);

        if (data.second_name) {
            formData.append("second_name", data.second_name);
        }

        formData.append("phone_number", data.phone_number);

        if (data.avatar_path && data.avatar_path instanceof File) {
            formData.append("avatar_path", data.avatar_path);
        }

        if (data.date_birthday) {
            let dateString: string;
            if (typeof data.date_birthday === 'string') {
                dateString = data.date_birthday;
            } else if (data.date_birthday instanceof Date) {
                dateString = data.date_birthday.toISOString().split('T')[0];
            } else {
                dateString = String(data.date_birthday);
            }
            formData.append("date_birthday", dateString);
        }

        formData.append("biography", data.biography || "");

        if (data.city_id) {
            formData.append("city_id", String(data.city_id));
        }

        if (data.country_id) {
            formData.append("country_id", String(data.country_id));
        }

        const res = await fetch(BASE_URL, {
            method: "POST",
            credentials: "include",
            body: formData,
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.message || res.statusText);
        }

        return await res.json();
    } catch (e) {
        console.error("createArtist error:", e);
        return null;
    }
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
        if (data.city_id) formData.append("city_id", String(data.city_id));
        if (data.country_id) formData.append("country_id", String(data.country_id));
        if (data.likes) formData.append("likes", String(data.likes));

        if (data.avatar_path && data.avatar_path instanceof File) {
            formData.append("avatar_path", data.avatar_path);
        }

        const res = await fetch(`${BASE_URL}/${id}`, {
            method: "PATCH",
            credentials: "include",
            body: formData,
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.message || res.statusText);
        }

        return await res.json();
    } catch (e) {
        console.error("updateArtist error:", e);
        return null;
    }
};
export const likeArtist = async (id: number, currentLikes: number, action: 'increment' | 'decrement'): Promise<ArtistProfileResponse | null> => {
    const newLikes = action === 'increment' ? currentLikes : Math.max(0, currentLikes - 1);
    return updateArtist(id, { likes: newLikes });
};
export const deleteArtistById = async (id: number): Promise<boolean> => {
    try {
        const res = await fetch(`${BASE_URL}/${id}`, {
            method: "DELETE",
            credentials: "include",
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.message || res.statusText);
        }

        return true;
    } catch (e) {
        console.error("deleteArtist error:", e);
        return false;
    }
};
export const moderateArtist = async (id: number, data: ModerateArtistData): Promise<ArtistProfileResponse | null> => {
    try {
        const res = await fetch(`${BASE_URL}/${id}/moderate`, {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.message || res.statusText);
        }

        return await res.json();
    } catch (e) {
        console.error("moderateArtist error:", e);
        return null;
    }
};
export const getUnmoderatedArtists = async (page: number = 1, limit: number = 12, lang: string = 'ru') => {
    try {
        const res = await fetch(`${BASE_URL}/unmoderated?page=${page}&limit=${limit}&lang=${lang}`, {
            credentials: "include",
        });

        if (!res.ok) {
            throw new Error(res.statusText);
        }

        return await res.json();
    } catch (e) {
        console.error("getUnmoderatedArtists error:", e);
        return null;
    }
};
export const getModeratedArtists = async (page: number = 1, limit: number = 12, lang: string = 'ru') => {
    try {
        const res = await fetch(`${BASE_URL}/moderated?page=${page}&limit=${limit}&lang=${lang}`, {
            credentials: "include",
        });

        if (!res.ok) {
            throw new Error(res.statusText);
        }

        return await res.json();
    } catch (e) {
        console.error("getModeratedArtists error:", e);
        return null;
    }
};
export const getArtsByArtist = async (id: number): Promise<any[] | null> => {
    try {
        const res = await fetch(`${BASE_URL}/${id}/arts`, {
            method: "GET",
            credentials: "include",
        });

        if (!res.ok) throw new Error();

        return await res.json();
    } catch (e) {
        console.error("getArtsByArtist error:", e);
        return null;
    }
};
export const getExhibitionsByArtist = async (id: number): Promise<any[] | null> => {
    try {
        const res = await fetch(`${BASE_URL}/${id}/exhibitions`, {
            method: "GET",
            credentials: "include",
        });

        if (!res.ok) throw new Error();

        return await res.json();
    } catch (e) {
        console.error("getExhibitionsByArtist error:", e);
        return null;
    }
};
