import type { User } from "../../types/user.types";
import { BASE_URL_API } from "../main.api";

const BASE_URL = `${BASE_URL_API}/users`;


export const getUserProfile = async (id: number) => {
    try {
        const res = await fetch(`${BASE_URL}/${id}/profile`, {
            credentials: "include",
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.message || res.statusText);
        }

        const data = await res.json();
        return data
    } catch (e) {
        console.log("getUserProfile error:", e);
        return null;
    }
};

export const getAllUsers = async (): Promise<User[]> => {
    try {
        const res = await fetch(BASE_URL, {
            credentials: "include",
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.message || res.statusText);
        }

        return await res.json();
    } catch (e) {
        console.log("getAllUsers error:", e);
        return [];
    }
};


export const getUserById = async (id: number) => {
    try {
        const res = await fetch(`${BASE_URL}/${id}`, {
            credentials: "include",
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.message || res.statusText);
        }

        return await res.json();
    } catch (e) {
        console.log("getUserById error:", e);
    }
};


export const createUser = async (data: {
    email: string;
    password: string;
    name: string;
    surname: string;
    second_name?: string;
    phone_number: string;
    role: string;
    avatar?: File;
}): Promise<User | null> => {
    try {
        const formData = new FormData();

        formData.append("email", data.email);
        formData.append("password", data.password);
        formData.append("name", data.name);
        formData.append("surname", data.surname);
        formData.append("phone_number", data.phone_number);
        formData.append("role", data.role);

        if (data.second_name) {
            formData.append("second_name", data.second_name);
        }

        if (data.avatar) {
            formData.append("avatar_path", data.avatar);
        }

        const res = await fetch(BASE_URL, {
            method: "POST",
            credentials: "include",
            body: formData,
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.message || res.statusText);
        }

        return await res.json();
    } catch (e) {
        console.log("createUser error:", e);
        return null;
    }
};

export const updateUser = async (
    userId: string | number,
    data: {
        email?: string;
        password?: string;
        name?: string;
        surname?: string;
        second_name?: string;
        phone_number?: string;
        avatar?: File;
    }
): Promise<User | null> => {
    try {
        const formData = new FormData();

        if (data.email) formData.append("email", data.email);
        if (data.password) formData.append("password", data.password);
        if (data.name) formData.append("name", data.name);
        if (data.surname) formData.append("surname", data.surname);
        if (data.phone_number) formData.append("phone_number", data.phone_number);
        if (data.second_name) formData.append("second_name", data.second_name);
        if (data.avatar) formData.append("avatar_path", data.avatar);

        const res = await fetch(`${BASE_URL}/${userId}`, {
            method: "PATCH",
            credentials: "include",
            body: formData,
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.message || res.statusText);
        }

        return await res.json();
    } catch (e) {
        console.log("updateUser error:", e);
        return null;
    }
};


export const deleteUserById = async (id: number) => {
    try {
        const res = await fetch(`${BASE_URL}/${id}`, {
            method: "DELETE",
            credentials: "include",
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.message || res.statusText);
        }

        return await res.json();
    } catch (e) {
        console.log("deleteUserById error:", e);
    }
};