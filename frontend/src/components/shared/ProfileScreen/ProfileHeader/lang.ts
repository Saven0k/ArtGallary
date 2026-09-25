// src/components/shared/ProfileScreen/ProfileHeader/lang.ts

export type Language = 'ru' | 'en' | 'zh';

export interface ProfileHeaderTranslations {
    roleUser: string;
}

export const profileHeaderTranslations: Record<Language, ProfileHeaderTranslations> = {
    ru: { roleUser: 'Пользователь' },
    en: { roleUser: 'User' },
    zh: { roleUser: '用户' },
};

/** Подписи планов подписки. Ключи — значения SubscriptionPlan с бэка. */
export const planLabels: Record<Language, Record<string, string>> = {
    ru: {
        free: 'Бесплатный',
        pro: 'Профессиональный',
        vip: 'VIP',
    },
    en: {
        free: 'Free',
        pro: 'Pro',
        vip: 'VIP',
    },
    zh: {
        free: '免费',
        pro: '专业版',
        vip: 'VIP',
    },
};

/** Профессии автора. Ключ — название профессии на русском (как в БД). */
export const professionTranslations: Record<Language, Record<string, string>> = {
    ru: {
        'Художник': 'Художник',
        'Скульптор': 'Скульптор',
        'Фотограф': 'Фотограф',
        'Графический дизайнер': 'Графический дизайнер',
        'Иллюстратор': 'Иллюстратор',
        'Архитектор': 'Архитектор',
        'Музыкант': 'Музыкант',
        'Танцор': 'Танцор',
        'Актер': 'Актер',
        'Режиссер': 'Режиссер',
        'Кинооператор': 'Кинооператор',
        'Художник по костюмам': 'Художник по костюмам',
    },
    en: {
        'Художник': 'Painter',
        'Скульптор': 'Sculptor',
        'Фотограф': 'Photographer',
        'Графический дизайнер': 'Graphic Designer',
        'Иллюстратор': 'Illustrator',
        'Архитектор': 'Architect',
        'Музыкант': 'Musician',
        'Танцор': 'Dancer',
        'Актер': 'Actor',
        'Режиссер': 'Director',
        'Кинооператор': 'Cinematographer',
        'Художник по костюмам': 'Costume Designer',
    },
    zh: {
        'Художник': '画家',
        'Скульптор': '雕塑家',
        'Фотограф': '摄影师',
        'Графический дизайнер': '平面设计师',
        'Иллюстратор': '插画师',
        'Архитектор': '建筑师',
        'Музыкант': '音乐家',
        'Танцор': '舞者',
        'Актер': '演员',
        'Режиссер': '导演',
        'Кинооператор': '电影摄影师',
        'Художник по костюмам': '服装设计师',
    },
};

export const useProfileHeaderTranslation = (lang: Language) => {
    return {
        t: profileHeaderTranslations[lang],
        professions: professionTranslations[lang],
        plans: planLabels[lang],
    };
};

/** Возвращает локализованное название профессии по русскому ключу. */
export const getProfessionLabel = (lang: Language, professionName: string): string => {
    const dict = professionTranslations[lang];
    return dict[professionName] ?? professionName;
};

/** Возвращает локализованное название плана по ключу 'free' | 'pro' | 'vip'. */
export const getPlanLabel = (lang: Language, planKey: string): string => {
    const dict = planLabels[lang];
    return dict[planKey] ?? planKey;
};