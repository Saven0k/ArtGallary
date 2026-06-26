import { BASE_URL_API } from "../main.api";

const BASE_URL = `${BASE_URL_API}/countries`

export type Country = {
    id: number;
    name: string;
};

export type CreateCountryDto = {
    name: string;
};

export const getAllCountries = async (): Promise<Country[]> => {
    const res = await fetch(BASE_URL, {
        method: "GET",
        credentials: "include",
    });

    if (!res.ok) {
        throw new Error("Ошибка при получении стран");
    }

    return res.json();
};

export const getCountryById = async (id: number): Promise<Country> => {
    const res = await fetch(`${BASE_URL}/${id}`, {
        method: "GET",
        credentials: "include",
    });

    if (!res.ok) {
        throw new Error("Ошибка при получении страны");
    }

    return res.json();
};

export const createCountry = async (data: { name: string }): Promise<Country> => {
    const res = await fetch(BASE_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(data),
    });

    if (!res.ok) {
        throw new Error("Ошибка при создании страны");
    }

    return res.json();
};

export const deleteCountry = async (id: number): Promise<boolean> => {
    const res = await fetch(`${BASE_URL}/${id}`, {
        method: "DELETE",
        credentials: "include",
    });

    if (!res.ok) {
        throw new Error("Ошибка при удалении страны");
    }

    return res.json();
};

export const deleteAllCountries = async (): Promise<Boolean> => {
    const res = await fetch(`${BASE_URL}/all`, {
        method: "DELETE",
        credentials: "include",
    });

    if (!res.ok) {
        throw new Error("Ошибка при удалении всех стран");
    }

    return res.json();
};

export const updateCountry = async (id: number, data: { name: string }): Promise<Country> => {
    const res = await fetch(`${BASE_URL}/${id}`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(data),
    })

    if (!res.ok) {
        throw new Error("Ошибка обновления страны")
    }

    return res.json();
};