// src/api/authors/main.api.ts
import { BASE_URL_API } from "../main.api";
import type { UserRole } from "../users/main.api";

const BASE_URL = `${BASE_URL_API}/authors`;

export type Gender = "M" | "F";

export interface CountryResponse {
    id: number;
    name_en: string;
    name_ru: string;
    iso2: string;
    iso3: string;
}

export interface CityResponse {
    id: number;
    name_en: string;
    name_ru: string;
    country_id: number;
    country_code: string;
}

export interface ProfessionResponse {
    id: number;
    name: string;
    description?: string;
}

export interface AuthorProfileResponse {
    id: number;
    email: string;
    name: string;
    surname: string;
    second_name?: string;
    role: UserRole;
    gender: Gender;
    date_birthday: string;
    city: CityResponse | null;
    country: CountryResponse | null;
    authorProfile: {
        user_id: number;
        biography?: string;
        moderate?: any;
        profession_id?: number;
        profession?: ProfessionResponse;
        plan: string;
        planExpiresAt?: string | null;
        planStatus?: boolean;
        planWeight?: number;
        isSubscriptionActive?: boolean;
        likes?: number;
        views?: number;
        shares?: number;
        is_deleted?: boolean;
        deleted_at?: string | null;
        artsCount?: number;
        avatar_path: string;
        totalLikes?: number;
        arts?: any[];
        followers_count?: number;
        createdAt?: string;
    };
}

export interface CreateAuthorData {
    email: string;
    password: string;
    name: string;
    surname: string;
    second_name?: string;
    phone_number: string;
    avatar_path: File;
    date_birthday: string;
    biography?: string | null;
    gender: Gender;
    profession_id: number;
    country_id?: number | null;
    city_id?: number | null;
}

export interface UpdateAuthorData {
    name?: string;
    surname?: string;
    second_name?: string;
    phone_number?: string;
    date_birthday?: string;
    biography?: string;
    avatar_path?: File | string | null;
    gender?: Gender;
    profession_id?: number;
    country_id?: number | null;
    city_id?: number | null;
}

export interface ModerateAuthorData {
    moderate: boolean;
    moderator_id: number;
    errors?: Record<string, string>;
    comment?: string | null;
}

export interface AuthorListResponse {
    data: AuthorProfileResponse[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
    };
}


export interface FollowResponse {
    success: boolean;
    message: string;
    is_following: boolean;
    followers_count: number;
}

export interface Follower {
    id: number;
    name: string;
    surname: string;
    avatar_path?: string;
    followed_at: string;
}

export interface Following {
    author_id: number;
    author_name: string;
    author_surname: string;
    author_avatar?: string;
    followers_count: number;
    followed_at: string;
}


export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
    };
}

export const getAuthors = async (page = 1, limit = 12, lang = 'ru'): Promise<AuthorListResponse | null> => {
    try {
        const res = await fetch(`${BASE_URL}?page=${page}&limit=${limit}&lang=${lang}`, {
            credentials: "include",
        });
        if (!res.ok) throw new Error();
        return await res.json();
    } catch (e) {
        console.error("getAuthors error:", e);
        return null;
    }
};

export const getAuthorById = async (id: number, lang = 'ru'): Promise<AuthorProfileResponse | null> => {
    try {
        const res = await fetch(`${BASE_URL}/${id}?lang=${lang}`, {
            credentials: "include",
        });
        if (!res.ok) throw new Error();
        return await res.json();
    } catch (e) {
        console.error("getAuthorById error:", e);
        return null;
    }
};

export const getMyAuthorProfile = async (): Promise<AuthorProfileResponse | null> => {
    try {
        const res = await fetch(`${BASE_URL}/me`, {
            credentials: "include",
        });
        if (!res.ok) throw new Error();
        return await res.json();
    } catch (e) {
        console.error("getMyAuthorProfile error:", e);
        return null;
    }
};

export const createAuthor = async (data: CreateAuthorData): Promise<AuthorProfileResponse | null> => {
    try {
        const formData = new FormData();
        formData.append("email", data.email);
        formData.append("password", data.password);
        formData.append("name", data.name);
        formData.append("surname", data.surname);
        formData.append("gender", data.gender);
        formData.append("date_birthday", data.date_birthday);

        if (data.second_name) formData.append("second_name", data.second_name);
        if (data.phone_number) formData.append("phone_number", data.phone_number);
        if (data.biography) formData.append("biography", data.biography);
        if (data.profession_id) formData.append("profession_id", String(data.profession_id));
        if (data.country_id != null) formData.append("country_id", String(data.country_id));
        if (data.city_id != null) formData.append("city_id", String(data.city_id));

        if (data.avatar_path instanceof File) {
            formData.append("avatar_path", data.avatar_path);
        }

        const res = await fetch(BASE_URL, {
            method: "POST",
            credentials: "include",
            body: formData,
        });
        if (!res.ok) throw new Error();
        return await res.json();
    } catch (e) {
        console.error("createAuthor error:", e);
        return null;
    }
};

