// src/api/genres/main.api.ts
import { BASE_URL_API } from "../main.api";

const BASE_URL = `${BASE_URL_API}/genres`;

export interface Genre {
    id: number;
    title: string;
    description?: string;
    art_type_id: number;
    artType?: {
        id: number;
        name: string;
    };
}

export interface CreateGenreData {
    title: string;
    art_type_id: number;
    description?: string;
}

export interface UpdateGenreData {
    title?: string;
    art_type_id?: number;
    description?: string;
}

export const getAllGenres = async (lang: string = 'ru', artTypeId?: number): Promise<Genre[]> => {
    try {
        let url = `${BASE_URL}?lang=${lang}`;
        if (artTypeId) {
            url += `&artTypeId=${artTypeId}`;
        }

        const res = await fetch(url, {
            method: "GET",
            credentials: "include",
        });

        if (!res.ok) throw new Error("Ошибка при загрузке жанров");
        return await res.json();
    } catch (e) {
        console.error("getAllGenres error:", e);
        throw e;
    }
};

export const getGenresByArtType = async (artTypeId: number, lang: string = 'ru'): Promise<Genre[]> => {
    try {
        const res = await fetch(`${BASE_URL}/by-art-type/${artTypeId}?lang=${lang}`, {
            method: "GET",
            credentials: "include",
        });

        if (!res.ok) throw new Error("Ошибка при получении жанров для типа искусства");
        return await res.json();
    } catch (e) {
        console.error("getGenresByArtType error:", e);
        throw e;
    }
};

export const getGenreById = async (id: number, lang: string = 'ru'): Promise<Genre> => {
    try {
        const res = await fetch(`${BASE_URL}/${id}?lang=${lang}`, {
            method: "GET",
            credentials: "include",
        });

        if (!res.ok) throw new Error("Ошибка при получении жанра");
        return await res.json();
    } catch (e) {
        console.error("getGenreById error:", e);
        throw e;
    }
};

export const createGenre = async (data: CreateGenreData): Promise<Genre> => {
    try {
        const res = await fetch(BASE_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(data),
        });

        if (!res.ok) throw new Error("Ошибка при создании жанра");
        return await res.json();
    } catch (e) {
        console.error("createGenre error:", e);
        throw e;
    }
};

export const updateGenre = async (id: number, data: UpdateGenreData): Promise<Genre> => {
    try {
        const res = await fetch(`${BASE_URL}/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(data),
        });

        if (!res.ok) throw new Error("Ошибка при обновлении жанра");
        return await res.json();
    } catch (e) {
        console.error("updateGenre error:", e);
        throw e;
    }
};

export const deleteGenre = async (id: number): Promise<{ success: boolean; message: string }> => {
    try {
        const res = await fetch(`${BASE_URL}/${id}`, {
            method: "DELETE",
            credentials: "include",
        });

        if (!res.ok) throw new Error("Ошибка при удалении жанра");
        return await res.json();
    } catch (e) {
        console.error("deleteGenre error:", e);
        throw e;
    }
};

export const deleteAllGenres = async (): Promise<{ success: boolean; message: string }> => {
    try {
        const res = await fetch(`${BASE_URL}/all`, {
            method: "DELETE",
            credentials: "include",
        });

        if (!res.ok) throw new Error("Ошибка при удалении всех жанров");
        return await res.json();
    } catch (e) {
        console.error("deleteAllGenres error:", e);
        throw e;
    }
};

export const seedGenres = async (): Promise<Genre[]> => {
    try {
        const res = await fetch(`${BASE_URL}/seed`, {
            method: "POST",
            credentials: "include",
        });

        if (!res.ok) throw new Error("Ошибка при заполнении начальных данных");
        return await res.json();
    } catch (e) {
        console.error("seedGenres error:", e);
        throw e;
    }
};