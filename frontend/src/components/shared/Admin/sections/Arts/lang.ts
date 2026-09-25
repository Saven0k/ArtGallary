// src/components/shared/Admin/sections/Arts/lang.ts

import type { Language } from "../../../../../context/LanguageContext";


export interface ArtsTranslations {
    title: string;
    subtitle: string;

    tabs: {
        all: string;
        moderated: string;
        unmoderated: string;
    };

    table: {
        image: string;
        title: string;
        author: string;
        status: string;
        views: string;
        likes: string;
        date: string;
        actions: string;
    };

    status: {
        moderated: string;
        pending: string;
        rejected: string;
    };

    actions: {
        view: string;
        approve: string;
        reject: string;
        delete: string;
    };

    viewModal: {
        title: string;
        author: string;
        description: string;
        cost: string;
        notSpecified: string;
        genre: string;
        style: string;
        country: string;
        city: string;
        published: string;
        tags: string;
        close: string;
    };

    moderateModal: {
        approveTitle: string;
        rejectTitle: string;
        commentPlaceholder: string;
        commentLabel: string;
        confirmApprove: string;
        confirmReject: string;
    };

    deleteModal: {
        title: string;
        text: string;
        confirm: string;
    };

    empty: string;
    errors: {
        loadFailed: string;
        moderateFailed: string;
        deleteFailed: string;
    };
}

export const artsTranslations: Record<Language, ArtsTranslations> = {
    ru: {
        title: 'Картины',
        subtitle: 'Просмотр, модерация и удаление работ',
        tabs: {
            all: 'Все',
            moderated: 'Прошедшие',
            unmoderated: 'На модерации',
        },
        table: {
            image: 'Изображение',
            title: 'Название',
            author: 'Автор',
            status: 'Статус',
            views: 'Просмотры',
            likes: 'Лайки',
            date: 'Дата',
            actions: 'Действия',
        },
        status: {
            moderated: 'Прошло',
            pending: 'На модерации',
            rejected: 'Отклонено',
        },
        actions: {
            view: 'Открыть',
            approve: 'Одобрить',
            reject: 'Отклонить',
            delete: 'Удалить',
        },
        viewModal: {
            title: 'Картина',
            author: 'Автор',
            description: 'Описание',
            cost: 'Стоимость',
            notSpecified: 'Не указано',
            genre: 'Жанр',
            style: 'Стиль',
            country: 'Страна',
            city: 'Город',
            published: 'Опубликовано',
            tags: 'Теги',
            close: 'Закрыть',
        },
        moderateModal: {
            approveTitle: 'Одобрить картину?',
            rejectTitle: 'Отклонить картину?',
            commentPlaceholder: 'Комментарий (необязательно)',
            commentLabel: 'Комментарий',
            confirmApprove: 'Одобрить',
            confirmReject: 'Отклонить',
        },
        deleteModal: {
            title: 'Удалить картину?',
            text: 'Действие необратимо. Картина будет удалена из базы.',
            confirm: 'Удалить',
        },
        empty: 'Картин пока нет',
        errors: {
            loadFailed: 'Не удалось загрузить картины',
            moderateFailed: 'Не удалось изменить статус модерации',
            deleteFailed: 'Не удалось удалить картину',
        },
    },
    en: {
        title: 'Artworks',
        subtitle: 'View, moderate and delete artworks',
        tabs: {
            all: 'All',
            moderated: 'Approved',
            unmoderated: 'Pending',
        },
        table: {
            image: 'Image',
            title: 'Title',
            author: 'Author',
            status: 'Status',
            views: 'Views',
            likes: 'Likes',
            date: 'Date',
            actions: 'Actions',
        },
        status: {
            moderated: 'Approved',
            pending: 'Pending',
            rejected: 'Rejected',
        },
        actions: {
            view: 'View',
            approve: 'Approve',
            reject: 'Reject',
            delete: 'Delete',
        },
        viewModal: {
            title: 'Artwork',
            author: 'Author',
            description: 'Description',
            cost: 'Cost',
            notSpecified: 'Not specified',
            genre: 'Genre',
            style: 'Style',
            country: 'Country',
            city: 'City',
            published: 'Published',
            tags: 'Tags',
            close: 'Close',
        },
        moderateModal: {
            approveTitle: 'Approve this artwork?',
            rejectTitle: 'Reject this artwork?',
            commentPlaceholder: 'Comment (optional)',
            commentLabel: 'Comment',
            confirmApprove: 'Approve',
            confirmReject: 'Reject',
        },
        deleteModal: {
            title: 'Delete artwork?',
            text: 'This action cannot be undone. The artwork will be removed from the database.',
            confirm: 'Delete',
        },
        empty: 'No artworks yet',
        errors: {
            loadFailed: 'Failed to load artworks',
            moderateFailed: 'Failed to change moderation status',
            deleteFailed: 'Failed to delete artwork',
        },
    },
    zh: {
        title: '作品',
        subtitle: '查看、审核和删除作品',
        tabs: {
            all: '全部',
            moderated: '已通过',
            unmoderated: '待审核',
        },
        table: {
            image: '图片',
            title: '标题',
            author: '作者',
            status: '状态',
            views: '浏览量',
            likes: '点赞数',
            date: '日期',
            actions: '操作',
        },
        status: {
            moderated: '已通过',
            pending: '待审核',
            rejected: '已拒绝',
        },
        actions: {
            view: '查看',
            approve: '通过',
            reject: '拒绝',
            delete: '删除',
        },
        viewModal: {
            title: '作品',
            author: '作者',
            description: '描述',
            cost: '价格',
            notSpecified: '未指定',
            genre: '体裁',
            style: '风格',
            country: '国家',
            city: '城市',
            published: '发布时间',
            tags: '标签',
            close: '关闭',
        },
        moderateModal: {
            approveTitle: '通过此作品？',
            rejectTitle: '拒绝此作品？',
            commentPlaceholder: '备注（可选）',
            commentLabel: '备注',
            confirmApprove: '通过',
            confirmReject: '拒绝',
        },
        deleteModal: {
            title: '删除作品？',
            text: '此操作不可撤销。作品将从数据库中移除。',
            confirm: '删除',
        },
        empty: '暂无作品',
        errors: {
            loadFailed: '加载作品失败',
            moderateFailed: '修改审核状态失败',
            deleteFailed: '删除作品失败',
        },
    },
};