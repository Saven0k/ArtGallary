// src/components/shared/Admin/sections/Events/lang.ts
import type { Language } from '../../../../../context/LanguageContext';

export interface EventsTranslations {
    title: string;
    subtitle: string;

    table: {
        image: string;
        title: string;
        description: string;
        createdAt: string;
        actions: string;
    };

    actions: {
        create: string;
        edit: string;
        delete: string;
    };

    form: {
        titleCreate: string;
        titleEdit: string;
        fields: {
            title: string;
            description: string;
            image: string;
        };
        placeholders: {
            title: string;
            description: string;
        };
        image: {
            upload: string;
            change: string;
            remove: string;
            hint: string;
        };
        buttons: {
            create: string;
            save: string;
        };
        errors: {
            titleRequired: string;
            imageRequired: string;
        };
    };

    deleteModal: {
        title: string;
        text: string;
        confirm: string;
    };

    empty: string;

    errors: {
        loadFailed: string;
        createFailed: string;
        updateFailed: string;
        deleteFailed: string;
    };
}

export const eventsTranslations: Record<Language, EventsTranslations> = {
    ru: {
        title: 'События',
        subtitle: 'Управление событиями',
        table: {
            image: 'Изображение',
            title: 'Заголовок',
            description: 'Описание',
            createdAt: 'Дата создания',
            actions: 'Действия',
        },
        actions: {
            create: 'Создать событие',
            edit: 'Редактировать',
            delete: 'Удалить',
        },
        form: {
            titleCreate: 'Создание события',
            titleEdit: 'Редактирование события',
            fields: {
                title: 'Заголовок',
                description: 'Описание',
                image: 'Изображение',
            },
            placeholders: {
                title: 'Введите заголовок',
                description: 'Введите описание',
            },
            image: {
                upload: 'Загрузить',
                change: 'Изменить',
                remove: 'Удалить',
                hint: 'PNG, JPG, до 5 МБ',
            },
            buttons: {
                create: 'Создать',
                save: 'Сохранить',
            },
            errors: {
                titleRequired: 'Заголовок обязателен',
                imageRequired: 'Загрузите изображение',
            },
        },
        deleteModal: {
            title: 'Удалить событие?',
            text: 'Действие необратимо. Событие будет удалено из базы.',
            confirm: 'Удалить',
        },
        empty: 'Событий пока нет',
        errors: {
            loadFailed: 'Не удалось загрузить события',
            createFailed: 'Не удалось создать событие',
            updateFailed: 'Не удалось сохранить событие',
            deleteFailed: 'Не удалось удалить событие',
        },
    },
    en: {
        title: 'Events',
        subtitle: 'Manage events',
        table: {
            image: 'Image',
            title: 'Title',
            description: 'Description',
            createdAt: 'Created at',
            actions: 'Actions',
        },
        actions: {
            create: 'Create event',
            edit: 'Edit',
            delete: 'Delete',
        },
        form: {
            titleCreate: 'Create event',
            titleEdit: 'Edit event',
            fields: {
                title: 'Title',
                description: 'Description',
                image: 'Image',
            },
            placeholders: {
                title: 'Enter title',
                description: 'Enter description',
            },
            image: {
                upload: 'Upload',
                change: 'Change',
                remove: 'Remove',
                hint: 'PNG, JPG, up to 5 MB',
            },
            buttons: {
                create: 'Create',
                save: 'Save',
            },
            errors: {
                titleRequired: 'Title is required',
                imageRequired: 'Upload an image',
            },
        },
        deleteModal: {
            title: 'Delete event?',
            text: 'This action cannot be undone. The event will be removed from the database.',
            confirm: 'Delete',
        },
        empty: 'No events yet',
        errors: {
            loadFailed: 'Failed to load events',
            createFailed: 'Failed to create event',
            updateFailed: 'Failed to save event',
            deleteFailed: 'Failed to delete event',
        },
    },
    zh: {
        title: '活动',
        subtitle: '管理活动',
        table: {
            image: '图片',
            title: '标题',
            description: '描述',
            createdAt: '创建时间',
            actions: '操作',
        },
        actions: {
            create: '创建活动',
            edit: '编辑',
            delete: '删除',
        },
        form: {
            titleCreate: '创建活动',
            titleEdit: '编辑活动',
            fields: {
                title: '标题',
                description: '描述',
                image: '图片',
            },
            placeholders: {
                title: '输入标题',
                description: '输入描述',
            },
            image: {
                upload: '上传',
                change: '更换',
                remove: '删除',
                hint: 'PNG、JPG，最大 5 MB',
            },
            buttons: {
                create: '创建',
                save: '保存',
            },
            errors: {
                titleRequired: '标题必填',
                imageRequired: '请上传图片',
            },
        },
        deleteModal: {
            title: '删除活动？',
            text: '此操作不可撤销。活动将从数据库中移除。',
            confirm: '删除',
        },
        empty: '暂无活动',
        errors: {
            loadFailed: '加载活动失败',
            createFailed: '创建活动失败',
            updateFailed: '保存活动失败',
            deleteFailed: '删除活动失败',
        },
    },
};