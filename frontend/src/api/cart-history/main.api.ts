
import { BASE_URL_API } from "../main.api";

const BASE_URL = `${BASE_URL_API}/cart-history`;



export type OrderStatus = "delivered" | "in_transit" | "cancelled";

export interface OrderHistoryItem {
    id: number;
    userId: number;
    artIds: number[];
    status: OrderStatus;
    createdAt: string;
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
        const res = await fetch(url, { credentials: "include", ...init });
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

export const checkoutCart = () =>
    request<OrderHistoryItem>(`${BASE_URL}/checkout`, { method: "POST" });

export const updateOrderStatus = (id: number, status: OrderStatus) =>
    request<OrderHistoryItem>(
        `${BASE_URL}/${id}/status`,
        { ...json({ status }), method: "PATCH" },
    );