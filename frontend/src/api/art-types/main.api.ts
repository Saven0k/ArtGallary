// src/api/art-types/main.api.ts
import type { Genre } from "../genres/main.api";
import { BASE_URL_API } from "../main.api";

const BASE_URL = `${BASE_URL_API}/art-types`;

export interface ArtType {
    id: number;
    name: string;
    description?: string;
    genres?: Genre[];
}

export interface CreateArtTypeData {
    name: string;
    description?: string;
}

export interface UpdateArtTypeData {
    name?: string;
    description?: string;
}

export const getAllArtTypes = async (): Promise<ArtType[]> => {
    try {
        const res = await fetch(BASE_URL, {
            method: "GET",
            credentials: "include",
        });
        if (!res.ok) throw new Error("Ошибка при загрузке типов искусства");
        return await res.json();
    } catch (e) {
        console.error("getAllArtTypes error:", e);
        throw e;
    }
};

export const getArtTypeById = async (id: number): Promise<ArtType> => {
    try {
        const res = await fetch(`${BASE_URL}/${id}`, {
            method: "GET",
            credentials: "include",
        });
        if (!res.ok) throw new Error("Ошибка при получении типа искусства");
        return await res.json();
    } catch (e) {
        console.error("getArtTypeById error:", e);
        throw e;
    }
};

export const createArtType = async (data: CreateArtTypeData): Promise<ArtType> => {
    try {
        const res = await fetch(BASE_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error("Ошибка при создании типа искусства");
        return await res.json();
    } catch (e) {
        console.error("createArtType error:", e);
        throw e;
    }
};

export const updateArtType = async (id: number, data: UpdateArtTypeData): Promise<ArtType> => {
    try {
        const res = await fetch(`${BASE_URL}/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error("Ошибка при обновлении типа искусства");
        return await res.json();
    } catch (e) {
        console.error("updateArtType error:", e);
        throw e;
    }
};

export const deleteArtType = async (id: number): Promise<{ success: boolean; message: string }> => {
    try {
        const res = await fetch(`${BASE_URL}/${id}`, {
            method: "DELETE",
            credentials: "include",
        });
        if (!res.ok) throw new Error("Ошибка при удалении типа искусства");
        return await res.json();
    } catch (e) {
        console.error("deleteArtType error:", e);
        throw e;
    }
};

export const seedArtTypes = async (): Promise<ArtType[]> => {
    try {
        const res = await fetch(`${BASE_URL}/seed`, {
            method: "POST",
            credentials: "include",
        });
        if (!res.ok) throw new Error("Ошибка при заполнении начальных данных");
        return await res.json();
    } catch (e) {
        console.error("seedArtTypes error:", e);
        throw e;
    }
};