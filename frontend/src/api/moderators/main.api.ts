import { BASE_URL_API } from "../main.api";

const BASE_URL = `${BASE_URL_API}/moderators`;

export interface CreateModeratorData {
    email: string;
    password: string;
    name: string;
    surname: string;
    second_name?: string;
    phone_number: string;
    avatar_path?: File | null;
}

export interface Moderator {
    id: number;
    user_id: number;
    assigned_by: number;
    createdAt: string;
    updatedAt: string;
    user?: {
        id: number;
        email: string;
        name: string;
        surname: string;
        second_name?: string;
        phone_number: string;
        role: string;
        avatar_path?: string | null;
    };
}

export interface ModeratorsResponse {
    data: Moderator[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
    };
}

// Получение всех модераторов
export const getAllModerators = async (page: number = 1, limit: number = 10): Promise<ModeratorsResponse | null> => {
    try {
        const res = await fetch(`${BASE_URL}?page=${page}&limit=${limit}`, {
            credentials: "include",
        });

        if (!res.ok) {
            throw new Error(res.statusText);
        }

        return await res.json();
    } catch (e) {
        console.log("getAllModerators error:", e);
        return null;
    }
};

// Получение модератора по ID
export const getModeratorById = async (id: number): Promise<Moderator | null> => {
    try {
        const res = await fetch(`${BASE_URL}/${id}`, {
            credentials: "include",
        });

        if (!res.ok) {
            throw new Error(res.statusText);
        }

        return await res.json();
    } catch (e) {
        console.log("getModeratorById error:", e);
        return null;
    }
};

// Создание модератора (создание нового пользователя с ролью moderator)
export const createModerator = async (data: CreateModeratorData): Promise<Moderator | null> => {
    try {
        const formData = new FormData();
        
        formData.append("email", data.email);
        formData.append("password", data.password);
        formData.append("name", data.name);
        formData.append("surname", data.surname);
        formData.append("phone_number", data.phone_number);
        
        if (data.second_name) {
            formData.append("second_name", data.second_name);
        }
        if (data.avatar_path && data.avatar_path instanceof File) {
            formData.append("avatar_path", data.avatar_path);
        }

        const res = await fetch(BASE_URL, {
            method: "POST",
            credentials: "include",
            body: formData,
        });

        if (!res.ok) {
            const error = await res.json().catch(() => ({}));
            throw new Error(error.message || res.statusText);
        }

        return await res.json();
    } catch (e) {
        console.log("createModerator error:", e);
        return null;
    }
};

// Удаление модератора
export const deleteModerator = async (id: number): Promise<boolean> => {
    try {
        const res = await fetch(`${BASE_URL}/${id}`, {
            method: "DELETE",
            credentials: "include",
        });

        if (!res.ok) {
            throw new Error(res.statusText);
        }

        return true;
    } catch (e) {
        console.log("deleteModerator error:", e);
        return false;
    }
};