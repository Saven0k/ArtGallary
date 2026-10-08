import { apiFetch } from '../request';
import { BASE_URL_API } from "../main.api";

const BASE_URL = `${BASE_URL_API}/moderators`;

export interface CreateModeratorData {
    email: string;
    password: string;
    name: string;
    surname: string;
    second_name?: string;
    gender: 'M' | 'F';
    date_birthday: string;
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
        role: string;
        gender: 'M' | 'F';
        date_birthday: string;
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


export const getAllModerators = async (page: number = 1, limit: number = 10): Promise<ModeratorsResponse | null> => {
    try {
        const res = await apiFetch(`${BASE_URL}?page=${page}&limit=${limit}`, {
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


export const getModeratorById = async (id: number): Promise<Moderator | null> => {
    try {
        const res = await apiFetch(`${BASE_URL}/${id}`, {
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


export const createModerator = async (data: CreateModeratorData): Promise<Moderator | null> => {
    try {
        const res = await apiFetch(BASE_URL, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
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


export const deleteModerator = async (id: number): Promise<boolean> => {
    try {
        const res = await apiFetch(`${BASE_URL}/${id}`, {
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



export interface UpdateModeratorData {
    email?: string;
    password?: string;
    name?: string;
    surname?: string;
    second_name?: string;
    gender?: 'M' | 'F';
    date_birthday?: string;
}

export const updateModerator = async (
    id: number,
    data: UpdateModeratorData,
): Promise<Moderator | null> => {
    try {
        const res = await apiFetch(`${BASE_URL}/${id}`, {
            method: 'PUT',
            credentials: 'include',
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });

        if (!res.ok) {
            const error = await res.json().catch(() => ({}));
            throw new Error(error.message || res.statusText);
        }

        return await res.json();
    } catch (e) {
        console.log('updateModerator error:', e);
        return null;
    }
};