export const updateAuthor = async (id: number, data: UpdateAuthorData): Promise<AuthorProfileResponse | null> => {
    try {
        const formData = new FormData();
        if (data.name) formData.append("name", data.name);
        if (data.surname) formData.append("surname", data.surname);
        if (data.second_name) formData.append("second_name", data.second_name);
        if (data.phone_number) formData.append("phone_number", data.phone_number);
        if (data.date_birthday) formData.append("date_birthday", data.date_birthday);
        if (data.biography) formData.append("biography", data.biography);
        if (data.gender) formData.append("gender", data.gender);
        if (data.profession_id) formData.append("profession_id", String(data.profession_id));
        if (data.country_id !== undefined && data.country_id !== null) {
            formData.append("country_id", String(data.country_id));
        }
        if (data.city_id !== undefined && data.city_id !== null) {
            formData.append("city_id", String(data.city_id));
        }

        if (data.avatar_path instanceof File) {
            formData.append("avatar_path", data.avatar_path);
        }

        const res = await fetch(`${BASE_URL}/${id}`, {
            method: "PATCH",
            credentials: "include",
            body: formData,
        });
        if (!res.ok) throw new Error();
        return await res.json();
    } catch (e) {
        console.error("updateAuthor error:", e);
        return null;
    }
};

export const deleteAuthor = async (id: number): Promise<{ success: boolean; message: string } | null> => {
    try {
        const res = await fetch(`${BASE_URL}/${id}`, {
            method: "DELETE",
            credentials: "include",
        });
        if (!res.ok) throw new Error();
        return await res.json();
    } catch (e) {
        console.error("deleteAuthor error:", e);
        return null;
    }
};

export const restoreAuthor = async (id: number): Promise<{ success: boolean; message: string } | null> => {
    try {
        const res = await fetch(`${BASE_URL}/${id}/restore`, {
            method: "POST",
            credentials: "include",
        });
        if (!res.ok) throw new Error();
        return await res.json();
    } catch (e) {
        console.error("restoreAuthor error:", e);
        return null;
    }
};

