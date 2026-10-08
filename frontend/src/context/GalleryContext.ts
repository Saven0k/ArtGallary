import { createContext } from 'react';

export const GalleryContext = createContext<{
    cartItems: number[];
    likedArts: number[];
    likedAuthors: number[];
    loading: boolean;
    reload: () => Promise<void>;
    addToCart: (id: number) => Promise<boolean>;
    removeFromCart: (id: number) => Promise<boolean>;
    clearCart: () => Promise<boolean>;
    toggleLikeArt: (id: number) => Promise<boolean>;
    toggleLikeAuthor: (id: number) => Promise<boolean>;
} | null>(null);
