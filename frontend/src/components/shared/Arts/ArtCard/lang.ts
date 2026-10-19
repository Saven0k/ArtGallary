import { translatedValue } from '../../../../utils/translations';

export type Language = 'ru' | 'en' | 'zh';

export const artCardTranslations = {
    ru: {
        likeError: 'Не удалось изменить избранное',
        cartError: 'Не удалось добавить работу в корзину',
        like: 'Нравится',
        addToCart: 'Добавить в корзину',
        priceOnRequest: 'Цена по запросу',
        noSpecs: 'Характеристики не указаны'
    },
    en: {
        likeError: 'Could not update favorites',
        cartError: 'Could not add the artwork to your cart',
        like: 'Like',
        addToCart: 'Add to cart',
        priceOnRequest: 'Price on request',
        noSpecs: 'No specifications provided'
    },
    zh: {
        likeError: '无法更新收藏',
        cartError: '无法将作品加入购物车',
        like: '喜欢',
        addToCart: '加入购物车',
        priceOnRequest: '价格请咨询',
        noSpecs: '未提供规格'
    }
};

export const getTranslation = (lang: Language, path: string): string => {
    return translatedValue(artCardTranslations[lang], path);
};

export const useArtCardTranslation = (lang: Language) => {
    return {
        t: (path: string) => getTranslation(lang, path),
        translations: artCardTranslations[lang]
    };
};
