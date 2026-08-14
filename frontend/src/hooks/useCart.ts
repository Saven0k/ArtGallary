import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

const CART_KEY = 'cart_items';

export const useCart = () => {
    const { isAuthenticated } = useAuth();
    const [cartItems, setCartItems] = useState<number[]>([]);

    useEffect(() => {
        if (!isAuthenticated) {
            const stored = localStorage.getItem(CART_KEY);
            if (stored) {
                try {
                    setCartItems(JSON.parse(stored));
                } catch {
                    setCartItems([]);
                }
            }
        }
    }, [isAuthenticated]);

    const addToCart = (artId: number) => {
        if (isAuthenticated) {
            // TODO: API запрос на добавление в корзину на сервере
            console.log("Authenticated - add to cart API:", artId);
            // Здесь будет запрос на сервер
            return;
        }

        // Не авторизован - сохраняем в localStorage
        const updated = [...cartItems, artId];
        setCartItems(updated);
        localStorage.setItem(CART_KEY, JSON.stringify(updated));
        console.log("Added to cart (local):", artId);
    };

    const removeFromCart = (artId: number) => {
        if (isAuthenticated) {
            // TODO: API запрос на удаление из корзины на сервере
            console.log("Authenticated - remove from cart API:", artId);
            return;
        }

        const updated = cartItems.filter(id => id !== artId);
        setCartItems(updated);
        localStorage.setItem(CART_KEY, JSON.stringify(updated));
        console.log("Removed from cart (local):", artId);
    };

    const isInCart = (artId: number): boolean => {
        return cartItems.includes(artId);
    };

    const getCartCount = (): number => {
        return cartItems.length;
    };

    const clearCart = () => {
        if (isAuthenticated) {
            // TODO: API запрос на очистку корзины на сервере
            console.log("Authenticated - clear cart API");
            return;
        }
        setCartItems([]);
        localStorage.removeItem(CART_KEY);
    };

    return {
        cartItems,
        addToCart,
        removeFromCart,
        isInCart,
        getCartCount,
        clearCart,
    };
};