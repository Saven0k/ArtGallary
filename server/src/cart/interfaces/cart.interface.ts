// src/cart/interfaces/cart.interface.ts
export interface CartResponse {
    userId: number;
    artIds: number[];
    itemsCount: number;
}