import { useCallback } from 'react';
import { translatedValue } from '../../../../utils/translations';

export type Language = 'ru' | 'en' | 'zh';

export const purchaseHistoryTranslations = {
    ru: {
        title: 'История покупок',
        filter: 'Статус заказа',
        unknownArtwork: 'Работа недоступна',
        unknownPrice: 'Цена не сохранена',
        quantity: 'Количество: {count}',
        orderTotal: 'Итого по заказу со скидкой',
        tabs: {
            all: 'Все',
            delivered: 'Доставленные',
            inTransit: 'В пути',
            cancelled: 'Отменённые',
        },
        statuses: {
            delivered: 'Доставлено',
            in_transit: 'В пути',
            cancelled: 'Отменено',
        },
        loading: 'Загрузка…',
        empty: 'Покупок пока нет',
        error: 'Не удалось загрузить историю',
        retry: 'Повторить',
        noImage: 'Нет изображения',
        unknownAuthor: 'Неизвестный автор',
    },

    en: {
        title: 'Purchase history',
        filter: 'Order status',
        unknownArtwork: 'Artwork unavailable',
        unknownPrice: 'Price not recorded',
        quantity: 'Quantity: {count}',
        orderTotal: 'Order total after discount',
        tabs: {
            all: 'All',
            delivered: 'Delivered',
            inTransit: 'In transit',
            cancelled: 'Cancelled',
        },
        statuses: {
            delivered: 'Delivered',
            in_transit: 'In transit',
            cancelled: 'Cancelled',
        },
        loading: 'Loading…',
        empty: 'No purchases yet',
        error: 'Failed to load history',
        retry: 'Retry',
        noImage: 'No image',
        unknownAuthor: 'Unknown author',
    },

    zh: {
        title: '购买记录',
        filter: '订单状态',
        unknownArtwork: '作品不可用',
        unknownPrice: '未记录价格',
        quantity: '数量：{count}',
        orderTotal: '折扣后订单总额',
        tabs: {
            all: '全部',
            delivered: '已送达',
            inTransit: '运输中',
            cancelled: '已取消',
        },
        statuses: {
            delivered: '已送达',
            in_transit: '运输中',
            cancelled: '已取消',
        },
        loading: '加载中…',
        empty: '暂无购买记录',
        error: '加载失败',
        retry: '重试',
        noImage: '暂无图片',
        unknownAuthor: '未知作者',
    },
};

export const getPurchaseHistoryTranslation = (lang: Language, path: string): string => {
    return translatedValue(purchaseHistoryTranslations[lang], path);
};

export const usePurchaseHistoryTranslation = (lang: Language) => {
    return {
        t: useCallback((path: string) => getPurchaseHistoryTranslation(lang, path), [lang]),
        translations: purchaseHistoryTranslations[lang],
    };
};
