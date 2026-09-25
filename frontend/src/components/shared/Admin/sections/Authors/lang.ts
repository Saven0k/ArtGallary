// src/components/shared/Admin/sections/Authors/lang.ts
import type { Language } from "../../../../../context/LanguageContext";

export interface AuthorsTranslations {
    title: string;
    subtitle: string;

    tabs: {
        unmoderated: string;
        moderated: string;
        deleted: string;
        all: string;
    };

    table: {
        avatar: string;
        name: string;
        email: string;
        profession: string;
        status: string;
        plan: string;
        works: string;
        actions: string;
    };

    status: {
        moderated: string;
        pending: string;
        rejected: string;
        deleted: string;
    };

    actions: {
        view: string;
        approve: string;
        reject: string;
        delete: string;
        restore: string;
        create: string;
    };

    // ---------- create/edit modal ----------
    form: {
        titleCreate: string;
        stepPersonal: string;
        stepAccount: string;
        stepProfile: string;

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
            profession: string;
            biography: string;
            avatar: string;
        };

        placeholders: {
            name: string;
            surname: string;
            secondName: string;
            email: string;
            password: string;
            biography: string;
        };

        gender: {
            male: string;
            female: string;
        };

        avatar: {
            upload: string;
            change: string;
            remove: string;
            hint: string;
        };

        buttons: {
            next: string;
            back: string;
            submit: string;
        };

        errors: {
            required: string;
            email: string;
            passwordMin: string;
            passwordMax: string;
        };
    };

    // ---------- view modal ----------
    viewModal: {
        title: string;
        biography: string;
        profession: string;
        country: string;
        city: string;
        birthday: string;
        gender: string;
        registeredAt: string;
        plan: string;
        planActive: string;
        planInactive: string;
        planExpires: string;
        works: string;
        likes: string;
        followers: string;
        close: string;
        notSpecified: string;
    };

    moderateModal: {
        approveTitle: string;
        rejectTitle: string;
        commentLabel: string;
        commentPlaceholder: string;
        confirmApprove: string;
        confirmReject: string;
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
        moderateFailed: string;
        deleteFailed: string;
        restoreFailed: string;
    };
}

