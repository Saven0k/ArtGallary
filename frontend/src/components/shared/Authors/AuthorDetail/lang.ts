// src/pages/Author/lang.ts
export type Language = 'ru' | 'en' | 'zh';

export const authorTranslations = {
    ru: {
        header: {
            readMore: 'Читать дальше',
            collapse: 'Свернуть',
            subscribe: 'Подписаться',
            subscribed: 'Вы подписаны',
            profile: 'Профиль',
            allWorks: 'Все работы',

            // --- модалка "требуется авторизация" ---
            authRequiredTitle: 'Войдите, чтобы подписаться',
            authRequiredText:
                'Подписка на автора доступна только авторизованным пользователям. Войдите в аккаунт или зарегистрируйтесь.',
            authRequiredLogin: 'Войти',
            authRequiredCancel: 'Отмена',
        },
        profile: {
            followers: 'подписчиков',
            about: 'О авторе',
            system: 'Системная информация',
            noBio: 'Биография автора пока не заполнена',
            readMore: 'ЧИТАТЬ ПОЛНОСТЬЮ',
            collapse: 'Свернуть',
            moderationStatus: 'Статус модерации',
            moderationApproved: 'Пройдена',
            moderationPending: 'На модерации',
            memberSince: 'На сайте с',
            moderationDate: 'Дата модерации',
        },
    },
    en: {
        header: {
            readMore: 'Read more',
            collapse: 'Collapse',
            subscribe: 'Subscribe',
            subscribed: 'Subscribed',
            profile: 'Profile',
            allWorks: 'All works',

            authRequiredTitle: 'Sign in to subscribe',
            authRequiredText:
                'Subscriptions are available only to authorized users. Please sign in or create an account.',
            authRequiredLogin: 'Sign in',
            authRequiredCancel: 'Cancel',
        },
        profile: {
            followers: 'followers',
            about: 'About author',
            system: 'System information',
            noBio: "The author's biography has not been filled in yet",
            readMore: 'READ FULL',
            collapse: 'Collapse',
            moderationStatus: 'Moderation status',
            moderationApproved: 'Approved',
            moderationPending: 'Pending',
            memberSince: 'Member since',
            moderationDate: 'Moderation date',
        },
    },
    zh: {
        header: {
            readMore: '阅读更多',
            collapse: '收起',
            subscribe: '订阅',
            subscribed: '已订阅',
            profile: '个人资料',
            allWorks: '所有作品',

            authRequiredTitle: '登录后即可订阅',
            authRequiredText: '订阅仅对已登录用户开放。请登录或注册账号。',
            authRequiredLogin: '登录',
            authRequiredCancel: '取消',
        },
        profile: {
            followers: '位关注者',
            about: '关于作者',
            system: '系统信息',
            noBio: '作者传记尚未填写',
            readMore: '阅读全文',
            collapse: '收起',
            moderationStatus: '审核状态',
            moderationApproved: '已通过',
            moderationPending: '审核中',
            memberSince: '加入于',
            moderationDate: '审核日期',
        },
    },
};

export const getTranslation = (lang: Language, path: string): string => {
    const keys = path.split('.');
    let result: any = authorTranslations[lang];

    for (const key of keys) {
        if (result && result[key] !== undefined) {
            result = result[key];
        } else {
            return path;
        }
    }

    return typeof result === 'string' ? result : path;
};

export const useAuthorTranslation = (lang: Language) => {
    return {
        t: (path: string) => getTranslation(lang, path),
        translations: authorTranslations[lang],
    };
};