import { BASE_URL_API } from "../main.api";

const BASE_URL = `${BASE_URL_API}/cities`

export type City = {
    id: number;
    name: string;
};

export type CreateCityDto = {
    name: string;
};

export const getAllCities = async (): Promise<City[]> => {
    const res = await fetch(BASE_URL, {
        method: "GET",
        credentials: "include",
    });

    if (!res.ok) {
        throw new Error("Ошибка при получении городов");
    }

    return res.json();
};

export const getCityById = async (id: number): Promise<City> => {
    const res = await fetch(`${BASE_URL}/${id}`, {
        method: "GET",
        credentials: "include",
    });

    if (!res.ok) {
        throw new Error("Ошибка при получении города");
    }

    return res.json();
};

export const createCity = async (data: { name: string }): Promise<City> => {
    const res = await fetch(BASE_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(data),
    });

    if (!res.ok) {
        throw new Error("Ошибка при создании города");
    }

    return res.json();
};

export const deleteCity = async (id: number): Promise<boolean> => {
    const res = await fetch(`${BASE_URL}/${id}`, {
        method: "DELETE",
        credentials: "include",
    });

    if (!res.ok) {
        throw new Error("Ошибка при удалении города");
    }

    return res.json();
};

export const deleteAllCities = async (): Promise<boolean> => {
    const res = await fetch(`${BASE_URL}/all`, {
        method: "DELETE",
        credentials: "include",
    });

    if (!res.ok) {
        throw new Error("Ошибка при удалении всех городов");
    }

    return res.json();
};


export const updateCity = async (id: number, data: { name: string }): Promise<City> => {
    const res = await fetch(`${BASE_URL}/${id}`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(data),
    })

    if (!res.ok) {
        throw new Error("Ошибка обновления города")
    }

    return res.json();
}