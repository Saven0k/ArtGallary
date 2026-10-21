
import type { Language } from '../../../../../context/LanguageContext';

export interface RatingsTranslations {
    title: string;
    subtitle: string;

    summary: {
        average: string;
        total: string;
        uniqueUsers: string;
        totalVisits: string;
        todayVisits: string;
        weekVisits: string;
        monthVisits: string;
    };

    empty: string;

    errors: {
        loadFailed: string;
    };
}

export const ratingsTranslations: Record<Language, RatingsTranslations> = {
    ru: {
        title: 'Посещения и оценки',
        subtitle: 'Просмотры страниц и оценки сайта',
        summary: {
            average: 'Средняя оценка',
            total: 'Всего оценок',
            uniqueUsers: 'Авторизованных посетителей',
            totalVisits: 'Всего просмотров страниц',
            todayVisits: 'Просмотров сегодня',
            weekVisits: 'Просмотров за 7 дней',
            monthVisits: 'Просмотров за 30 дней',
        },
        empty: 'Пока нет оценок',
        errors: {
            loadFailed: 'Не удалось загрузить статистику',
        },
    },
    en: {
        title: 'Visits and ratings',
        subtitle: 'Page views and site ratings',
        summary: {
            average: 'Average rating',
            total: 'Total ratings',
            uniqueUsers: 'Signed-in visitors',
            totalVisits: 'Total page views',
            todayVisits: 'Page views today',
            weekVisits: 'Page views over 7 days',
            monthVisits: 'Page views over 30 days',
        },
        empty: 'No ratings yet',
        errors: {
            loadFailed: 'Failed to load statistics',
        },
    },
    zh: {
        title: '访问与评分',
        subtitle: '页面浏览量与网站评分',
        summary: {
            average: '平均评分',
            total: '评分总数',
            uniqueUsers: '已登录访客数',
            totalVisits: '页面总浏览量',
            todayVisits: '今日浏览量',
            weekVisits: '近7天浏览量',
            monthVisits: '近30天浏览量',
        },
        empty: '暂无评分',
        errors: {
            loadFailed: '加载统计失败',
        },
    },
};
