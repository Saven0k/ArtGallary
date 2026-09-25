// src/components/shared/Admin/sections/Ratings/lang.ts
import type { Language } from '../../../../../context/LanguageContext';

export interface RatingsTranslations {
    title: string;
    subtitle: string;

    summary: {
        average: string;
        total: string;
        distribution: string;
    };

    table: {
        user: string;
        email: string;
        rating: string;
        date: string;
    };

    stars: {
        star: string;
        stars: string;
        noRatings: string;
    };

    empty: string;

    errors: {
        loadFailed: string;
    };
}

export const ratingsTranslations: Record<Language, RatingsTranslations> = {
    ru: {
        title: 'Оценки и отзывы',
        subtitle: 'Оценки сайта от пользователей',
        summary: {
            average: 'Средняя оценка',
            total: 'Всего оценок',
            distribution: 'Распределение',
        },
        table: {
            user: 'Пользователь',
            email: 'Email',
            rating: 'Оценка',
            date: 'Дата',
        },
        stars: {
            star: 'звезда',
            stars: 'звёзд',
            noRatings: 'Пока нет оценок',
        },
        empty: 'Оценок пока нет',
        errors: {
            loadFailed: 'Не удалось загрузить оценки',
        },
    },
    en: {
        title: 'Ratings & reviews',
        subtitle: 'Site ratings from users',
        summary: {
            average: 'Average rating',
            total: 'Total ratings',
            distribution: 'Distribution',
        },
        table: {
            user: 'User',
            email: 'Email',
            rating: 'Rating',
            date: 'Date',
        },
        stars: {
            star: 'star',
            stars: 'stars',
            noRatings: 'No ratings yet',
        },
        empty: 'No ratings yet',
        errors: {
            loadFailed: 'Failed to load ratings',
        },
    },
    zh: {
        title: '评分与评论',
        subtitle: '用户对网站的评分',
        summary: {
            average: '平均评分',
            total: '评分总数',
            distribution: '分布',
        },
        table: {
            user: '用户',
            email: '邮箱',
            rating: '评分',
            date: '日期',
        },
        stars: {
            star: '星',
            stars: '星',
            noRatings: '暂无评分',
        },
        empty: '暂无评分',
        errors: {
            loadFailed: '加载评分失败',
        },
    },
};