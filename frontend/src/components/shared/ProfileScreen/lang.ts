// src/pages/Profile/lang.ts

export type Language = 'ru' | 'en' | 'zh';

export const profileTranslations = {
    ru: {
        analytics: {
            title: 'Аналитика',
            exhibitions: 'Выставки',
            artworks: 'Работ',
            edit: 'Редактировать профиль',
            tip: {
                title: 'Совет',
                default: 'Заполните профиль полностью, чтобы повысить доверие покупателей.',
            },
        },
        settings: {
            title: 'Настройки аккаунта',
            subtitle: 'Управляйте безопасностью и данными своего аккаунта',
            items: [
                { title: 'Изменить пароль', description: 'Обновите пароль для защиты аккаунта.' },
                { title: 'Изменить Email', description: 'Измените адрес электронной почты.' },
                { title: 'Удалить аккаунт', description: 'Это действие необратимо. Все данные будут удалены.' },
            ],
            notifications: {
                passwordChanged: 'Пароль успешно изменён',
                passwordChangeFailed: 'Ошибка изменения пароля',
                emailChanged: 'Email успешно изменён',
                emailChangeFailed: 'Ошибка изменения email',
                accountDeleted: 'Аккаунт удалён. Восстановление возможно в течение 5 лет.',
                accountDeleteFailed: 'Не удалось удалить аккаунт',
            },
        },
        statistics: {
            title: 'Статистика',
            subtitle: 'Аналитика вашего профиля',
            cards: { views: 'Просмотры', likes: 'Лайки', followers: 'Подписчики', works: 'Работы' },
            charts: { views: 'Просмотры по месяцам', traffic: 'Источники трафика', popular: 'Популярные работы', countries: 'Страны посетителей' },
            placeholder: 'Здесь будет график',
        },
    },

    en: {
        analytics: {
            title: 'Analytics',
            exhibitions: 'Exhibitions',
            artworks: 'Artworks',
            edit: 'Edit Profile',
            tip: { title: 'Tip', default: 'Complete your profile to increase buyer trust.' },
        },
        settings: {
            title: 'Account Settings',
            subtitle: 'Manage your account security and data',
            items: [
                { title: 'Change Password', description: 'Update your password to protect your account.' },
                { title: 'Change Email', description: 'Change your email address.' },
                { title: 'Delete Account', description: 'This action is irreversible. All data will be deleted.' },
            ],
            notifications: {
                passwordChanged: 'Password changed successfully',
                passwordChangeFailed: 'Failed to change password',
                emailChanged: 'Email changed successfully',
                emailChangeFailed: 'Failed to change email',
                accountDeleted: 'Account deleted. You can restore it within 5 years.',
                accountDeleteFailed: 'Failed to delete account',
            },
        },
        statistics: {
            title: 'Statistics',
            subtitle: 'Your profile analytics',
            cards: { views: 'Views', likes: 'Likes', followers: 'Followers', works: 'Works' },
            charts: { views: 'Views by Month', traffic: 'Traffic Sources', popular: 'Popular Artworks', countries: 'Visitor Countries' },
            placeholder: 'Chart will be here',
        },
    },

    zh: {
        analytics: {
            title: '分析',
            exhibitions: '展览',
            artworks: '作品',
            edit: '编辑个人资料',
            tip: { title: '建议', default: '完整填写个人资料，以提高买家的信任度。' },
        },
        settings: {
            title: '账户设置',
            subtitle: '管理您的账户安全和数据',
            items: [
                { title: '修改密码', description: '更新密码以保护您的账户。' },
                { title: '修改邮箱', description: '更改您的邮箱地址。' },
                { title: '删除账户', description: '此操作不可逆。所有数据将被删除。' },
            ],
            notifications: {
                passwordChanged: '密码修改成功',
                passwordChangeFailed: '密码修改失败',
                emailChanged: '邮箱修改成功',
                emailChangeFailed: '邮箱修改失败',
                accountDeleted: '账户已删除。您可以在 5 年内恢复。',
                accountDeleteFailed: '删除账户失败',
            },
        },
        statistics: {
            title: '统计',
            subtitle: '您的个人资料分析',
            cards: { views: '浏览量', likes: '点赞数', followers: '关注者', works: '作品数' },
            charts: { views: '按月浏览量', traffic: '流量来源', popular: '热门作品', countries: '访客国家' },
            placeholder: '图表将在此显示',
        },
    },
};

export const getTranslation = (lang: Language, path: string): string => {
    const keys = path.split('.');
    let result: any = profileTranslations[lang];
    for (const key of keys) {
        if (result && result[key] !== undefined) result = result[key];
        else return path;
    }
    return typeof result === 'string' ? result : path;
};

export const useProfileTranslation = (lang: Language) => ({
    t: (path: string) => getTranslation(lang, path),
    translations: profileTranslations[lang],
});