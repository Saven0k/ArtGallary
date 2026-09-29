export interface ArtPreview {
    id: number;
    title: string;
    imagePath: string;
    authorName: string;
    price: number;
    currency: string;
    isOriginal: boolean;
}

export interface CartLine extends ArtPreview {
    quantity: number;
    total: number;
}

export type PromoCode = 'SALE10' | 'SALE15' | 'ART20';

export interface CartTotals {
    subtotal: number;
    discount: number;
    total: number;
    currency: string;
}