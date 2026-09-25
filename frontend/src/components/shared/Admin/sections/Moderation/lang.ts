// src/components/shared/Admin/sections/Moderation/lang.ts
import type { Language } from '../../../../../context/LanguageContext';

export interface ModerationTranslations {
    title: string;
    subtitle: string;

    tabs: {
        all: string;
        arts: string;
        authors: string;
    };

    summary: {
        arts: string;
        authors: string;
        total: string;
    };

    type: {
        art: string;
        author: string;
    };

    table: {
        type: string;
        preview: string;
        title: string;
        author: string;
        date: string;
        actions: string;
    };

    actions: {
        view: string;
        approve: string;
        reject: string;
    };

    empty: {
        all: string;
        arts: string;
        authors: string;
    };

    viewModal: {
        title: string;
        description: string;
        cost: string;
        genre: string;
        style: string;
        biography: string;
        profession: string;
        notSpecified: string;
        close: string;
    };

    moderateModal: {
        approveTitle: string;
        rejectTitle: string;
        commentLabel: string;
        commentPlaceholder: string;
        confirmApprove: string;
        confirmReject: string;
    };

    errors: {
        loadFailed: string;
        moderateFailed: string;
    };
}

export const moderationTranslations: Record<Language, ModerationTranslations> = {
    ru: {
        title: 'Модерация',
        subtitle: 'Очередь объектов, ожидающих решения',
        tabs: {
            all: 'Всё',
            arts: 'Картины',
            authors: 'Авторы',
        },
        summary: {
            arts: 'Картин ждут',
            authors: 'Авторов ждут',
            total: 'Всего',
        },
        type: {
            art: 'Картина',
            author: 'Автор',
        },
        table: {
            type: 'Тип',
            preview: 'Превью',
            title: 'Название',
            author: 'Автор',
            date: 'Дата подачи',
            actions: 'Действия',
        },
        actions: {
            view: 'Открыть',
            approve: 'Одобрить',
            reject: 'Отклонить',
        },
        empty: {
            all: 'Очередь пуста — всё разгреблено 🎉',
            arts: 'Картин на модерации нет',
            authors: 'Авторов на модерации нет',
        },
        viewModal: {
            title: 'Просмотр',
            description: 'Описание',
            cost: 'Стоимость',
            genre: 'Жанр',
            style: 'Стиль',
            biography: 'Биография',
            profession: 'Профессия',
            notSpecified: 'Не указано',
            close: 'Закрыть',
        },
        moderateModal: {
            approveTitle: 'Одобрить объект?',
            rejectTitle: 'Отклонить объект?',
            commentLabel: 'Комментарий',
            commentPlaceholder: 'Комментарий (необязательно)',
            confirmApprove: 'Одобрить',
            confirmReject: 'Отклонить',
        },
        errors: {
            loadFailed: 'Не удалось загрузить очередь',
            moderateFailed: 'Не удалось изменить статус',
        },
    },
    en: {
        title: 'Moderation',
        subtitle: 'Queue of items awaiting decision',
        tabs: {
            all: 'All',
            arts: 'Artworks',
            authors: 'Authors',
        },
        summary: {
            arts: 'Artworks pending',
            authors: 'Authors pending',
            total: 'Total',
        },
        type: {
            art: 'Artwork',
            author: 'Author',
        },
        table: {
            type: 'Type',
            preview: 'Preview',
            title: 'Title',
            author: 'Author',
            date: 'Submitted at',
            actions: 'Actions',
        },
        actions: {
            view: 'View',
            approve: 'Approve',
            reject: 'Reject',
        },
        empty: {
            all: 'Queue is empty — all caught up 🎉',
            arts: 'No artworks pending',
            authors: 'No authors pending',
        },
        viewModal: {
            title: 'View',
            description: 'Description',
            cost: 'Cost',
            genre: 'Genre',
            style: 'Style',
            biography: 'Biography',
            profession: 'Profession',
            notSpecified: 'Not specified',
            close: 'Close',
        },
        moderateModal: {
            approveTitle: 'Approve this item?',
            rejectTitle: 'Reject this item?',
            commentLabel: 'Comment',
            commentPlaceholder: 'Comment (optional)',
            confirmApprove: 'Approve',
            confirmReject: 'Reject',
        },
        errors: {
            loadFailed: 'Failed to load queue',
            moderateFailed: 'Failed to change status',
        },
    },
    zh: {
        title: '审核',
        subtitle: '等待处理的审核队列',
        tabs: {
            all: '全部',
            arts: '作品',
            authors: '艺术家',
        },
        summary: {
            arts: '待审核作品',
            authors: '待审核艺术家',
            total: '总计',
        },
        type: {
            art: '作品',
            author: '艺术家',
        },
        table: {
            type: '类型',
            preview: '预览',
            title: '标题',
            author: '作者',
            date: '提交时间',
            actions: '操作',
        },
        actions: {
            view: '查看',
            approve: '通过',
            reject: '拒绝',
        },
        empty: {
            all: '队列为空 — 全部处理完毕 🎉',
            arts: '暂无待审核作品',
            authors: '暂无待审核艺术家',
        },
        viewModal: {
            title: '查看',
            description: '描述',
            cost: '价格',
            genre: '体裁',
            style: '风格',
            biography: '简介',
            profession: '职业',
            notSpecified: '未指定',
            close: '关闭',
        },
        moderateModal: {
            approveTitle: '通过此项？',
            rejectTitle: '拒绝此项？',
            commentLabel: '备注',
            commentPlaceholder: '备注（可选）',
            confirmApprove: '通过',
            confirmReject: '拒绝',
        },
        errors: {
            loadFailed: '加载队列失败',
            moderateFailed: '修改状态失败',
        },
    },
};