// src/pages/Profile/components/ProfileContent/AdminSiteStats/lang.ts

import type { Language } from '../../../../lang';

export interface AdminSiteStatsTranslations {
    title: string;
    subtitle: string;
    loading: string;
    error: string;
    total: string;
    today: string;
    week: string;
    unique: string;
    rating: string;
    topPaths: string;
}

export const adminSiteStatsTranslations: Record<Language, AdminSiteStatsTranslations> = {
    ru: {
        title: 'Статистика сайта',
        subtitle: 'Общая активность пользователей',
        loading: 'Загрузка…',
        error: 'Не удалось загрузить статистику',
        total: 'Всего посещений',
        today: 'За сегодня',
        week: 'За 7 дней',
        unique: 'Уникальных пользователей',
        rating: 'Средняя оценка',
        topPaths: 'Топ страниц',
    },
    en: {
        title: 'Site statistics',
        subtitle: 'Overall user activity',
        loading: 'Loading…',
        error: 'Failed to load statistics',
        total: 'Total visits',
        today: 'Today',
        week: 'Last 7 days',
        unique: 'Unique users',
        rating: 'Average rating',
        topPaths: 'Top pages',
    },
    zh: {
        title: '网站统计',
        subtitle: '用户总体活动',
        loading: '加载中…',
        error: '加载失败',
        total: '总访问量',
        today: '今日',
        week: '最近 7 天',
        unique: '独立用户',
        rating: '平均评分',
        topPaths: '热门页面',
    },
};

export const getAdminSiteStatsTranslation = (
    lang: Language,
    path: string,
): string => {
    const keys = path.split('.');
    let result: any = adminSiteStatsTranslations[lang];

    for (const key of keys) {
        if (result && result[key] !== undefined) {
            result = result[key];
        } else {
            return path;
        }
    }

    return typeof result === 'string' ? result : path;
};

export const useAdminSiteStatsTranslation = (lang: Language) => {
    return {
        t: (path: string) => getAdminSiteStatsTranslation(lang, path),
        translations: adminSiteStatsTranslations[lang],
    };
};