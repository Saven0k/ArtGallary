import type { User } from "../../types/user.types";
import { BASE_URL_API } from "../main.api";

const BASE_URL = `${BASE_URL_API}/visitors`;

export const getAllVisitors = async (): Promise<User[]> => {
    const res = await fetch(BASE_URL, {
        method: "GET",
        credentials: "include",
    });

    if (!res.ok) {
        throw new Error("Ошибка при получении посетителей");
    }

    return res.json();
};

export const getVisitorById = async (id: number): Promise<User> => {
    const res = await fetch(`${BASE_URL}/${id}`, {
        method: "GET",
        credentials: "include",
    });

    if (!res.ok) {
        throw new Error("Ошибка при получении посетителя");
    }

    return res.json();
};

export const createVisitor = async (data: {
    email: string;
    password: string;

    name: string;
    surname: string;
    second_name?: string;

    phone_number: string;
    avatar_path?: string;
}): Promise<User> => {
    const res = await fetch(BASE_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(data),
    });

    if (!res.ok) {
        throw new Error("Ошибка при создании посетителя");
    }

    return res.json();
};

export const updateVisitor = async (
    id: number,
    data: Partial<{
        email: string;
        password: string;

        name: string;
        surname: string;
        second_name: string;

        phone_number: string;
        avatar_path: string;
    }>
): Promise<User> => {
    const res = await fetch(`${BASE_URL}/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(data),
    });

    if (!res.ok) {
        throw new Error("Ошибка при обновлении посетителя");
    }

    return res.json();
};

export const deleteVisitor = async (id: number): Promise<void> => {
    const res = await fetch(`${BASE_URL}/${id}`, {
        method: "DELETE",
        credentials: "include",
    });

    if (!res.ok) {
        throw new Error("Ошибка при удалении посетителя");
    }
};