import { BASE_URL_API } from "../main.api";

const BASE_URL = `${BASE_URL_API}/genres`

export type Genre = {
    id: number;
    title: string;
    art_type_id: number;
    artType?: {
        id: number;
        name: string;
    };
};

export type CreateGenreDto = {
    title: string;
    art_type_id: number;
};

export type UpdateGenreDto = {
    title?: string;
    art_type_id?: number;
};

export const getAllGenres = async (lang: string = 'ru', artTypeId?: number): Promise<Genre[]> => {
    let url = `${BASE_URL}?lang=${lang}`;
    if (artTypeId) {
        url += `&artTypeId=${artTypeId}`;
    }

    const res = await fetch(url, {
        method: "GET",
        credentials: "include",
    });

    if (!res.ok) {
        throw new Error("Ошибка при получении жанров");
    }

    return res.json();
};

export const getGenresByArtType = async (artTypeId: number, lang: string = 'ru'): Promise<Genre[]> => {
    const res = await fetch(`${BASE_URL}/by-art-type/${artTypeId}?lang=${lang}`, {
        method: "GET",
        credentials: "include",
    });

    if (!res.ok) {
        throw new Error("Ошибка при получении жанров по виду искусства");
    }

    return res.json();
};

export const getGenreById = async (id: number, lang: string = 'ru'): Promise<Genre> => {
    const res = await fetch(`${BASE_URL}/${id}?lang=${lang}`, {
        method: "GET",
        credentials: "include",
    });

    if (!res.ok) {
        throw new Error("Ошибка при получении жанра");
    }

    return res.json();
};

export const createGenre = async (data: CreateGenreDto): Promise<Genre> => {
    const res = await fetch(BASE_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(data),
    });

    if (!res.ok) {
        throw new Error("Ошибка при создании жанра");
    }

    return res.json();
};

export const updateGenre = async (id: number, data: UpdateGenreDto): Promise<Genre> => {
    const res = await fetch(`${BASE_URL}/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(data),
    });

    if (!res.ok) {
        throw new Error("Ошибка при обновлении жанра");
    }

    return res.json();
};

export const deleteGenre = async (id: number): Promise<boolean> => {
    const res = await fetch(`${BASE_URL}/${id}`, {
        method: "DELETE",
        credentials: "include",
    });

    if (!res.ok) {
        throw new Error("Ошибка при удалении жанра");
    }

    return res.json();
};

export const deleteAllGenres = async (): Promise<boolean> => {
    const res = await fetch(`${BASE_URL}/all`, {
        method: "DELETE",
        credentials: "include",
    });

    if (!res.ok) {
        throw new Error("Ошибка при удалении всех жанров");
    }

    return res.json();
};