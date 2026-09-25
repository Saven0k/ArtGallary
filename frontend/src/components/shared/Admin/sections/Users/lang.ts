// src/components/shared/Admin/sections/Users/lang.ts

import type { Language } from "../../../../../context/LanguageContext";


export interface UsersTranslations {
    title: string;
    subtitle: string;

    tabs: {
        all: string;
        deleted: string;
    };

    roles: {
        admin: string;
        moderator: string;
        author: string;
        user: string;
    };

    table: {
        avatar: string;
        name: string;
        email: string;
        role: string;
        country: string;
        status: string;
        registeredAt: string;
        actions: string;
    };

    status: {
        active: string;
        deleted: string;
    };

    actions: {
        view: string;
        edit: string;
        delete: string;
        restore: string;
        create: string;
    };

    form: {
        titleCreate: string;
        titleEdit: string;
        fields: {
            name: string;
            surname: string;
            secondName: string;
            email: string;
            password: string;
            birthday: string;
            gender: string;
            country: string;
            city: string;
        };
        placeholders: {
            name: string;
            surname: string;
            secondName: string;
            email: string;
            password: string;
            passwordEdit: string;
        };
        gender: {
            male: string;
            female: string;
        };
        buttons: {
            submit: string;
            save: string;
            back: string;
            next: string;
        };
        errors: {
            required: string;
            email: string;
            passwordMin: string;
            passwordMax: string;
        };
    };

    viewModal: {
        title: string;
        role: string;
        country: string;
        city: string;
        birthday: string;
        gender: string;
        registeredAt: string;
        updatedAt: string;
        close: string;
        notSpecified: string;
    };

    deleteModal: {
        title: string;
        text: string;
        confirm: string;
    };

    restoreModal: {
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
        restoreFailed: string;
    };
}

