
import type { Language } from '../../../../../context/LanguageContext';

export interface RatingsTranslations {
    title: string;
    subtitle: string;

    summary: {
        average: string;
        total: string;
        uniqueUsers: string;
    };

    empty: string;

    errors: {
        loadFailed: string;
    };
}

export const ratingsTranslations: Record<Language, RatingsTranslations> = {
    ru: {
        title: 'Оценки',
        subtitle: 'Сводка по оценкам сайта',
        summary: {
            average: 'Средняя оценка',
            total: 'Всего оценок',
            uniqueUsers: 'Уникальных пользователей',
        },
        empty: 'Пока нет оценок',
        errors: {
            loadFailed: 'Не удалось загрузить оценки',
        },
    },
    en: {
        title: 'Ratings',
        subtitle: 'Site ratings overview',
        summary: {
            average: 'Average rating',
            total: 'Total ratings',
            uniqueUsers: 'Unique users',
        },
        empty: 'No ratings yet',
        errors: {
            loadFailed: 'Failed to load ratings',
        },
    },
    zh: {
        title: '评分',
        subtitle: '网站评分概览',
        summary: {
            average: '平均评分',
            total: '评分总数',
            uniqueUsers: '独立用户',
        },
        empty: '暂无评分',
        errors: {
            loadFailed: '加载评分失败',
        },
    },
};