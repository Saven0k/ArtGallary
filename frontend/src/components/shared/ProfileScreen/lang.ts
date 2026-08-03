// src/pages/Profile/lang.ts

export type Language = 'ru' | 'en' | 'zh';

export const profileTranslations = {
    ru: {
        header: {
            plan: 'VIP',
        },
        analytics: {
            title: 'Аналитика',
            exhibitions: 'Выставки',
            artworks: 'Работ',
            edit: 'Редактировать профиль',
            tip: {
                title: 'Совет',
                default: 'Заполните профиль полностью, чтобы повысить доверие покупателей.'
            }
        },
        notifications: {
            title: 'Уведомления',
            subtitle: 'Последние события вашего аккаунта',
            items: [
                {
                    title: 'Ваша заявка на выставку одобрена',
                    description: 'Выставка «Натюрморты XX века» успешно одобрена модератором.',
                    time: '10:30'
                },
                {
                    title: 'У вас новая отметка «Нравится»',
                    description: 'Михаил Михайлов поставил отметку «Нравится» вашей картине.',
                    time: '09:30'
                },
                {
                    title: 'У вас новый подписчик',
                    description: 'Михаил Михайлов подписался на вас.',
                    time: '09:15'
                }
            ]
        },
        personalInfo: {
            title: 'Личная информация',
            subtitle: 'Обновите информацию о своем профиле',
            fields: {
                name: 'Имя',
                surname: 'Фамилия',
                secondName: 'Отчество',
                birthday: 'Дата рождения',
                country: 'Страна',
                city: 'Город',
                phone: 'Телефон',
                email: 'Email',
                about: 'О себе'
            },
            placeholders: {
                name: 'Введите имя',
                surname: 'Введите фамилию',
                secondName: 'Введите отчество',
                phone: '+7 (999) 999-99-99',
                email: 'example@mail.com',
                about: 'Расскажите немного о себе...'
            },
            button: 'Сохранить изменения'
        },
        settings: {
            title: 'Настройки аккаунта',
            subtitle: 'Управляйте безопасностью и данными своего аккаунта',
            items: [
                {
                    title: 'Изменить пароль',
                    description: 'Обновите пароль для защиты аккаунта.'
                },
                {
                    title: 'Изменить Email',
                    description: 'Измените адрес электронной почты.'
                },
                {
                    title: 'Удалить аккаунт',
                    description: 'Это действие необратимо. Все данные будут удалены.'
                }
            ]
        },
        statistics: {
            title: 'Статистика',
            subtitle: 'Аналитика вашего профиля',
            cards: {
                views: 'Просмотры',
                likes: 'Лайки',
                followers: 'Подписчики',
                works: 'Работы'
            },
            charts: {
                views: 'Просмотры по месяцам',
                traffic: 'Источники трафика',
                popular: 'Популярные работы',
                countries: 'Страны посетителей'
            },
            placeholder: 'Здесь будет график'
        }
    },
    en: {
        header: {
            plan: 'VIP'
        },
        analytics: {
            title: 'Analytics',
            exhibitions: 'Exhibitions',
            artworks: 'Artworks',
            edit: 'Edit Profile',
            tip: {
                title: 'Tip',
                default: 'Complete your profile to increase buyer trust.'
            }
        },
        notifications: {
            title: 'Notifications',
            subtitle: 'Latest events of your account',
            items: [
                {
                    title: 'Your exhibition application approved',
                    description: 'The exhibition "Still Lifes of the 20th Century" has been successfully approved by the moderator.',
                    time: '10:30'
                },
                {
                    title: 'You have a new like',
                    description: 'Mikhail Mikhailov liked your artwork.',
                    time: '09:30'
                },
                {
                    title: 'You have a new follower',
                    description: 'Mikhail Mikhailov followed you.',
                    time: '09:15'
                }
            ]
        },
        personalInfo: {
            title: 'Personal Information',
            subtitle: 'Update your profile information',
            fields: {
                name: 'First Name',
                surname: 'Last Name',
                secondName: 'Middle Name',
                birthday: 'Date of Birth',
                country: 'Country',
                city: 'City',
                phone: 'Phone',
                email: 'Email',
                about: 'About'
            },
            placeholders: {
                name: 'Enter first name',
                surname: 'Enter last name',
                secondName: 'Enter middle name',
                phone: '+7 (999) 999-99-99',
                email: 'example@mail.com',
                about: 'Tell us about yourself...'
            },
            button: 'Save Changes'
        },
        settings: {
            title: 'Account Settings',
            subtitle: 'Manage your account security and data',
            items: [
                {
                    title: 'Change Password',
                    description: 'Update your password to protect your account.'
                },
                {
                    title: 'Change Email',
                    description: 'Change your email address.'
                },
                {
                    title: 'Delete Account',
                    description: 'This action is irreversible. All data will be deleted.'
                }
            ]
        },
        statistics: {
            title: 'Statistics',
            subtitle: 'Your profile analytics',
            cards: {
                views: 'Views',
                likes: 'Likes',
                followers: 'Followers',
                works: 'Works'
            },
            charts: {
                views: 'Views by Month',
                traffic: 'Traffic Sources',
                popular: 'Popular Artworks',
                countries: 'Visitor Countries'
            },
            placeholder: 'Chart will be here'
        }
    },
    zh: {
        header: {
            plan: 'VIP'
        },
        analytics: {
            title: '分析',
            exhibitions: '展览',
            artworks: '作品',
            edit: '编辑个人资料',
            tip: {
                title: '建议',
                default: '完整填写个人资料，以提高买家的信任度。'
            }
        },
        notifications: {
            title: '通知',
            subtitle: '您账户的最新动态',
            items: [
                {
                    title: '您的展览申请已批准',
                    description: '展览"20世纪静物画"已成功通过审核。',
                    time: '10:30'
                },
                {
                    title: '您有一个新的点赞',
                    description: '米哈伊尔·米哈伊洛夫点赞了您的作品。',
                    time: '09:30'
                },
                {
                    title: '您有新的关注者',
                    description: '米哈伊尔·米哈伊洛夫关注了您。',
                    time: '09:15'
                }
            ]
        },
        personalInfo: {
            title: '个人信息',
            subtitle: '更新您的个人资料',
            fields: {
                name: '名字',
                surname: '姓氏',
                secondName: '中间名',
                birthday: '出生日期',
                country: '国家',
                city: '城市',
                phone: '电话',
                email: '邮箱',
                about: '关于'
            },
            placeholders: {
                name: '输入名字',
                surname: '输入姓氏',
                secondName: '输入中间名',
                phone: '+7 (999) 999-99-99',
                email: 'example@mail.com',
                about: '介绍一下您自己...'
            },
            button: '保存更改'
        },
        settings: {
            title: '账户设置',
            subtitle: '管理您的账户安全和数据',
            items: [
                {
                    title: '修改密码',
                    description: '更新密码以保护您的账户。'
                },
                {
                    title: '修改邮箱',
                    description: '更改您的邮箱地址。'
                },
                {
                    title: '删除账户',
                    description: '此操作不可逆。所有数据将被删除。'
                }
            ]
        },
        statistics: {
            title: '统计',
            subtitle: '您的个人资料分析',
            cards: {
                views: '浏览量',
                likes: '点赞数',
                followers: '关注者',
                works: '作品数'
            },
            charts: {
                views: '按月浏览量',
                traffic: '流量来源',
                popular: '热门作品',
                countries: '访客国家'
            },
            placeholder: '图表将在此显示'
        }
    }
};

export const getTranslation = (lang: Language, path: string): string => {
    const keys = path.split('.');
    let result: any = profileTranslations[lang];

    for (const key of keys) {
        if (result && result[key] !== undefined) {
            result = result[key];
        } else {
            return path;
        }
    }

    return typeof result === 'string' ? result : path;
};

export const useProfileTranslation = (lang: Language) => {
    return {
        t: (path: string) => getTranslation(lang, path),
        translations: profileTranslations[lang]
    };
};