export const moderateAuthor = async (id: number, data: ModerateAuthorData): Promise<AuthorProfileResponse | null> => {
    try {
        const res = await fetch(`${BASE_URL}/${id}/moderate`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error();
        return await res.json();
    } catch (e) {
        console.error("moderateAuthor error:", e);
        return null;
    }
};

export const getUnmoderatedAuthors = async (page = 1, limit = 12, lang = 'ru'): Promise<AuthorListResponse | null> => {
    try {
        const res = await fetch(`${BASE_URL}/unmoderated?page=${page}&limit=${limit}&lang=${lang}`, {
            credentials: "include",
        });
        if (!res.ok) throw new Error();
        return await res.json();
    } catch (e) {
        console.error("getUnmoderatedAuthors error:", e);
        return null;
    }
};

export const getModeratedAuthors = async (page = 1, limit = 12, lang = 'ru'): Promise<AuthorListResponse | null> => {
    try {
        const res = await fetch(`${BASE_URL}/moderated?page=${page}&limit=${limit}&lang=${lang}`, {
            credentials: "include",
        });
        if (!res.ok) throw new Error();
        return await res.json();
    } catch (e) {
        console.error("getModeratedAuthors error:", e);
        return null;
    }
};

export const getArtsByAuthor = async (id: number): Promise<any[] | null> => {
    try {
        const res = await fetch(`${BASE_URL}/${id}/arts`, {
            credentials: "include",
        });
        if (!res.ok) throw new Error();
        return await res.json();
    } catch (e) {
        console.error("getArtsByAuthor error:", e);
        return null;
    }
};

export const getTopAuthors = async (limit = 10, lang = 'ru'): Promise<AuthorProfileResponse[] | null> => {
    try {
        const res = await fetch(`${BASE_URL}/top?limit=${limit}&lang=${lang}`, {
            credentials: "include",
        });
        if (!res.ok) throw new Error();
        return await res.json();
    } catch (e) {
        console.error("getTopAuthors error:", e);
        return null;
    }
};

// ==================== ПОДПИСКИ ====================

export const toggleFollow = async (authorId: number): Promise<FollowResponse | null> => {
    try {
        const res = await fetch(`${BASE_URL}/${authorId}/follow`, {
            method: "POST",
            credentials: "include",
        });
        if (!res.ok) throw new Error();
        return await res.json();
    } catch (e) {
        console.error("toggleFollow error:", e);
        return null;
    }
};

export const getAuthorFollowers = async (
    authorId: number,
    page: number = 1,
    limit: number = 20
): Promise<PaginatedResponse<Follower> | null> => {
    try {
        const res = await fetch(`${BASE_URL}/${authorId}/followers?page=${page}&limit=${limit}`, {
            credentials: "include",
        });
        if (!res.ok) throw new Error();
        return await res.json();
    } catch (e) {
        console.error("getAuthorFollowers error:", e);
        return null;
    }
};

export const getUserFollowing = async (
    page: number = 1,
    limit: number = 20
): Promise<PaginatedResponse<Following> | null> => {
    try {
        const res = await fetch(`${BASE_URL}/following?page=${page}&limit=${limit}`, {
            credentials: "include",
        });
        if (!res.ok) throw new Error();
        return await res.json();
    } catch (e) {
        console.error("getUserFollowing error:", e);
        return null;
    }
};

export const checkFollow = async (authorId: number): Promise<{ is_following: boolean } | null> => {
    try {
        const res = await fetch(`${BASE_URL}/${authorId}/follow/check`, {
            credentials: "include",
        });
        if (!res.ok) throw new Error();
        return await res.json();
    } catch (e) {
        console.error("checkFollow error:", e);
        return null;
    }
};

export const getFollowersCount = async (authorId: number): Promise<{ count: number } | null> => {
    try {
        const res = await fetch(`${BASE_URL}/${authorId}/followers/count`, {
            credentials: "include",
        });
        if (!res.ok) throw new Error();
        return await res.json();
    } catch (e) {
        console.error("getFollowersCount error:", e);
        return null;
    }
};

// ==================== ЛАЙКИ И ПРОСМОТРЫ ====================

export const likeAuthor = async (authorId: number): Promise<{ success: boolean; message: string } | null> => {
    try {
        const res = await fetch(`${BASE_URL}/${authorId}/like`, {
            method: "POST",
            credentials: "include",
        });
        if (!res.ok) throw new Error();
        return await res.json();
    } catch (e) {
        console.error("likeAuthor error:", e);
        return null;
    }
};

export const getAuthorLikes = async (
    authorId: number,
    page: number = 1,
    limit: number = 20
): Promise<any | null> => {
    try {
        const res = await fetch(`${BASE_URL}/${authorId}/likes?page=${page}&limit=${limit}`, {
            credentials: "include",
        });
        if (!res.ok) throw new Error();
        return await res.json();
    } catch (e) {
        console.error("getAuthorLikes error:", e);
        return null;
    }
};

export const getAuthorLikesCount = async (authorId: number): Promise<{ count: number } | null> => {
    try {
        const res = await fetch(`${BASE_URL}/${authorId}/likes/count`, {
            credentials: "include",
        });
        if (!res.ok) throw new Error();
        return await res.json();
    } catch (e) {
        console.error("getAuthorLikesCount error:", e);
        return null;
    }
};

export const viewAuthor = async (authorId: number): Promise<void> => {
    try {
        await fetch(`${BASE_URL}/${authorId}/view`, {
            method: "POST",
            credentials: "include",
        });
    } catch (e) {
        console.error("viewAuthor error:", e);
    }
};

export const getAuthorViewsCount = async (authorId: number): Promise<{ count: number } | null> => {
    try {
        const res = await fetch(`${BASE_URL}/${authorId}/views/count`, {
            credentials: "include",
        });
        if (!res.ok) throw new Error();
        return await res.json();
    } catch (e) {
        console.error("getAuthorViewsCount error:", e);
        return null;
    }
};

// ==================== ШАРЫ ====================

export const incrementAuthorShares = async (authorId: number): Promise<{ success: boolean; shares: number } | null> => {
    try {
        const res = await fetch(`${BASE_URL}/${authorId}/share`, {
            method: "POST",
            credentials: "include",
        });
        if (!res.ok) throw new Error();
        return await res.json();
    } catch (e) {
        console.error("incrementAuthorShares error:", e);
        return null;
    }
};

export const getAuthorShares = async (authorId: number): Promise<{ shares: number } | null> => {
    try {
        const res = await fetch(`${BASE_URL}/${authorId}/share/count`, {
            credentials: "include",
        });
        if (!res.ok) throw new Error();
        return await res.json();
    } catch (e) {
        console.error("getAuthorShares error:", e);
        return null;
    }
};