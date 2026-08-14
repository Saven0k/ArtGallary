// src/api/auth/main.api.ts
import { BASE_URL_API, contentType } from "../main.api";
import type { UserRole } from "../users/main.api";

const BASE_URL = `${BASE_URL_API}/auth`;



export type Gender = 'M' | 'F';

export interface AuthResponse {
    user: {
        id: number;
        email: string;
        role: string;
    };
}

export interface LoginData {
    email: string;
    password: string;
}

export interface RegisterData {
    email: string;
    password: string;
    name: string;
    surname: string;
    second_name?: string;
    date_birthday: string;
    gender: Gender; 
}

export interface MeResponse {
    id: number;
    email: string;
    role: UserRole;
}

export const login = async (userData: LoginData): Promise<AuthResponse | null> => {
    try {
        const res = await fetch(`${BASE_URL}/login`, {
            method: "POST",
            headers: contentType,
            body: JSON.stringify(userData),
            credentials: 'include'
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.message || res.statusText);
        }

        return await res.json();
    } catch (e) {
        console.error("login error:", e);
        return null;
    }
};

export const register = async (userData: RegisterData): Promise<AuthResponse | null> => {
    try {
        const res = await fetch(`${BASE_URL}/register`, {
            method: "POST",
            headers: contentType,
            body: JSON.stringify(userData),
            credentials: 'include'
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.message || res.statusText);
        }

        return await res.json();
    } catch (e) {
        console.error("register error:", e);
        return null;
    }
};

export const logout = async (): Promise<{ message: string } | null> => {
    try {
        const res = await fetch(`${BASE_URL}/logout`, {
            method: "POST",
            credentials: "include",
            headers: contentType
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.message || res.statusText);
        }

        return await res.json();
    } catch (e) {
        console.error("logout error:", e);
        return null;
    }
};

export const me = async (): Promise<{ data?: MeResponse; status: number; success: boolean }> => {
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
        console.error("me error:", e);
        return { status: 0, success: false };
    }
};

export const refresh = async (): Promise<Response | null> => {
    try {
        const res = await fetch(`${BASE_URL}/refresh`, {
            method: "POST",
            credentials: "include",
            headers: contentType
        });
        return res;
    } catch (e) {
        console.error("refresh error:", e);
        return null;
    }
};