export const usersTranslations: Record<Language, UsersTranslations> = {
    ru: {
        title: 'Пользователи',
        subtitle: 'Просмотр, создание и управление пользователями',
        tabs: {
            all: 'Все',
            deleted: 'Удалённые',
        },
        roles: {
            admin: 'Администратор',
            moderator: 'Модератор',
            author: 'Автор',
            user: 'Пользователь',
        },
        table: {
            avatar: 'Аватар',
            name: 'Имя',
            email: 'Email',
            role: 'Роль',
            country: 'Страна',
            status: 'Статус',
            registeredAt: 'Дата регистрации',
            actions: 'Действия',
        },
        status: {
            active: 'Активен',
            deleted: 'Удалён',
        },
        actions: {
            view: 'Открыть',
            edit: 'Редактировать',
            delete: 'Удалить',
            restore: 'Восстановить',
            create: 'Создать пользователя',
        },
        form: {
            titleCreate: 'Создание пользователя',
            titleEdit: 'Редактирование пользователя',
            fields: {
                name: 'Имя',
                surname: 'Фамилия',
                secondName: 'Отчество',
                email: 'Email',
                password: 'Пароль',
                birthday: 'Дата рождения',
                gender: 'Пол',
                country: 'Страна',
                city: 'Город',
            },
            placeholders: {
                name: 'Введите имя',
                surname: 'Введите фамилию',
                secondName: 'Введите отчество',
                email: 'example@mail.com',
                password: 'Минимум 6 символов',
                passwordEdit: 'Оставьте пустым, чтобы не менять',
            },
            gender: {
                male: 'Мужской',
                female: 'Женский',
            },
            buttons: {
                submit: 'Создать',
                save: 'Сохранить',
                back: 'Назад',
                next: 'Далее',
            },
            errors: {
                required: 'Обязательное поле',
                email: 'Некорректный email',
                passwordMin: 'Минимум 6 символов',
                passwordMax: 'Максимум 25 символов',
            },
        },
        viewModal: {
            title: 'Пользователь',
            role: 'Роль',
            country: 'Страна',
            city: 'Город',
            birthday: 'Дата рождения',
            gender: 'Пол',
            registeredAt: 'Дата регистрации',
            updatedAt: 'Дата обновления',
            close: 'Закрыть',
            notSpecified: 'Не указано',
        },
        deleteModal: {
            title: 'Удалить пользователя?',
            text: 'Аккаунт будет скрыт. Восстановление возможно в течение 5 лет.',
            confirm: 'Удалить',
        },
        restoreModal: {
            title: 'Восстановить пользователя?',
            text: 'Аккаунт снова станет доступен.',
            confirm: 'Восстановить',
        },
        empty: 'Пользователей пока нет',
        errors: {
            loadFailed: 'Не удалось загрузить пользователей',
            createFailed: 'Не удалось создать пользователя',
            updateFailed: 'Не удалось сохранить изменения',
            deleteFailed: 'Не удалось удалить пользователя',
            restoreFailed: 'Не удалось восстановить пользователя',
        },
    },
    en: {
        title: 'Users',
        subtitle: 'View, create and manage users',
        tabs: {
            all: 'All',
            deleted: 'Deleted',
        },
        roles: {
            admin: 'Administrator',
            moderator: 'Moderator',
            author: 'Author',
            user: 'User',
        },
        table: {
            avatar: 'Avatar',
            name: 'Name',
            email: 'Email',
            role: 'Role',
            country: 'Country',
            status: 'Status',
            registeredAt: 'Registered',
            actions: 'Actions',
        },
        status: {
            active: 'Active',
            deleted: 'Deleted',
        },
        actions: {
            view: 'View',
            edit: 'Edit',
            delete: 'Delete',
            restore: 'Restore',
            create: 'Create user',
        },
        form: {
            titleCreate: 'Create user',
            titleEdit: 'Edit user',
            fields: {
                name: 'First name',
                surname: 'Last name',
                secondName: 'Middle name',
                email: 'Email',
                password: 'Password',
                birthday: 'Date of birth',
                gender: 'Gender',
                country: 'Country',
                city: 'City',
            },
            placeholders: {
                name: 'Enter first name',
                surname: 'Enter last name',
                secondName: 'Enter middle name',
                email: 'example@mail.com',
                password: 'At least 6 characters',
                passwordEdit: 'Leave empty to keep current',
            },
            gender: {
                male: 'Male',
                female: 'Female',
            },
            buttons: {
                submit: 'Create',
                save: 'Save',
                back: 'Back',
                next: 'Next',
            },
            errors: {
                required: 'Required',
                email: 'Invalid email',
                passwordMin: 'At least 6 characters',
                passwordMax: 'At most 25 characters',
            },
        },
        viewModal: {
            title: 'User',
            role: 'Role',
            country: 'Country',
            city: 'City',
            birthday: 'Date of birth',
            gender: 'Gender',
            registeredAt: 'Registered at',
            updatedAt: 'Updated at',
            close: 'Close',
            notSpecified: 'Not specified',
        },
        deleteModal: {
            title: 'Delete user?',
            text: 'The account will be hidden. Restore is possible within 5 years.',
            confirm: 'Delete',
        },
        restoreModal: {
            title: 'Restore user?',
            text: 'The account will become available again.',
            confirm: 'Restore',
        },
        empty: 'No users yet',
        errors: {
            loadFailed: 'Failed to load users',
            createFailed: 'Failed to create user',
            updateFailed: 'Failed to save changes',
            deleteFailed: 'Failed to delete user',
            restoreFailed: 'Failed to restore user',
        },
    },
    zh: {
        title: '用户',
        subtitle: '查看、创建和管理用户',
        tabs: {
            all: '全部',
            deleted: '已删除',
        },
        roles: {
            admin: '管理员',
            moderator: '审核员',
            author: '艺术家',
            user: '用户',
        },
        table: {
            avatar: '头像',
            name: '姓名',
            email: '邮箱',
            role: '角色',
            country: '国家',
            status: '状态',
            registeredAt: '注册时间',
            actions: '操作',
        },
        status: {
            active: '活跃',
            deleted: '已删除',
        },
        actions: {
            view: '查看',
            edit: '编辑',
            delete: '删除',
            restore: '恢复',
            create: '创建用户',
        },
        form: {
            titleCreate: '创建用户',
            titleEdit: '编辑用户',
            fields: {
                name: '名字',
                surname: '姓氏',
                secondName: '中间名',
                email: '邮箱',
                password: '密码',
                birthday: '出生日期',
                gender: '性别',
                country: '国家',
                city: '城市',
            },
            placeholders: {
                name: '输入名字',
                surname: '输入姓氏',
                secondName: '输入中间名',
                email: 'example@mail.com',
                password: '至少 6 个字符',
                passwordEdit: '留空则不修改',
            },
            gender: {
                male: '男',
                female: '女',
            },
            buttons: {
                submit: '创建',
                save: '保存',
                back: '返回',
                next: '下一步',
            },
            errors: {
                required: '必填',
                email: '邮箱格式不正确',
                passwordMin: '至少 6 个字符',
                passwordMax: '最多 25 个字符',
            },
        },
        viewModal: {
            title: '用户',
            role: '角色',
            country: '国家',
            city: '城市',
            birthday: '出生日期',
            gender: '性别',
            registeredAt: '注册时间',
            updatedAt: '更新时间',
            close: '关闭',
            notSpecified: '未指定',
        },
        deleteModal: {
            title: '删除用户？',
            text: '账户将被隐藏。5 年内可以恢复。',
            confirm: '删除',
        },
        restoreModal: {
            title: '恢复用户？',
            text: '账户将再次对用户开放。',
            confirm: '恢复',
        },
        empty: '暂无用户',
        errors: {
            loadFailed: '加载用户失败',
            createFailed: '创建用户失败',
            updateFailed: '保存失败',
            deleteFailed: '删除用户失败',
            restoreFailed: '恢复用户失败',
        },
    },
};