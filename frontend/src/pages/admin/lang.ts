// src/pages/admin/lang.ts
import type { Language } from '../../hooks/useLanguage';

export interface AdminTranslations {
    title: string;
    sections: Record<string, string>;
    common: {
        loading: string;
        empty: string;
        error: string;
        save: string;
        cancel: string;
        confirm: string;
        delete: string;
        edit: string;
        search: string;
        actions: string;
    };
}

export const adminTranslations: Record<Language, AdminTranslations> = {
    ru: {
        title: 'Админ-панель',
        sections: {
            dashboard: 'Дашборд',
            moderation: 'Модерация',
            arts: 'Картины',
            authors: 'Авторы',
            users: 'Пользователи',
            moderators: 'Модераторы',
            genres: 'Жанры',
            styles: 'Стили',
            artTypes: 'Типы искусства',
            professions: 'Профессии',
            events: 'События',
            ratings: 'Оценки и отзывы',
        },
        common: {
            loading: 'Загрузка…',
            empty: 'Нет данных',
            error: 'Что-то пошло не так',
            save: 'Сохранить',
            cancel: 'Отмена',
            confirm: 'Подтвердить',
            delete: 'Удалить',
            edit: 'Редактировать',
            search: 'Поиск',
            actions: 'Действия',
        },
    },
    en: {
        title: 'Admin panel',
        sections: {
            dashboard: 'Dashboard',
            moderation: 'Moderation',
            arts: 'Artworks',
            authors: 'Authors',
            users: 'Users',
            moderators: 'Moderators',
            genres: 'Genres',
            styles: 'Styles',
            artTypes: 'Art types',
            professions: 'Professions',
            events: 'Events',
            ratings: 'Ratings & reviews',
        },
        common: {
            loading: 'Loading…',
            empty: 'No data',
            error: 'Something went wrong',
            save: 'Save',
            cancel: 'Cancel',
            confirm: 'Confirm',
            delete: 'Delete',
            edit: 'Edit',
            search: 'Search',
            actions: 'Actions',
        },
    },
    zh: {
        title: '管理后台',
        sections: {
            dashboard: '仪表盘',
            moderation: '审核',
            arts: '作品',
            authors: '艺术家',
            users: '用户',
            moderators: '审核员',
            genres: '体裁',
            styles: '风格',
            artTypes: '艺术类型',
            professions: '职业',
            events: '活动',
            ratings: '评分与评论',
        },
        common: {
            loading: '加载中…',
            empty: '暂无数据',
            error: '出现错误',
            save: '保存',
            cancel: '取消',
            confirm: '确认',
            delete: '删除',
            edit: '编辑',
            search: '搜索',
            actions: '操作',
        },
    },
};

export type AdminSectionId =
    | 'dashboard'
    | 'moderation'
    | 'arts'
    | 'authors'
    | 'users'
    | 'moderators'
    | 'genres'
    | 'styles'
    | 'artTypes'
    | 'professions'
    | 'events'
    | 'ratings';

export interface AdminSectionConfig {
    id: AdminSectionId;
    translationKey: keyof AdminTranslations['sections'];
    roles: string[];
}

export const ADMIN_SECTIONS: AdminSectionConfig[] = [
    { id: 'dashboard',   translationKey: 'dashboard',   roles: ['admin'] },
    { id: 'moderation',  translationKey: 'moderation',  roles: ['admin', 'moderator'] },
    { id: 'arts',        translationKey: 'arts',        roles: ['admin', 'moderator'] },
    { id: 'authors',     translationKey: 'authors',     roles: ['admin'] },
    { id: 'users',       translationKey: 'users',       roles: ['admin'] },
    { id: 'moderators',  translationKey: 'moderators',  roles: ['admin'] },
    { id: 'genres',      translationKey: 'genres',      roles: ['admin'] },
    { id: 'styles',      translationKey: 'styles',      roles: ['admin'] },
    { id: 'artTypes',    translationKey: 'artTypes',    roles: ['admin'] },
    { id: 'professions', translationKey: 'professions', roles: ['admin'] },
    { id: 'events',      translationKey: 'events',      roles: ['admin'] },
    { id: 'ratings',     translationKey: 'ratings',     roles: ['admin'] },
];

export const isValidAdminSection = (s: string | null): s is AdminSectionId =>
    !!s && ADMIN_SECTIONS.some((x) => x.id === s);