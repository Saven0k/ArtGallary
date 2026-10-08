import { useContext } from 'react';
import { GalleryContext } from '../context/GalleryContext';

export const useCart = () => {
    const context = useContext(GalleryContext);
    if (!context) throw new Error('GalleryProvider is required');
    return {
        cartItems: context.cartItems,
        loading: context.loading,
        reload: context.reload,
        addToCart: context.addToCart,
        removeFromCart: context.removeFromCart,
        clearCart: context.clearCart,
        isInCart: (id: number) => context.cartItems.includes(id),
        getCartCount: () => context.cartItems.length,
    };
};
