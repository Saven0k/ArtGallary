import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getCart, addToCart, removeFromCart, clearCart, type CartData } from '../api/cart/main.api';
import { getLikedArts, likeArt } from '../api/arts/main.api';
import { GalleryContext } from './GalleryContext';

const readIds = (key: string): number[] => {
    try {
        const value: unknown = JSON.parse(localStorage.getItem(key) ?? '[]');
        return Array.isArray(value) ? [...new Set(value.filter((id): id is number => Number.isSafeInteger(id) && id > 0))] : [];
    } catch { return []; }
};

export const GalleryProvider = ({ children }: { children: ReactNode }) => {
    const { user, isLoading: authLoading } = useAuth();
    const userId = user?.id;
    const [cartItems, setCartItems] = useState<number[]>([]);
    const [likedArts, setLikedArts] = useState<number[]>([]);
    const [likedAuthors, setLikedAuthors] = useState<number[]>([]);
    const [loading, setLoading] = useState(true);
    const activeUser = useRef(userId);
    const operations = useRef(new Set<string>());
    const reloading = useRef<{ userId: number; promise: Promise<void> } | null>(null);
    activeUser.current = userId;

    const reload = useCallback(async () => {
        if (authLoading) return;
        setLoading(true);
        if (!userId) {
            setCartItems(readIds('cart_items'));
            setLikedArts(readIds('liked_arts'));
            setLikedAuthors(readIds('liked_authors'));
            setLoading(false);
            return;
        }
        if (reloading.current?.userId === userId) return reloading.current.promise;
        const promise = (async () => {
        const [initialCart, firstPage] = await Promise.all([getCart(), getLikedArts(1, 100)]);
        let cart = initialCart;
        const liked = firstPage?.arts.map((art) => art.id) ?? [];
        let page = firstPage;
        let pageNumber = 1;
        while (page?.pagination.hasNextPage) {
            page = await getLikedArts(++pageNumber, 100);
            if (!page) break;
            liked.push(...page.arts.map((art) => art.id));
        }
        if (activeUser.current !== userId) return;
        if (cart) {
            let mergedCart = cart;
            for (const id of readIds('cart_items')) {
                if (activeUser.current !== userId) return;
                const next: CartData | null = mergedCart.artIds.includes(id) ? mergedCart : await addToCart(id);
                if (next) {
                    mergedCart = next;
                    localStorage.setItem('cart_items', JSON.stringify(readIds('cart_items').filter((item) => item !== id)));
                }
            }
            cart = mergedCart;
        }
        if (firstPage) {
            for (const id of readIds('liked_arts')) {
                if (activeUser.current !== userId) return;
                if (liked.includes(id) || (await likeArt(id))?.success) {
                    if (!liked.includes(id)) liked.push(id);
                    localStorage.setItem('liked_arts', JSON.stringify(readIds('liked_arts').filter((item) => item !== id)));
                }
            }
        }
        if (activeUser.current !== userId) return;
        setCartItems(cart?.artIds ?? []);
        setLikedArts(liked);
        setLikedAuthors([]);
        setLoading(false);
        })().finally(() => { if (reloading.current?.promise === promise) reloading.current = null; });
        reloading.current = { userId, promise };
        return promise;
    }, [authLoading, userId]);

    useEffect(() => {
        setCartItems([]);
        setLikedArts([]);
        void reload();
        const onStorage = () => { if (!userId) void reload(); };
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, [reload, userId]);

    const mutateCart = async (operation: 'add' | 'remove' | 'clear', id = 0) => {
        if (loading || operations.current.has('cart')) return false;
        operations.current.add('cart');
        try {
            if (userId) {
                const result = await (operation === 'add' ? addToCart(id) : operation === 'remove' ? removeFromCart(id) : clearCart());
                if (!result || activeUser.current !== userId) return false;
                setCartItems(result.artIds);
            } else {
                const stored = readIds('cart_items');
                const next = operation === 'clear' ? [] : operation === 'remove' ? stored.filter((item) => item !== id) : [...new Set([...stored, id])];
                localStorage.setItem('cart_items', JSON.stringify(next));
                setCartItems(next);
            }
            return true;
        } finally { operations.current.delete('cart'); }
    };

    const toggleLikeArt = async (id: number) => {
        const key = `like:${id}`;
        if (loading || operations.current.has(key)) return false;
        operations.current.add(key);
        try {
            if (userId) {
                const result = await likeArt(id);
                if (!result?.success || activeUser.current !== userId) return false;
                setLikedArts((prev) => prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]);
            } else {
                const stored = readIds('liked_arts');
                const next = stored.includes(id) ? stored.filter((item) => item !== id) : [...stored, id];
                localStorage.setItem('liked_arts', JSON.stringify(next));
                setLikedArts(next);
            }
            return true;
        } finally { operations.current.delete(key); }
    };

    const toggleLikeAuthor = async (id: number) => {
        if (userId) return false;
        const stored = readIds('liked_authors');
        const next = stored.includes(id) ? stored.filter((item) => item !== id) : [...stored, id];
        localStorage.setItem('liked_authors', JSON.stringify(next));
        setLikedAuthors(next);
        return true;
    };

    return <GalleryContext.Provider value={{ cartItems, likedArts, likedAuthors, loading, reload, addToCart: (id) => mutateCart('add', id), removeFromCart: (id) => mutateCart('remove', id), clearCart: () => mutateCart('clear'), toggleLikeArt, toggleLikeAuthor }}>{children}</GalleryContext.Provider>;
};
