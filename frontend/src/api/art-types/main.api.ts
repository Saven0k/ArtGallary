import { BASE_URL_API } from "../main.api";

const BASE_URL = `${BASE_URL_API}/art-types`;

export type ArtType = {
    id: number;
    name: string;
};

export type CreateArtTypeDto = {
    name: string;
};

export type UpdateArtTypeDto = {
    name: string;
};

export const getAllArtTypes = async (lang: string = 'ru'): Promise<ArtType[]> => {
    const res = await fetch(`${BASE_URL}?lang=${lang}`, {
        method: "GET",
        credentials: "include",
    });

    if (!res.ok) {
        throw new Error("Ошибка при получении видов искусства");
    }

    return res.json();
};

export const getArtTypeById = async (id: number, lang: string = 'ru'): Promise<ArtType> => {
    const res = await fetch(`${BASE_URL}/${id}?lang=${lang}`, {
        method: "GET",
        credentials: "include",
    });

    if (!res.ok) {
        throw new Error("Ошибка при получении вида искусства");
    }

    return res.json();
};

export const createArtType = async (data: CreateArtTypeDto): Promise<ArtType> => {
    const res = await fetch(BASE_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(data),
    });

    if (!res.ok) {
        throw new Error("Ошибка при создании вида искусства");
    }

    return res.json();
};

export const updateArtType = async (id: number, data: UpdateArtTypeDto): Promise<ArtType> => {
    const res = await fetch(`${BASE_URL}/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(data),
    });

    if (!res.ok) {
        throw new Error("Ошибка при обновлении вида искусства");
    }

    return res.json();
};

export const deleteArtType = async (id: number): Promise<boolean> => {
    const res = await fetch(`${BASE_URL}/${id}`, {
        method: "DELETE",
        credentials: "include",
    });

    if (!res.ok) {
        throw new Error("Ошибка при удалении вида искусства");
    }

    return res.json();
};