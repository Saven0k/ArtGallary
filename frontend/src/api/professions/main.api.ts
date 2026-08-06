// src/api/professions/main.api.ts
import { BASE_URL_API } from "../main.api";

const BASE_URL = `${BASE_URL_API}/professions`;

export interface Profession {
    id: number;
    name: string;
    description?: string;
}

export interface CreateProfessionData {
    name: string;
    description?: string;
}

export interface UpdateProfessionData {
    name?: string;
    description?: string;
}

export interface DeleteProfessionResponse {
    success: boolean;
    message: string;
}

export const getAllProfessions = async (): Promise<Profession[] | null> => {
    try {
        const res = await fetch(BASE_URL, {
            method: "GET",
            credentials: "include",
        });
        if (!res.ok) throw new Error();
        return await res.json();
    } catch (e) {
        console.error("getAllProfessions error:", e);
        return null;
    }
};

export const getProfessionById = async (id: number): Promise<Profession | null> => {
    try {
        const res = await fetch(`${BASE_URL}/${id}`, {
            method: "GET",
            credentials: "include",
        });
        if (!res.ok) throw new Error();
        return await res.json();
    } catch (e) {
        console.error("getProfessionById error:", e);
        return null;
    }
};

export const createProfession = async (data: CreateProfessionData): Promise<Profession | null> => {
    try {
        const res = await fetch(BASE_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error();
        return await res.json();
    } catch (e) {
        console.error("createProfession error:", e);
        return null;
    }
};

export const updateProfession = async (id: number, data: UpdateProfessionData): Promise<Profession | null> => {
    try {
        const res = await fetch(`${BASE_URL}/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error();
        return await res.json();
    } catch (e) {
        console.error("updateProfession error:", e);
        return null;
    }
};

export const deleteProfession = async (id: number): Promise<DeleteProfessionResponse | null> => {
    try {
        const res = await fetch(`${BASE_URL}/${id}`, {
            method: "DELETE",
            credentials: "include",
        });
        if (!res.ok) throw new Error();
        return await res.json();
    } catch (e) {
        console.error("deleteProfession error:", e);
        return null;
    }
};