import type { DisplayPrice } from '../../../../api/arts/main.api';

export interface ArtPreview {
    id: number;
    title: string;
    imagePath: string;
    authorName: string;
    specifications?: string;
    price: number;
    currency: string;
    displayPrice?: DisplayPrice;
    isOriginal: boolean;
}

export interface CartLine extends ArtPreview {
    quantity: number;
    total: number;
}

export interface CartTotals {
    subtotal: number;
    discount: number;
    total: number;
    currency: string;
    displayPrice?: DisplayPrice;
}
