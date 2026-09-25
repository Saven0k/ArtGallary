// src/components/shared/Admin/sections/Moderators/lang.ts
import type { Language } from '../../../../../context/LanguageContext';

export interface ModeratorsTranslations {
    title: string;
    subtitle: string;

    table: {
        avatar: string;
        name: string;
        email: string;
        phone: string;
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
            email: string;
            password: string;
            name: string;
            surname: string;
            secondName: string;
            phone: string;
            avatar: string;
        };
        placeholders: {
            email: string;
            password: string;
            passwordEdit: string;
            name: string;
            surname: string;
            secondName: string;
            phone: string;
        };
        avatar: {
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
            required: string;
            email: string;
            passwordMin: string;
            passwordMax: string;
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

export const moderatorsTranslations: Record<Language, ModeratorsTranslations> = {
    ru: {
        title: 'Модераторы',
        subtitle: 'Управление модераторами',
        table: {
            avatar: 'Аватар',
            name: 'Имя',
            email: 'Email',
            phone: 'Телефон',
            createdAt: 'Дата создания',
            actions: 'Действия',
        },
        actions: {
            create: 'Создать модератора',
            edit: 'Редактировать',
            delete: 'Удалить',
        },
        form: {
            titleCreate: 'Создание модератора',
            titleEdit: 'Редактирование модератора',
            fields: {
                email: 'Email',
                password: 'Пароль',
                name: 'Имя',
                surname: 'Фамилия',
                secondName: 'Отчество',
                phone: 'Телефон',
                avatar: 'Аватар',
            },
            placeholders: {
                email: 'example@mail.com',
                password: 'Минимум 6 символов',
                passwordEdit: 'Оставьте пустым, чтобы не менять',
                name: 'Введите имя',
                surname: 'Введите фамилию',
                secondName: 'Введите отчество',
                phone: '+7 (999) 999-99-99',
            },
            avatar: {
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
                required: 'Обязательное поле',
                email: 'Некорректный email',
                passwordMin: 'Минимум 6 символов',
                passwordMax: 'Максимум 25 символов',
            },
        },
        deleteModal: {
            title: 'Удалить модератора?',
            text: 'Пользователь потеряет роль модератора. Действие необратимо.',
            confirm: 'Удалить',
        },
        empty: 'Модераторов пока нет',
        errors: {
            loadFailed: 'Не удалось загрузить модераторов',
            createFailed: 'Не удалось создать модератора',
            updateFailed: 'Не удалось сохранить изменения',
            deleteFailed: 'Не удалось удалить модератора',
        },
    },
    en: {
        title: 'Moderators',
        subtitle: 'Manage moderators',
        table: {
            avatar: 'Avatar',
            name: 'Name',
            email: 'Email',
            phone: 'Phone',
            createdAt: 'Created at',
            actions: 'Actions',
        },
        actions: {
            create: 'Create moderator',
            edit: 'Edit',
            delete: 'Delete',
        },
        form: {
            titleCreate: 'Create moderator',
            titleEdit: 'Edit moderator',
            fields: {
                email: 'Email',
                password: 'Password',
                name: 'First name',
                surname: 'Last name',
                secondName: 'Middle name',
                phone: 'Phone',
                avatar: 'Avatar',
            },
            placeholders: {
                email: 'example@mail.com',
                password: 'At least 6 characters',
                passwordEdit: 'Leave empty to keep current',
                name: 'Enter first name',
                surname: 'Enter last name',
                secondName: 'Enter middle name',
                phone: '+7 (999) 999-99-99',
            },
            avatar: {
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
                required: 'Required',
                email: 'Invalid email',
                passwordMin: 'At least 6 characters',
                passwordMax: 'At most 25 characters',
            },
        },
        deleteModal: {
            title: 'Delete moderator?',
            text: 'The user will lose the moderator role. This action cannot be undone.',
            confirm: 'Delete',
        },
        empty: 'No moderators yet',
        errors: {
            loadFailed: 'Failed to load moderators',
            createFailed: 'Failed to create moderator',
            updateFailed: 'Failed to save changes',
            deleteFailed: 'Failed to delete moderator',
        },
    },
    zh: {
        title: '审核员',
        subtitle: '管理审核员',
        table: {
            avatar: '头像',
            name: '姓名',
            email: '邮箱',
            phone: '电话',
            createdAt: '创建时间',
            actions: '操作',
        },
        actions: {
            create: '创建审核员',
            edit: '编辑',
            delete: '删除',
        },
        form: {
            titleCreate: '创建审核员',
            titleEdit: '编辑审核员',
            fields: {
                email: '邮箱',
                password: '密码',
                name: '名字',
                surname: '姓氏',
                secondName: '中间名',
                phone: '电话',
                avatar: '头像',
            },
            placeholders: {
                email: 'example@mail.com',
                password: '至少 6 个字符',
                passwordEdit: '留空则不修改',
                name: '输入名字',
                surname: '输入姓氏',
                secondName: '输入中间名',
                phone: '+7 (999) 999-99-99',
            },
            avatar: {
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
                required: '必填',
                email: '邮箱格式不正确',
                passwordMin: '至少 6 个字符',
                passwordMax: '最多 25 个字符',
            },
        },
        deleteModal: {
            title: '删除审核员？',
            text: '该用户将失去审核员角色。此操作不可撤销。',
            confirm: '删除',
        },
        empty: '暂无审核员',
        errors: {
            loadFailed: '加载审核员失败',
            createFailed: '创建审核员失败',
            updateFailed: '保存失败',
            deleteFailed: '删除审核员失败',
        },
    },
};