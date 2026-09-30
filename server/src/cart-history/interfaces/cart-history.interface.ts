
import { OrderStatus } from "../cart-history.model";

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