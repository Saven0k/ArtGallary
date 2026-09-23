import type { Language } from "../lang";

export interface RateAppTranslations {
    title: string;
    subtitle: string;
}

export const rateAppTranslations: Record<Language, RateAppTranslations> = {
    ru: {
        title: 'Оцените приложение',
        subtitle: 'Оцените сайт и оставьте отзыв, помогите нам стать лучше',
    },
    en: {
        title: 'Rate the app',
        subtitle: 'Rate the site and leave a review to help us improve',
    },
    zh: {
        title: '评价应用',
        subtitle: '为网站评分并留下评价，帮助我们做得更好',
    },
};

export const getRateAppTranslation = (
    lang: Language,
    path: string,
): string => {
    const keys = path.split('.');
    let result: any = rateAppTranslations[lang];

    for (const key of keys) {
        if (result && result[key] !== undefined) {
            result = result[key];
        } else {
            return path;
        }
    }

    return typeof result === 'string' ? result : path;
};

export const useRateAppTranslation = (lang: Language) => {
    return {
        t: (path: string) => getRateAppTranslation(lang, path),
        translations: rateAppTranslations[lang],
    };
};