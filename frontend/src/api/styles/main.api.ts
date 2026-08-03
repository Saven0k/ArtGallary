import { BASE_URL_API } from "../main.api";

const BASE_URL = `${BASE_URL_API}/styles`;

// === SERVER: styles.model.ts ===
// id: integer auto-increment
// name: string (unique, not null)
// description: text (nullable)

export interface Style {
    id: number;
    name: string;
    description?: string;
}

export interface CreateStyleDto {
    name: string;
    description?: string;
}

export const getAllStyles = async (): Promise<Style[]> => {
    const res = await fetch(BASE_URL, { method: "GET", credentials: "include" });
    if (!res.ok) throw new Error("Ошибка при загрузке стилей");
    return res.json();
};

export const getStyleById = async (id: number): Promise<Style> => {
    const res = await fetch(`${BASE_URL}/${id}`, { method: "GET", credentials: "include" });
    if (!res.ok) throw new Error("Ошибка при получении стиля");
    return res.json();
};

export const createStyle = async (data: CreateStyleDto): Promise<Style> => {
    const res = await fetch(BASE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Ошибка при создании стиля");
    return res.json();
};

export const deleteStyle = async (id: number): Promise<boolean> => {
    const res = await fetch(`${BASE_URL}/${id}`, { method: "DELETE", credentials: "include" });
    if (!res.ok) throw new Error("Ошибка при удалении стиля");
    return res.json();
};

export const updateStyle = async (id: number, data: CreateStyleDto) => {
    await fetch(`${BASE_URL}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
    });
}
