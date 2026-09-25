// src/components/shared/Admin/sections/Styles/lang.ts
import type { Language } from "../../../../../context/LanguageContext";

export interface StylesTranslations {
    title: string;
    subtitle: string;

    table: {
        id: string;
        name: string;
        description: string;
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
            name: string;
            description: string;
        };
        placeholders: {
            name: string;
            description: string;
        };
        buttons: {
            create: string;
            save: string;
        };
        errors: {
            nameRequired: string;
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

export const stylesTranslations: Record<Language, StylesTranslations> = {
    ru: {
        title: 'Стили',
        subtitle: 'Управление стилями',
        table: {
            id: 'ID',
            name: 'Название',
            description: 'Описание',
            actions: 'Действия',
        },
        actions: {
            create: 'Создать стиль',
            edit: 'Редактировать',
            delete: 'Удалить',
        },
        form: {
            titleCreate: 'Создание стиля',
            titleEdit: 'Редактирование стиля',
            fields: {
                name: 'Название',
                description: 'Описание',
            },
            placeholders: {
                name: 'Введите название',
                description: 'Введите описание (необязательно)',
            },
            buttons: {
                create: 'Создать',
                save: 'Сохранить',
            },
            errors: {
                nameRequired: 'Название обязательно',
            },
        },
        deleteModal: {
            title: 'Удалить стиль?',
            text: 'Действие необратимо. Стиль будет удалён из базы.',
            confirm: 'Удалить',
        },
        empty: 'Стилей пока нет',
        errors: {
            loadFailed: 'Не удалось загрузить стили',
            createFailed: 'Не удалось создать стиль',
            updateFailed: 'Не удалось сохранить стиль',
            deleteFailed: 'Не удалось удалить стиль',
        },
    },
    en: {
        title: 'Styles',
        subtitle: 'Manage styles',
        table: {
            id: 'ID',
            name: 'Name',
            description: 'Description',
            actions: 'Actions',
        },
        actions: {
            create: 'Create style',
            edit: 'Edit',
            delete: 'Delete',
        },
        form: {
            titleCreate: 'Create style',
            titleEdit: 'Edit style',
            fields: {
                name: 'Name',
                description: 'Description',
            },
            placeholders: {
                name: 'Enter name',
                description: 'Enter description (optional)',
            },
            buttons: {
                create: 'Create',
                save: 'Save',
            },
            errors: {
                nameRequired: 'Name is required',
            },
        },
        deleteModal: {
            title: 'Delete style?',
            text: 'This action cannot be undone. The style will be removed from the database.',
            confirm: 'Delete',
        },
        empty: 'No styles yet',
        errors: {
            loadFailed: 'Failed to load styles',
            createFailed: 'Failed to create style',
            updateFailed: 'Failed to save style',
            deleteFailed: 'Failed to delete style',
        },
    },
    zh: {
        title: '风格',
        subtitle: '管理风格',
        table: {
            id: 'ID',
            name: '名称',
            description: '描述',
            actions: '操作',
        },
        actions: {
            create: '创建风格',
            edit: '编辑',
            delete: '删除',
        },
        form: {
            titleCreate: '创建风格',
            titleEdit: '编辑风格',
            fields: {
                name: '名称',
                description: '描述',
            },
            placeholders: {
                name: '输入名称',
                description: '输入描述（可选）',
            },
            buttons: {
                create: '创建',
                save: '保存',
            },
            errors: {
                nameRequired: '名称必填',
            },
        },
        deleteModal: {
            title: '删除风格？',
            text: '此操作不可撤销。风格将从数据库中移除。',
            confirm: '删除',
        },
        empty: '暂无风格',
        errors: {
            loadFailed: '加载风格失败',
            createFailed: '创建风格失败',
            updateFailed: '保存风格失败',
            deleteFailed: '删除风格失败',
        },
    },
};