// src/pages/Authors/lang.ts
export type Language = 'ru' | 'en' | 'zh';

export const authorsTranslations = {
    ru: {
        page: {
            title: 'Авторы',
        },
        filter: {
            all: 'Все',
            title: 'Фильтр по профессии'
        },
        authorCard: {
            viewWorks: 'Смотреть работы',
            empty: 'Тут пока ничего нет'
        },
        authorList: {
            loading: 'Загрузка...',
            empty: 'Пусто',
            showMore: 'Показать ещё'
        }
    },
    en: {
        page: {
            title: 'Authors',
        },
        filter: {
            all: 'All',
            title: 'Filter by profession'
        },
        authorCard: {
            viewWorks: 'View works',
            empty: 'Nothing here yet'
        },
        authorList: {
            loading: 'Loading...',
            empty: 'Empty',
            showMore: 'Show more'
        }
    },
    zh: {
        page: {
            title: '作者',
        },
        filter: {
            all: '全部',
            title: '按职业筛选'
        },
        authorCard: {
            viewWorks: '查看作品',
            empty: '这里还没有内容'
        },
        authorList: {
            loading: '加载中...',
            empty: '空',
            showMore: '显示更多'
        }
    }
};

export const getTranslation = (lang: Language, path: string): string => {
    const keys = path.split('.');
    let result: any = authorsTranslations[lang];

    for (const key of keys) {
        if (result && result[key] !== undefined) {
            result = result[key];
        } else {
            return path;
        }
    }

    return typeof result === 'string' ? result : path;
};

export const useAuthorsTranslation = (lang: Language) => {
    return {
        t: (path: string) => getTranslation(lang, path),
        translations: authorsTranslations[lang]
    };
};