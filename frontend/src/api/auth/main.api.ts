import { BASE_URL_API, contentType } from "../main.api";
const BASE_URL = `${BASE_URL_API}/auth`;

export interface AuthResponse {
    user: {
        id: number,
        email: string,
        role: string
    }
}
export interface LoginData {
    email: string,
    password: string
}
export interface RegisterData {
    email: string,
    password: string,
    name: string,
    second_name: string,
    phone_number: string
}
export const login = async (userData: LoginData) => {
    try {
        const res = await fetch(`${BASE_URL}/login`, {
            method: "POST",
            headers: contentType,
            body: JSON.stringify(userData),
            credentials: 'include'
        })
        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.message || res.statusText);
        }

        const data = await res.json();
        return data;
    } catch (e) {
        console.log(e)
        return {
            success: false,
            message: e
        }
    }
}
export const register = async (userData: RegisterData): Promise<AuthResponse | null> => {
    try {
        const res = await fetch(`${BASE_URL}/register`, {
            method: "POST",
            headers: contentType,
            body: JSON.stringify(userData)
        })
        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.message || res.statusText);
        }

        const data = await res.json();
        return data;
    } catch (e) {
        console.log(e);
        return null;
    }
}
export const logout = async (): Promise<string | null> => {
    try {
        const res = await fetch(`${BASE_URL}/logout`, {
            method: "POST",
            credentials: "include",
            headers: contentType
        })

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.message || res.statusText);
        }

        const data = await res.json();
        return data;
    } catch (e) {
        console.log(e);
        return null
    }
}
export const me = async (): Promise<{ data?: any, status: number, success: boolean }> => {
    try {
        const res = await fetch(`${BASE_URL}/me`, {
            credentials: "include"
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
            return { status: res.status, data, success: false };
        }

        return { status: res.status, data, success: true };

    } catch (e) {
        return { status: 0, success: false };
    }
};
export const refresh = async () => {
    try {
        const res = await fetch(`${BASE_URL}/refresh`, {
            method: "POST",
            credentials: "include",
            headers: contentType
        })
        return res;
    } catch (e) {
        throw new Error("Ошибка");
    }
}