// src/components/ArtCard/lang.ts
export type Language = 'ru' | 'en' | 'zh';

export const artCardTranslations = {
    ru: {
        like: 'Нравится',
        addToCart: 'Добавить в корзину',
        priceOnRequest: 'Цена по запросу',
        noSpecs: 'Характеристики не указаны'
    },
    en: {
        like: 'Like',
        addToCart: 'Add to cart',
        priceOnRequest: 'Price on request',
        noSpecs: 'No specifications provided'
    },
    zh: {
        like: '喜欢',
        addToCart: '加入购物车',
        priceOnRequest: '价格请咨询',
        noSpecs: '未提供规格'
    }
};

export const getTranslation = (lang: Language, path: string): string => {
    const keys = path.split('.');
    let result: any = artCardTranslations[lang];

    for (const key of keys) {
        if (result && result[key] !== undefined) {
            result = result[key];
        } else {
            return path;
        }
    }

    return typeof result === 'string' ? result : path;
};

export const useArtCardTranslation = (lang: Language) => {
    return {
        t: (path: string) => getTranslation(lang, path),
        translations: artCardTranslations[lang]
    };
};