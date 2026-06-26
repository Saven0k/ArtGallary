import { BASE_URL_API } from "../main.api";

const BASE_URL = `${BASE_URL_API}/styles
`

export type Style = {
    id: number;
    name: string;
};

export type CreateStyleDto = {
    name: string;
};


export const getAllStyles = async (): Promise<Style[]> => {
    const res = await fetch(BASE_URL, {
        method: "GET",
        credentials: "include",
    });

    if (!res.ok) {
        throw new Error("Ошибка при получении стилей");
    }

    return res.json();
};

export const getStyleById = async (id: number): Promise<Style> => {
    const res = await fetch(`${BASE_URL}/${id}`, {
        method: "GET",
        credentials: "include",
    });

    if (!res.ok) {
        throw new Error("Ошибка при получении стиля");
    }

    return res.json();
};

export const createStyle = async (data: { name: string }): Promise<Style> => {
    const res = await fetch(BASE_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(data),
    });

    if (!res.ok) {
        throw new Error("Ошибка при создании стиля");
    }

    return res.json();
};

export const deleteStyle = async (id: number): Promise<boolean> => {
    const res = await fetch(`${BASE_URL}/${id}`, {
        method: "DELETE",
        credentials: "include",
    });

    if (!res.ok) {
        throw new Error("Ошибка при удалении стиля");
    }

    return res.json();
};

export const updateStyle = async (id: number, data: CreateStyleDto) => {
    const res = await fetch(`${BASE_URL}/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(data),
    });
}