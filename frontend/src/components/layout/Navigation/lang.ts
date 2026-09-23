// src/components/Navigation/lang.ts
export type Language = 'ru' | 'en' | 'zh';

export const navigationTranslations = {
    ru: {
        navigation: {
            back: "Назад",
            backArrow: "Стрелка назад",
            home: "Главная",
            arts: "Арты",
            authors: "Авторы",
            services: "Услуги",
            contacts: "Контакты",
            about: "О нас",
            gallery: "Галерея",
            profile: "Профиль",
            cart: "Корзина",
            likes: "Избранное",
            search: "Поиск",
            register: "Регистрация",
            login: "Вход"
        }
    },
    en: {
        navigation: {
            back: "Back",
            backArrow: "Back arrow",
            home: "Home",
            arts: "Arts",
            authors: "Authors",
            services: "Services",
            contacts: "Contacts",
            about: "About us",
            gallery: "Gallery",
            profile: "Profile",
            cart: "Cart",
            likes: "Likes",
            search: "Search",
            register: "Register",
            login: "Login"
        }
    },
    zh: {
        navigation: {
            back: "返回",
            backArrow: "返回箭头",
            home: "主页",
            arts: "艺术作品",
            authors: "作者",
            services: "服务",
            contacts: "联系方式",
            about: "关于我们",
            gallery: "画廊",
            profile: "个人资料",
            cart: "购物车",
            likes: "收藏",
            search: "搜索",
            register: "注册",
            login: "登录"
        }
    }
};