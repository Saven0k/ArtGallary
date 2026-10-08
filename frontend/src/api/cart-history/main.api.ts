import { apiFetch } from '../request';

import { BASE_URL_API } from "../main.api";

const BASE_URL = `${BASE_URL_API}/cart-history`;



export type OrderStatus = "delivered" | "in_transit" | "cancelled";

export interface OrderHistoryItem {
    id: number;
    userId: number;
    artIds: number[];
    status: OrderStatus;
    createdAt: string;
    items?: { artId: number; title: string; imagePath: string; price: number; quantity: number; currency: string; total: number }[];
    subtotal?: number;
    discount?: number;
    total?: number;
    currency?: string;
    promoCode?: string | null;
}

export interface OrderHistoryResponse {
    items: OrderHistoryItem[];
    total: number;
}

export interface HistoryFilter {
    status?: OrderStatus;
}



const request = async <T>(
    url: string,
    init?: RequestInit,
): Promise<T | null> => {
    try {
        const res = await apiFetch(url, { credentials: "include", ...init });
        if (!res.ok) {
            const message = await res.text().catch(() => "");
            throw new Error(`HTTP ${res.status} ${message}`);
        }
        return (await res.json()) as T;
    } catch (e) {
        console.error("cart-history api error:", e);
        return null;
    }
};

const buildQuery = (filter?: HistoryFilter): string => {
    if (!filter?.status) return "";
    return `?status=${filter.status}`;
};

const json = (body: unknown): RequestInit => ({
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
});



export const getCartHistory = (filter?: HistoryFilter) =>
    request<OrderHistoryResponse>(`${BASE_URL}${buildQuery(filter)}`);

export const checkoutCart = async (payload: { items: { artId: number; quantity: number }[]; promoCode?: string }): Promise<OrderHistoryItem> => {
    const res = await apiFetch(`${BASE_URL}/checkout`, json(payload));
    if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || 'Не удалось оформить заказ');
    }
    return res.json();
};

export const updateOrderStatus = (id: number, status: OrderStatus) =>
    request<OrderHistoryItem>(
        `${BASE_URL}/${id}/status`,
        { ...json({ status }), method: "PATCH" },
    );