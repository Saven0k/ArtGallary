import type { Language } from '../../../../context/LanguageContext';

export interface CartTranslations {
    title: string;
    clear: string;
    loading: string;
    empty: string;
    emptyAction: string;

    item: {
        original: string;
        poster: string;
        remove: string;
        minus: string;
        plus: string;
        unknownAuthor: string;
    };

    promo: {
        placeholder: string;
        apply: string;
        applied: string;
        remove: string;
        invalid: string;
    };

    totals: {
        subtotal: string;
        discount: string;
        total: string;
        withoutDelivery: string;
    };

    checkout: string;

    errors: {
        loadFailed: string;
        removeFailed: string;
        clearFailed: string;
    };
}

export const cartTranslations: Record<Language, CartTranslations> = {
    ru: {
        title: 'Корзина',
        clear: 'Очистить',
        loading: 'Загрузка…',
        empty: 'В корзине пока пусто',
        emptyAction: 'Перейти к покупкам',
        item: {
            original: 'Оригинал',
            poster: 'Постер',
            remove: 'Удалить',
            minus: 'Уменьшить',
            plus: 'Увеличить',
            unknownAuthor: 'Неизвестный автор',
        },
        promo: {
            placeholder: 'Промокод',
            apply: 'Применить',
            applied: 'Применён',
            remove: 'Убрать промокод',
            invalid: 'Промокод недействителен',
        },
        totals: {
            subtotal: 'Товары',
            discount: 'Скидка',
            total: 'Итог',
            withoutDelivery: 'Без учёта доставки',
        },
        checkout: 'Оформить заказ',
        errors: {
            loadFailed: 'Не удалось загрузить корзину',
            removeFailed: 'Не удалось удалить позицию',
            clearFailed: 'Не удалось очистить корзину',
        },
    },
    en: {
        title: 'Cart',
        clear: 'Clear',
        loading: 'Loading…',
        empty: 'Your cart is empty',
        emptyAction: 'Browse artworks',
        item: {
            original: 'Original',
            poster: 'Poster',
            remove: 'Remove',
            minus: 'Decrease',
            plus: 'Increase',
            unknownAuthor: 'Unknown author',
        },
        promo: {
            placeholder: 'Promo code',
            apply: 'Apply',
            applied: 'Applied',
            remove: 'Remove promo code',
            invalid: 'Invalid promo code',
        },
        totals: {
            subtotal: 'Items',
            discount: 'Discount',
            total: 'Total',
            withoutDelivery: 'Delivery not included',
        },
        checkout: 'Checkout',
        errors: {
            loadFailed: 'Failed to load cart',
            removeFailed: 'Failed to remove item',
            clearFailed: 'Failed to clear cart',
        },
    },
    zh: {
        title: '购物车',
        clear: '清空',
        loading: '加载中…',
        empty: '购物车为空',
        emptyAction: '去逛逛',
        item: {
            original: '原作',
            poster: '海报',
            remove: '删除',
            minus: '减少',
            plus: '增加',
            unknownAuthor: '未知作者',
        },
        promo: {
            placeholder: '优惠码',
            apply: '应用',
            applied: '已应用',
            remove: '移除优惠码',
            invalid: '优惠码无效',
        },
        totals: {
            subtotal: '商品',
            discount: '折扣',
            total: '合计',
            withoutDelivery: '不含运费',
        },
        checkout: '去结算',
        errors: {
            loadFailed: '加载购物车失败',
            removeFailed: '删除商品失败',
            clearFailed: '清空购物车失败',
        },
    },
};

export const getCartTranslation = (
    lang: Language,
    path: string,
): string => {
    const keys = path.split('.');
    let result: any = cartTranslations[lang];

    for (const key of keys) {
        if (result && result[key] !== undefined) {
            result = result[key];
        } else {
            return path;
        }
    }

    return typeof result === 'string' ? result : path;
};

export const useCartTranslation = (lang: Language) => {
    return {
        t: (path: string) => getCartTranslation(lang, path),
        translations: cartTranslations[lang],
    };
};