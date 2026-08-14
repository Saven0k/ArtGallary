// src/api/users/main.api.ts
import { BASE_URL_API } from "../main.api";

export type UserRole = 'admin' | 'moderator' | 'author' | 'user' ;
export type Gender = "M" | "F";

export interface User {
    id: number;
    email: string;
    name: string;
    surname: string;
    second_name: string;
    role: UserRole;
    gender: Gender;
    date_birthday: string;
    city_id?: number | null;
    country_id?: number | null;
    is_deleted?: boolean;
    deleted_at?: string | null;
    createdAt?: string;
    updatedAt?: string;
    authorProfile?: AuthorProfileData;
    country?: { id: number; name_en: string; name_ru: string; iso2: string; iso3: string };
    city?: { id: number; name_en: string; name_ru: string; country_id: number; country_code: string };
}

export interface AuthorProfileData {
    user_id: number;
    biography?: string;
    moderate?: any;
    profession_id?: number;
    profession?: { id: number; name: string };
    plan?: string;
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
    totalLikes?: number;
    avatar_path: string
    arts?: any[];
}

export type UserProfile = Omit<User, 'password'>;

export interface CreateUserData {
    email: string;
    password: string;
    name: string;
    surname: string;
    second_name?: string;
    gender: Gender;
    date_birthday: string;
    city_id?: number | null;
    country_id?: number | null;
}

export interface UpdateUserData {
    email?: string;
    password?: string;
    name?: string;
    surname?: string;
    second_name?: string;
    gender?: Gender;
    date_birthday?: string;
    city_id?: number | null;
    country_id?: number | null;
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

const BASE_URL = `${BASE_URL_API}/users`;

export const getAllUsers = async (): Promise<User[] | null> => {
    try {
        const res = await fetch(BASE_URL, { credentials: "include" });
        if (!res.ok) throw new Error();
        return await res.json();
    } catch (e) {
        console.error("getAllUsers error:", e);
        return null;
    }
};

export const getDeletedUsers = async (): Promise<User[] | null> => {
    try {
        const res = await fetch(`${BASE_URL}/deleted`, { credentials: "include" });
        if (!res.ok) throw new Error();
        return await res.json();
    } catch (e) {
        console.error("getDeletedUsers error:", e);
        return null;
    }
};

export const getUserById = async (id: number): Promise<User | null> => {
    try {
        const res = await fetch(`${BASE_URL}/${id}`, { credentials: "include" });
        if (!res.ok) throw new Error();
        return await res.json();
    } catch (e) {
        console.error("getUserById error:", e);
        return null;
    }
};

export const getUserProfile = async (id: number): Promise<User | null> => {
    try {
        const res = await fetch(`${BASE_URL}/${id}/profile`, { credentials: "include" });
        if (!res.ok) throw new Error();
        return await res.json();
    } catch (e) {
        console.error("getUserProfile error:", e);
        return null;
    }
};

export const createUser = async (data: CreateUserData): Promise<User | null> => {
    try {
        const formData = new FormData();
        formData.append("email", data.email);
        formData.append("password", data.password);
        formData.append("name", data.name);
        formData.append("surname", data.surname);
        formData.append("gender", data.gender);
        formData.append("date_birthday", data.date_birthday);

        if (data.second_name) formData.append("second_name", data.second_name);
        if (data.city_id != null) formData.append("city_id", String(data.city_id));
        if (data.country_id != null) formData.append("country_id", String(data.country_id));

        const res = await fetch(BASE_URL, {
            method: "POST",
            credentials: "include",
            body: formData,
        });
        if (!res.ok) throw new Error();
        return await res.json();
    } catch (e) {
        console.error("createUser error:", e);
        return null;
    }
};

export const updateUser = async (id: number, data: UpdateUserData): Promise<User | null> => {
    try {
        const formData = new FormData();
        if (data.email) formData.append("email", data.email);
        if (data.password) formData.append("password", data.password);
        if (data.name) formData.append("name", data.name);
        if (data.surname) formData.append("surname", data.surname);
        if (data.second_name) formData.append("second_name", data.second_name);
        if (data.gender) formData.append("gender", data.gender);
        if (data.date_birthday) formData.append("date_birthday", data.date_birthday);
        if (data.city_id != null) formData.append("city_id", String(data.city_id));
        if (data.country_id != null) formData.append("country_id", String(data.country_id));

        const res = await fetch(`${BASE_URL}/${id}`, {
            method: "PATCH",
            credentials: "include",
            body: formData,
        });
        if (!res.ok) throw new Error();
        return await res.json();
    } catch (e) {
        console.error("updateUser error:", e);
        return null;
    }
};

export const deleteUser = async (id: number): Promise<{ message: string; userId: number } | null> => {
    try {
        const res = await fetch(`${BASE_URL}/${id}`, {
            method: "DELETE",
            credentials: "include",
        });
        if (!res.ok) throw new Error();
        return await res.json();
    } catch (e) {
        console.error("deleteUser error:", e);
        return null;
    }
};

export const restoreUser = async (id: number): Promise<User | null> => {
    try {
        const res = await fetch(`${BASE_URL}/${id}/restore`, {
            method: "POST",
            credentials: "include",
        });
        if (!res.ok) throw new Error();
        return await res.json();
    } catch (e) {
        console.error("restoreUser error:", e);
        return null;
    }
};

// ==================== ПОДПИСКИ ЧЕРЕЗ USERS ====================

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

export const getUserFollowing = async (page: number = 1, limit: number = 20): Promise<PaginatedResponse<Following> | null> => {
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