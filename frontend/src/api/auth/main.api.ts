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

export interface ChangePasswordPayload {
    currentPassword: string;
    newPassword: string;
}

export interface ChangePasswordResponse {
    message: string;
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
    date_birthday: string; // формат YYYY-MM-DD
    gender: Gender;
    country_id?: number;
    city_id?: number;
}

export interface MeResponse {
    id: number;
    email: string;
    role: UserRole;
}

export const changePassword = async (
    payload: ChangePasswordPayload,
): Promise<ChangePasswordResponse | null> => {
    try {
        const res = await fetch(`${BASE_URL_API}/auth/change-password`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!res.ok) {
            const data = await res.json().catch(() => null);
            const message =
                data?.message ||
                (res.status === 401
                    ? 'Неверный текущий пароль'
                    : res.status === 409
                        ? 'Новый пароль совпадает с текущим'
                        : 'Не удалось изменить пароль');
            throw new Error(message);
        }

        return (await res.json()) as ChangePasswordResponse;
    } catch (e) {
        console.error('changePassword error:', e);
        throw e;
    }
};

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

export interface RequestCodePayload { email: string; }
export interface VerifyCodePayload { email: string; code: string; }

export const requestResetCode = async (payload: RequestCodePayload) => {
    const res = await fetch(`${BASE_URL}/password-reset/request-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Не удалось отправить код');
    return await res.json();
};

export const verifyResetCode = async (payload: VerifyCodePayload) => {
    const res = await fetch(`${BASE_URL}/password-reset/verify-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || 'Неверный код');
    }
    return await res.json();
};