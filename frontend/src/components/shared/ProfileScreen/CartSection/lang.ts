import { translatedValue } from '../../../../utils/translations';
import type { Language } from '../../../../context/LanguageContext';

export interface CartTranslations {
    title: string;
    clear: string;
    loading: string;
    empty: string;
    emptyAction: string;
    retry: string;

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
        failed: string;
    };

    totals: {
        subtotal: string;
        discount: string;
        total: string;
        withoutDelivery: string;
        originalCurrency: string;
    };

    checkout: string;

    errors: {
        loadFailed: string;
        removeFailed: string;
        clearFailed: string;
        mixedCurrencies: string;
        checkoutFailed: string;
    };
}

export const cartTranslations: Record<Language, CartTranslations> = {
    ru: {
        title: 'Корзина',
        clear: 'Очистить',
        loading: 'Загрузка…',
        empty: 'В корзине пока пусто',
        emptyAction: 'Перейти к покупкам',
        retry: 'Повторить',
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
            failed: 'Не удалось проверить промокод. Попробуйте ещё раз.',
        },
        totals: {
            subtotal: 'Товары',
            discount: 'Скидка',
            total: 'Итог',
            withoutDelivery: 'Без учёта доставки',
            originalCurrency: 'Пересчёт приблизительный. Заказ оформляется в валюте автора: {price}',
        },
        checkout: 'Оформить заказ',
        errors: {
            loadFailed: 'Не удалось загрузить корзину',
            checkoutFailed: 'Не удалось оформить заказ',
            removeFailed: 'Не удалось удалить позицию',
            clearFailed: 'Не удалось очистить корзину',
            mixedCurrencies: 'Работы в разных валютах нужно оформить отдельно',
        },
    },
    en: {
        title: 'Cart',
        clear: 'Clear',
        loading: 'Loading…',
        empty: 'Your cart is empty',
        emptyAction: 'Browse artworks',
        retry: 'Try again',
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
            failed: 'Could not check the promo code. Please try again.',
        },
        totals: {
            subtotal: 'Items',
            discount: 'Discount',
            total: 'Total',
            withoutDelivery: 'Delivery not included',
            originalCurrency: 'Converted prices are approximate. The order uses the artist’s currency: {price}',
        },
        checkout: 'Checkout',
        errors: {
            loadFailed: 'Failed to load cart',
            checkoutFailed: 'Could not place the order',
            removeFailed: 'Failed to remove item',
            clearFailed: 'Failed to clear cart',
            mixedCurrencies: 'Please order artworks in different currencies separately',
        },
    },
    zh: {
        title: '购物车',
        clear: '清空',
        loading: '加载中…',
        empty: '购物车为空',
        emptyAction: '去逛逛',
        retry: '重试',
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
            failed: '无法验证优惠码，请重试。',
        },
        totals: {
            subtotal: '商品',
            discount: '折扣',
            total: '合计',
            withoutDelivery: '不含运费',
            originalCurrency: '换算价格仅供参考。订单使用艺术家设定的货币：{price}',
        },
        checkout: '去结算',
        errors: {
            loadFailed: '加载购物车失败',
            checkoutFailed: '无法提交订单',
            removeFailed: '删除商品失败',
            clearFailed: '清空购物车失败',
            mixedCurrencies: '不同货币的作品请分开结算',
        },
    },
};

export const getCartTranslation = (lang: Language, path: string): string => {
    return translatedValue(cartTranslations[lang], path);
};

export const useCartTranslation = (lang: Language) => {
    return {
        t: (path: string) => getCartTranslation(lang, path),
        translations: cartTranslations[lang],
    };
};
