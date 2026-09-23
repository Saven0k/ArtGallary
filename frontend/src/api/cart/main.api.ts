// src/api/cart/main.api.ts
import { BASE_URL_API } from "../main.api";

const BASE_URL = `${BASE_URL_API}/cart`;

// -------------------- types --------------------

export interface CartData {
    userId: number;
    artIds: number[];
    itemsCount: number;
}

// -------------------- helpers --------------------

const request = async <T>(
    url: string,
    init?: RequestInit,
): Promise<T | null> => {
    try {
        const res = await fetch(url, { credentials: "include", ...init });
        if (!res.ok) {
            const message = await res.text().catch(() => "");
            throw new Error(`HTTP ${res.status} ${message}`);
        }
        return (await res.json()) as T;
    } catch (e) {
        console.error("cart api error:", e);
        return null;
    }
};

const json = (body: unknown): RequestInit => ({
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
});

// -------------------- endpoints --------------------

export const getCart = () => request<CartData>(`${BASE_URL}`);

export const addToCart = (artId: number) =>
    request<CartData>(`${BASE_URL}/items`, json({ artId }));

export const removeFromCart = (artId: number) =>
    request<CartData>(`${BASE_URL}/items/${artId}`, { method: "DELETE" });

export const clearCart = () =>
    request<CartData>(`${BASE_URL}`, { method: "DELETE" });