// src/components/shared/ProfileScreen/PurchaseHistory/lang.ts

export type Language = 'ru' | 'en' | 'zh';

export const purchaseHistoryTranslations = {
    ru: {
        title: 'История покупок',
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

export const getPurchaseHistoryTranslation = (
    lang: Language,
    path: string,
): string => {
    const keys = path.split('.');
    let result: any = purchaseHistoryTranslations[lang];

    for (const key of keys) {
        if (result && result[key] !== undefined) {
            result = result[key];
        } else {
            return path;
        }
    }

    return typeof result === 'string' ? result : path;
};

export const usePurchaseHistoryTranslation = (lang: Language) => {
    return {
        t: (path: string) => getPurchaseHistoryTranslation(lang, path),
        translations: purchaseHistoryTranslations[lang],
    };
};