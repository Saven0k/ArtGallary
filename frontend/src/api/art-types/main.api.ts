import { BASE_URL_API } from "../main.api";

const BASE_URL = `${BASE_URL_API}/art-types`;

export interface ArtType {
    id: number;
    name: string;
    description?: string;
}

export const getAllArtTypes = async (): Promise<ArtType[]> => {
    const res = await fetch(BASE_URL, { method: "GET", credentials: "include" });
    if (!res.ok) throw new Error("Ошибка при загрузке типов искусства");
    return res.json();
};

export const getArtTypeById = async (id: number): Promise<ArtType> => {
    const res = await fetch(`${BASE_URL}/${id}`, { method: "GET", credentials: "include" });
    if (!res.ok) throw new Error("Ошибка при получении типа искусства");
    return res.json();
};

export const createArtType = async (data: Partial<ArtType>): Promise<ArtType> => {
    const res = await fetch(BASE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Ошибка при создании типа искусства");
    return res.json();
};

export const updateArtType = async (id: number, data: Partial<ArtType>) => {
    const res = await fetch(`${BASE_URL}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Ошибка при обновлении типа искусства");
    return res.json();
};

export const deleteArtType = async (id: number): Promise<boolean> => {
    const res = await fetch(`${BASE_URL}/${id}`, { method: "DELETE", credentials: "include" });
    if (!res.ok) throw new Error("Ошибка при удалении типа искусства");
    return res.json();
};
