// src/components/layout/Header/lang.ts
export type Language = 'ru' | 'en' | 'zh';

export const headerTranslations = {
    ru: {
        logoTitle: "Tilinin`s Gallary",
        logoSubtitle: "галерея художников",
        search: "Поиск",
        likes: "Избранное",
        cart: "Корзина",
        profileBtn: "Открыть меню профиля",
        nav: {
            gallery: "Галерея",
            authors: "Авторы",
            about: "О нас",
            services: "Услуги",
            contacts: "Контакты"
        },
        menu: {
            open: "Открыть меню",
            close: "Закрыть меню"
        }
    },
    en: {
        logoTitle: "Tilinin`s Gallary",
        logoSubtitle: "artists gallery",
        search: "Search",
        likes: "Likes",
        cart: "Cart",
        profileBtn: "Open profile menu",
        nav: {
            gallery: "Gallery",
            authors: "Authors",
            about: "About us",
            services: "Services",
            contacts: "Contacts"
        },
        menu: {
            open: "Open menu",
            close: "Close menu"
        }
    },
    zh: {
        logoTitle: "Tilinin`s Gallary",
        logoSubtitle: "艺术家画廊",
        search: "搜索",
        likes: "收藏",
        cart: "购物车",
        profileBtn: "打开个人资料菜单",
        nav: {
            gallery: "画廊",
            authors: "作者",
            about: "关于我们",
            services: "服务",
            contacts: "联系方式"
        },
        menu: {
            open: "打开菜单",
            close: "关闭菜单"
        }
    }
};

// Вспомогательные функции для работы с переводами
export const getTranslation = (lang: Language, path: string): string => {
    const keys = path.split('.');
    let result: any = headerTranslations[lang];

    for (const key of keys) {
        if (result && result[key] !== undefined) {
            result = result[key];
        } else {
            return path;
        }
    }

    return typeof result === 'string' ? result : path;
};

export const useHeaderTranslation = (lang: Language) => {
    return {
        t: (path: string) => getTranslation(lang, path),
        translations: headerTranslations[lang]
    };
};