// src/components/shared/Admin/sections/Professions/lang.ts
import type { Language } from '../../../../../context/LanguageContext';

export interface ProfessionsTranslations {
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

export const professionsTranslations: Record<Language, ProfessionsTranslations> = {
    ru: {
        title: 'Профессии',
        subtitle: 'Управление профессиями',
        table: {
            id: 'ID',
            name: 'Название',
            description: 'Описание',
            actions: 'Действия',
        },
        actions: {
            create: 'Создать профессию',
            edit: 'Редактировать',
            delete: 'Удалить',
        },
        form: {
            titleCreate: 'Создание профессии',
            titleEdit: 'Редактирование профессии',
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
            title: 'Удалить профессию?',
            text: 'Действие необратимо. Профессия будет удалена из базы.',
            confirm: 'Удалить',
        },
        empty: 'Профессий пока нет',
        errors: {
            loadFailed: 'Не удалось загрузить профессии',
            createFailed: 'Не удалось создать профессию',
            updateFailed: 'Не удалось сохранить профессию',
            deleteFailed: 'Не удалось удалить профессию',
        },
    },
    en: {
        title: 'Professions',
        subtitle: 'Manage professions',
        table: {
            id: 'ID',
            name: 'Name',
            description: 'Description',
            actions: 'Actions',
        },
        actions: {
            create: 'Create profession',
            edit: 'Edit',
            delete: 'Delete',
        },
        form: {
            titleCreate: 'Create profession',
            titleEdit: 'Edit profession',
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
            title: 'Delete profession?',
            text: 'This action cannot be undone. The profession will be removed from the database.',
            confirm: 'Delete',
        },
        empty: 'No professions yet',
        errors: {
            loadFailed: 'Failed to load professions',
            createFailed: 'Failed to create profession',
            updateFailed: 'Failed to save profession',
            deleteFailed: 'Failed to delete profession',
        },
    },
    zh: {
        title: '职业',
        subtitle: '管理职业',
        table: {
            id: 'ID',
            name: '名称',
            description: '描述',
            actions: '操作',
        },
        actions: {
            create: '创建职业',
            edit: '编辑',
            delete: '删除',
        },
        form: {
            titleCreate: '创建职业',
            titleEdit: '编辑职业',
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
            title: '删除职业？',
            text: '此操作不可撤销。职业将从数据库中移除。',
            confirm: '删除',
        },
        empty: '暂无职业',
        errors: {
            loadFailed: '加载职业失败',
            createFailed: '创建职业失败',
            updateFailed: '保存职业失败',
            deleteFailed: '删除职业失败',
        },
    },
};