// src/components/shared/Admin/sections/Genres/lang.ts
import type { Language } from '../../../../../context/LanguageContext';

export interface GenresTranslations {
    title: string;
    subtitle: string;

    filters: {
        artType: string;
        all: string;
    };

    table: {
        id: string;
        title: string;
        artType: string;
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
            title: string;
            artType: string;
            description: string;
        };
        placeholders: {
            title: string;
            description: string;
        };
        buttons: {
            create: string;
            save: string;
        };
        errors: {
            titleRequired: string;
            artTypeRequired: string;
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
        artTypesLoadFailed: string;
    };
}

export const genresTranslations: Record<Language, GenresTranslations> = {
    ru: {
        title: 'Жанры',
        subtitle: 'Управление жанрами',
        filters: {
            artType: 'Тип искусства',
            all: 'Все типы',
        },
        table: {
            id: 'ID',
            title: 'Название',
            artType: 'Тип искусства',
            description: 'Описание',
            actions: 'Действия',
        },
        actions: {
            create: 'Создать жанр',
            edit: 'Редактировать',
            delete: 'Удалить',
            seed: 'Заполнить демо-данными',
        },
        form: {
            titleCreate: 'Создание жанра',
            titleEdit: 'Редактирование жанра',
            fields: {
                title: 'Название',
                artType: 'Тип искусства',
                description: 'Описание',
            },
            placeholders: {
                title: 'Введите название',
                description: 'Введите описание (необязательно)',
            },
            buttons: {
                create: 'Создать',
                save: 'Сохранить',
            },
            errors: {
                titleRequired: 'Название обязательно',
                artTypeRequired: 'Выберите тип искусства',
            },
        },
        deleteModal: {
            title: 'Удалить жанр?',
            text: 'Действие необратимо. Жанр будет удалён из базы.',
            confirm: 'Удалить',
        },
        seedModal: {
            title: 'Заполнить демо-данными?',
            text: 'Будут добавлены стандартные жанры. Существующие данные останутся.',
            confirm: 'Заполнить',
        },
        empty: 'Жанров пока нет',
        errors: {
            loadFailed: 'Не удалось загрузить жанры',
            createFailed: 'Не удалось создать жанр',
            updateFailed: 'Не удалось сохранить жанр',
            deleteFailed: 'Не удалось удалить жанр',
            seedFailed: 'Не удалось заполнить демо-данными',
            artTypesLoadFailed: 'Не удалось загрузить типы искусства',
        },
    },
    en: {
        title: 'Genres',
        subtitle: 'Manage genres',
        filters: {
            artType: 'Art type',
            all: 'All types',
        },
        table: {
            id: 'ID',
            title: 'Title',
            artType: 'Art type',
            description: 'Description',
            actions: 'Actions',
        },
        actions: {
            create: 'Create genre',
            edit: 'Edit',
            delete: 'Delete',
            seed: 'Seed demo data',
        },
        form: {
            titleCreate: 'Create genre',
            titleEdit: 'Edit genre',
            fields: {
                title: 'Title',
                artType: 'Art type',
                description: 'Description',
            },
            placeholders: {
                title: 'Enter title',
                description: 'Enter description (optional)',
            },
            buttons: {
                create: 'Create',
                save: 'Save',
            },
            errors: {
                titleRequired: 'Title is required',
                artTypeRequired: 'Select an art type',
            },
        },
        deleteModal: {
            title: 'Delete genre?',
            text: 'This action cannot be undone. The genre will be removed from the database.',
            confirm: 'Delete',
        },
        seedModal: {
            title: 'Seed demo data?',
            text: 'Default genres will be added. Existing data will be kept.',
            confirm: 'Seed',
        },
        empty: 'No genres yet',
        errors: {
            loadFailed: 'Failed to load genres',
            createFailed: 'Failed to create genre',
            updateFailed: 'Failed to save genre',
            deleteFailed: 'Failed to delete genre',
            seedFailed: 'Failed to seed demo data',
            artTypesLoadFailed: 'Failed to load art types',
        },
    },
    zh: {
        title: '体裁',
        subtitle: '管理体裁',
        filters: {
            artType: '艺术类型',
            all: '所有类型',
        },
        table: {
            id: 'ID',
            title: '名称',
            artType: '艺术类型',
            description: '描述',
            actions: '操作',
        },
        actions: {
            create: '创建体裁',
            edit: '编辑',
            delete: '删除',
            seed: '填充示例数据',
        },
        form: {
            titleCreate: '创建体裁',
            titleEdit: '编辑体裁',
            fields: {
                title: '名称',
                artType: '艺术类型',
                description: '描述',
            },
            placeholders: {
                title: '输入名称',
                description: '输入描述（可选）',
            },
            buttons: {
                create: '创建',
                save: '保存',
            },
            errors: {
                titleRequired: '名称必填',
                artTypeRequired: '请选择艺术类型',
            },
        },
        deleteModal: {
            title: '删除体裁？',
            text: '此操作不可撤销。体裁将从数据库中移除。',
            confirm: '删除',
        },
        seedModal: {
            title: '填充示例数据？',
            text: '将添加默认体裁。现有数据将保留。',
            confirm: '填充',
        },
        empty: '暂无体裁',
        errors: {
            loadFailed: '加载体裁失败',
            createFailed: '创建体裁失败',
            updateFailed: '保存体裁失败',
            deleteFailed: '删除体裁失败',
            seedFailed: '填充示例数据失败',
            artTypesLoadFailed: '加载艺术类型失败',
        },
    },
};