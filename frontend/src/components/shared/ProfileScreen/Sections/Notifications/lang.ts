// src/components/shared/ProfileScreen/Sections/Notifications/lang.ts

export type Language = 'ru' | 'en' | 'zh';

export interface NotificationsTranslations {
    title: string;
    subtitle: string;
    empty: string;
    loadMore: string;
    loading: string;
    markAllRead: string;
    deleteAll: string;
    deleteAllConfirm: string;
    yesDeleteAll: string;
    cancel: string;

    types: {
        artLike: string;
        authorLike: string;
        newFollower: string;
        newArt: string;
    };

    fallbackUnknown: string;
}

export const notificationsTranslations: Record<Language, NotificationsTranslations> = {
    ru: {
        title: 'Уведомления',
        subtitle: 'Последние события вашего аккаунта',
        empty: 'Уведомлений пока нет',
        loadMore: 'Загрузить ещё',
        loading: 'Загрузка…',
        markAllRead: 'Прочитать все',
        types: {
            artLike: 'Кто-то оценил вашу работу',
            authorLike: 'Кто-то оценил ваш профиль',
            newFollower: 'У вас новый подписчик',
            newArt: 'Автор, на которого вы подписаны, выложил новую работу',
        },
        fallbackUnknown: 'Новое уведомление',
        deleteAll: 'Удалить всё',
        deleteAllConfirm: 'Удалить все уведомления? Это действие необратимо.',
        yesDeleteAll: 'Да, удалить',
        cancel: 'Отмена',
    },
    en: {
        title: 'Notifications',
        subtitle: 'Latest events of your account',
        empty: 'No notifications yet',
        loadMore: 'Load more',
        loading: 'Loading…',
        markAllRead: 'Mark all as read',
        types: {
            artLike: 'Someone liked your artwork',
            authorLike: 'Someone liked your profile',
            newFollower: 'You have a new follower',
            newArt: 'An author you follow has posted a new artwork',
        },
        fallbackUnknown: 'New notification',
        deleteAll: 'Delete all',
        deleteAllConfirm: 'Delete all notifications? This action cannot be undone.',
        yesDeleteAll: 'Yes, delete',
        cancel: 'Cancel',
    },
    zh: {
        title: '通知',
        subtitle: '您账户的最新动态',
        empty: '暂无通知',
        loadMore: '加载更多',
        loading: '加载中…',
        markAllRead: '全部标为已读',
        types: {
            artLike: '有人点赞了您的作品',
            authorLike: '有人点赞了您的资料',
            newFollower: '您有新的关注者',
            newArt: '您关注的作者发布了新作品',
        },
        fallbackUnknown: '新的通知',
        deleteAll: '删除全部',
        deleteAllConfirm: '确定删除所有通知吗？此操作不可恢复。',
        yesDeleteAll: '是，删除',
        cancel: '取消',
    },
};