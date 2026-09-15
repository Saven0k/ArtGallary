// src/pages/Register/lang.ts
export type Language = 'ru' | 'en' | 'zh';

export const registerPageTranslations = {
    ru: {
        registerPage: {
            tabs: {
                user: 'Пользователь',
                author: 'Автор'
            }
        }
    },
    en: {
        registerPage: {
            tabs: {
                user: 'User',
                author: 'Author'
            }
        }
    },
    zh: {
        registerPage: {
            tabs: {
                user: '用户',
                author: '作者'
            }
        }
    }
};

export const loginPageTranslations = {
    ru: {
        loginPage: {
            title: "Вход"
        }
    },
    en: {
        loginPage: {
            title: "Login"
        }
    },
    zh: {
        loginPage: {
            title: "登录"
        }
    }
};