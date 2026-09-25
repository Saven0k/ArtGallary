// src/components/shared/Admin/sections/ArtTypes/lang.ts
import type { Language } from '../../../../../context/LanguageContext';

export interface ArtTypesTranslations {
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
        seed: string;
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

    seedModal: {
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
        seedFailed: string;
    };
}

export const artTypesTranslations: Record<Language, ArtTypesTranslations> = {
    ru: {
        title: 'Типы искусства',
        subtitle: 'Управление типами искусства',
        table: {
            id: 'ID',
            name: 'Название',
            description: 'Описание',
            actions: 'Действия',
        },
        actions: {
            create: 'Создать тип',
            edit: 'Редактировать',
            delete: 'Удалить',
            seed: 'Заполнить демо-данными',
        },
        form: {
            titleCreate: 'Создание типа искусства',
            titleEdit: 'Редактирование типа искусства',
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
            title: 'Удалить тип искусства?',
            text: 'Действие необратимо. Тип будет удалён из базы.',
            confirm: 'Удалить',
        },
        seedModal: {
            title: 'Заполнить демо-данными?',
            text: 'Будут добавлены стандартные типы искусства. Существующие данные останутся.',
            confirm: 'Заполнить',
        },
        empty: 'Типов искусства пока нет',
        errors: {
            loadFailed: 'Не удалось загрузить типы искусства',
            createFailed: 'Не удалось создать тип',
            updateFailed: 'Не удалось сохранить тип',
            deleteFailed: 'Не удалось удалить тип',
            seedFailed: 'Не удалось заполнить демо-данными',
        },
    },
    en: {
        title: 'Art types',
        subtitle: 'Manage art types',
        table: {
            id: 'ID',
            name: 'Name',
            description: 'Description',
            actions: 'Actions',
        },
        actions: {
            create: 'Create type',
            edit: 'Edit',
            delete: 'Delete',
            seed: 'Seed demo data',
        },
        form: {
            titleCreate: 'Create art type',
            titleEdit: 'Edit art type',
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
            title: 'Delete art type?',
            text: 'This action cannot be undone. The art type will be removed from the database.',
            confirm: 'Delete',
        },
        seedModal: {
            title: 'Seed demo data?',
            text: 'Default art types will be added. Existing data will be kept.',
            confirm: 'Seed',
        },
        empty: 'No art types yet',
        errors: {
            loadFailed: 'Failed to load art types',
            createFailed: 'Failed to create art type',
            updateFailed: 'Failed to save art type',
            deleteFailed: 'Failed to delete art type',
            seedFailed: 'Failed to seed demo data',
        },
    },
    zh: {
        title: '艺术类型',
        subtitle: '管理艺术类型',
        table: {
            id: 'ID',
            name: '名称',
            description: '描述',
            actions: '操作',
        },
        actions: {
            create: '创建类型',
            edit: '编辑',
            delete: '删除',
            seed: '填充示例数据',
        },
        form: {
            titleCreate: '创建艺术类型',
            titleEdit: '编辑艺术类型',
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
            title: '删除艺术类型？',
            text: '此操作不可撤销。该类型将从数据库中移除。',
            confirm: '删除',
        },
        seedModal: {
            title: '填充示例数据？',
            text: '将添加默认艺术类型。现有数据将保留。',
            confirm: '填充',
        },
        empty: '暂无艺术类型',
        errors: {
            loadFailed: '加载艺术类型失败',
            createFailed: '创建艺术类型失败',
            updateFailed: '保存艺术类型失败',
            deleteFailed: '删除艺术类型失败',
            seedFailed: '填充示例数据失败',
        },
    },
};