export const authorsTranslations: Record<Language, AuthorsTranslations> = {
    ru: {
        title: 'Авторы',
        subtitle: 'Просмотр, модерация и управление авторами',
        tabs: {
            unmoderated: 'На модерации',
            moderated: 'Прошедшие',
            deleted: 'Удалённые',
            all: 'Все',
        },
        table: {
            avatar: 'Аватар',
            name: 'Имя',
            email: 'Email',
            profession: 'Профессия',
            status: 'Статус',
            plan: 'План',
            works: 'Работы',
            actions: 'Действия',
        },
        status: {
            moderated: 'Прошёл',
            pending: 'На модерации',
            rejected: 'Отклонён',
            deleted: 'Удалён',
        },
        actions: {
            view: 'Открыть',
            approve: 'Одобрить',
            reject: 'Отклонить',
            delete: 'Удалить',
            restore: 'Восстановить',
            create: 'Создать автора',
        },
        form: {
            titleCreate: 'Создание автора',
            stepPersonal: 'Личное',
            stepAccount: 'Аккаунт',
            stepProfile: 'Профиль',
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
                profession: 'Профессия',
                biography: 'Биография',
                avatar: 'Аватар',
            },
            placeholders: {
                name: 'Введите имя',
                surname: 'Введите фамилию',
                secondName: 'Введите отчество',
                email: 'example@mail.com',
                password: 'Минимум 6 символов',
                biography: 'Расскажите об авторе',
            },
            gender: {
                male: 'Мужской',
                female: 'Женский',
            },
            avatar: {
                upload: 'Загрузить',
                change: 'Изменить',
                remove: 'Удалить',
                hint: 'PNG, JPG, до 5 МБ',
            },
            buttons: {
                next: 'Далее',
                back: 'Назад',
                submit: 'Создать',
            },
            errors: {
                required: 'Обязательное поле',
                email: 'Некорректный email',
                passwordMin: 'Минимум 6 символов',
                passwordMax: 'Максимум 25 символов',
            },
        },
        viewModal: {
            title: 'Автор',
            biography: 'Биография',
            profession: 'Профессия',
            country: 'Страна',
            city: 'Город',
            birthday: 'Дата рождения',
            gender: 'Пол',
            registeredAt: 'Дата регистрации',
            plan: 'План',
            planActive: 'Активен',
            planInactive: 'Неактивен',
            planExpires: 'Истекает',
            works: 'Работ',
            likes: 'Лайков',
            followers: 'Подписчиков',
            close: 'Закрыть',
            notSpecified: 'Не указано',
        },
        moderateModal: {
            approveTitle: 'Одобрить автора?',
            rejectTitle: 'Отклонить автора?',
            commentLabel: 'Комментарий',
            commentPlaceholder: 'Комментарий (необязательно)',
            confirmApprove: 'Одобрить',
            confirmReject: 'Отклонить',
        },
        deleteModal: {
            title: 'Удалить автора?',
            text: 'Аккаунт и работы будут скрыты. Восстановление возможно в течение 5 лет.',
            confirm: 'Удалить',
        },
        restoreModal: {
            title: 'Восстановить автора?',
            text: 'Аккаунт и работы снова станут доступны пользователям.',
            confirm: 'Восстановить',
        },
        empty: 'Авторов пока нет',
        errors: {
            loadFailed: 'Не удалось загрузить авторов',
            createFailed: 'Не удалось создать автора',
            moderateFailed: 'Не удалось изменить статус модерации',
            deleteFailed: 'Не удалось удалить автора',
            restoreFailed: 'Не удалось восстановить автора',
        },
    },
    en: {
        title: 'Authors',
        subtitle: 'View, moderate and manage authors',
        tabs: {
            unmoderated: 'Pending',
            moderated: 'Approved',
            deleted: 'Deleted',
            all: 'All',
        },
        table: {
            avatar: 'Avatar',
            name: 'Name',
            email: 'Email',
            profession: 'Profession',
            status: 'Status',
            plan: 'Plan',
            works: 'Works',
            actions: 'Actions',
        },
        status: {
            moderated: 'Approved',
            pending: 'Pending',
            rejected: 'Rejected',
            deleted: 'Deleted',
        },
        actions: {
            view: 'View',
            approve: 'Approve',
            reject: 'Reject',
            delete: 'Delete',
            restore: 'Restore',
            create: 'Create author',
        },
        form: {
            titleCreate: 'Create author',
            stepPersonal: 'Personal',
            stepAccount: 'Account',
            stepProfile: 'Profile',
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
                profession: 'Profession',
                biography: 'Biography',
                avatar: 'Avatar',
            },
            placeholders: {
                name: 'Enter first name',
                surname: 'Enter last name',
                secondName: 'Enter middle name',
                email: 'example@mail.com',
                password: 'At least 6 characters',
                biography: 'Tell about the author',
            },
            gender: {
                male: 'Male',
                female: 'Female',
            },
            avatar: {
                upload: 'Upload',
                change: 'Change',
                remove: 'Remove',
                hint: 'PNG, JPG, up to 5 MB',
            },
            buttons: {
                next: 'Next',
                back: 'Back',
                submit: 'Create',
            },
            errors: {
                required: 'Required',
                email: 'Invalid email',
                passwordMin: 'At least 6 characters',
                passwordMax: 'At most 25 characters',
            },
        },
        viewModal: {
            title: 'Author',
            biography: 'Biography',
            profession: 'Profession',
            country: 'Country',
            city: 'City',
            birthday: 'Date of birth',
            gender: 'Gender',
            registeredAt: 'Registered at',
            plan: 'Plan',
            planActive: 'Active',
            planInactive: 'Inactive',
            planExpires: 'Expires',
            works: 'Works',
            likes: 'Likes',
            followers: 'Followers',
            close: 'Close',
            notSpecified: 'Not specified',
        },
        moderateModal: {
            approveTitle: 'Approve this author?',
            rejectTitle: 'Reject this author?',
            commentLabel: 'Comment',
            commentPlaceholder: 'Comment (optional)',
            confirmApprove: 'Approve',
            confirmReject: 'Reject',
        },
        deleteModal: {
            title: 'Delete author?',
            text: 'The account and works will be hidden. Restore is possible within 5 years.',
            confirm: 'Delete',
        },
        restoreModal: {
            title: 'Restore author?',
            text: 'The account and works will become available again.',
            confirm: 'Restore',
        },
        empty: 'No authors yet',
        errors: {
            loadFailed: 'Failed to load authors',
            createFailed: 'Failed to create author',
            moderateFailed: 'Failed to change moderation status',
            deleteFailed: 'Failed to delete author',
            restoreFailed: 'Failed to restore author',
        },
    },
    zh: {
        title: '艺术家',
        subtitle: '查看、审核和管理艺术家',
        tabs: {
            unmoderated: '待审核',
            moderated: '已通过',
            deleted: '已删除',
            all: '全部',
        },
        table: {
            avatar: '头像',
            name: '姓名',
            email: '邮箱',
            profession: '职业',
            status: '状态',
            plan: '套餐',
            works: '作品',
            actions: '操作',
        },
        status: {
            moderated: '已通过',
            pending: '待审核',
            rejected: '已拒绝',
            deleted: '已删除',
        },
        actions: {
            view: '查看',
            approve: '通过',
            reject: '拒绝',
            delete: '删除',
            restore: '恢复',
            create: '创建艺术家',
        },
        form: {
            titleCreate: '创建艺术家',
            stepPersonal: '个人信息',
            stepAccount: '账户',
            stepProfile: '资料',
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
                profession: '职业',
                biography: '简介',
                avatar: '头像',
            },
            placeholders: {
                name: '输入名字',
                surname: '输入姓氏',
                secondName: '输入中间名',
                email: 'example@mail.com',
                password: '至少 6 个字符',
                biography: '介绍艺术家',
            },
            gender: {
                male: '男',
                female: '女',
            },
            avatar: {
                upload: '上传',
                change: '更换',
                remove: '删除',
                hint: 'PNG、JPG，最大 5 MB',
            },
            buttons: {
                next: '下一步',
                back: '返回',
                submit: '创建',
            },
            errors: {
                required: '必填',
                email: '邮箱格式不正确',
                passwordMin: '至少 6 个字符',
                passwordMax: '最多 25 个字符',
            },
        },
        viewModal: {
            title: '艺术家',
            biography: '简介',
            profession: '职业',
            country: '国家',
            city: '城市',
            birthday: '出生日期',
            gender: '性别',
            registeredAt: '注册时间',
            plan: '套餐',
            planActive: '有效',
            planInactive: '已失效',
            planExpires: '到期',
            works: '作品',
            likes: '点赞',
            followers: '关注者',
            close: '关闭',
            notSpecified: '未指定',
        },
        moderateModal: {
            approveTitle: '通过此艺术家？',
            rejectTitle: '拒绝此艺术家？',
            commentLabel: '备注',
            commentPlaceholder: '备注（可选）',
            confirmApprove: '通过',
            confirmReject: '拒绝',
        },
        deleteModal: {
            title: '删除艺术家？',
            text: '账户和作品将被隐藏。5 年内可以恢复。',
            confirm: '删除',
        },
        restoreModal: {
            title: '恢复艺术家？',
            text: '账户和作品将再次对用户开放。',
            confirm: '恢复',
        },
        empty: '暂无艺术家',
        errors: {
            loadFailed: '加载艺术家失败',
            createFailed: '创建艺术家失败',
            moderateFailed: '修改审核状态失败',
            deleteFailed: '删除艺术家失败',
            restoreFailed: '恢复艺术家失败',
        },
    },
};