// src/components/ProfileSideBar/lang.ts
export type Language = 'ru' | 'en' | 'zh';

export const sidebarTranslations = {
    ru: {
        moderationBanner: 'Ваш профиль находится на модерации',
        profile: 'Профиль',
        arts: 'Работы',
        support: 'Поддержка',
        paintings: 'Картины',
        moderation: 'Модерация',
        authors: 'Авторы',
        users: 'Пользователи',
        artTypes: 'Типы работ',
        professions: 'Профессии',
        events: 'События',
        styles: 'Стили',
        privacy: 'Политика конфиденциальности',
        terms: 'Условия использования',
        guest: {
            title: 'Добро пожаловать!',
            subtitle: 'Войдите или зарегистрируйтесь, чтобы получить доступ ко всем возможностям',
            login: 'Войти',
            register: 'Регистрация'
        },
        user: {
            myProfile: 'Мой профиль',
            help: 'Помощь'
        },
        artist: {
            myProfile: 'Мой профиль',
            myPaintings: 'Мои работы',
            addPainting: 'Добавить работу',
            help: 'Помощь'
        },
        moderator: {
            myProfile: 'Мой профиль',
            help: 'Помощь'
        },
        admin: {
            help: 'Помощь',
            feedback: 'Обратная связь'
        },
        common: {
            likesArts: 'Лайки по работам',
            likesAuthors: 'Лайки по авторам',
            subscriptions: 'Подписки на авторов',
            moderationArts: 'Модерация работ',
            moderationAuthors: 'Модерация авторов',
            manageArts: 'Управление артами',
            manageAuthors: 'Управление авторами',
            manageUsers: 'Управление пользователями',
            manageModerators: 'Управление модераторами',
            manageArtTypes: 'Работа с типами работ',
            manageProfessions: 'Управление профессиями',
            manageEvents: 'Управление событиями',
            manageStyles: 'Управление стилями'
        }
    },
    en: {
        moderationBanner: 'Your profile is under moderation',
        profile: 'Profile',
        arts: 'Arts',
        support: 'Support',
        paintings: 'Paintings',
        moderation: 'Moderation',
        authors: 'Authors',
        users: 'Users',
        artTypes: 'Art Types',
        professions: 'Professions',
        events: 'Events',
        styles: 'Styles',
        privacy: 'Privacy Policy',
        terms: 'Terms of Service',
        guest: {
            title: 'Welcome!',
            subtitle: 'Log in or register to access all features',
            login: 'Login',
            register: 'Register'
        },
        user: {
            myProfile: 'My Profile',
            help: 'Help'
        },
        artist: {
            myProfile: 'My Profile',
            myPaintings: 'My Paintings',
            addPainting: 'Add Painting',
            help: 'Help'
        },
        moderator: {
            myProfile: 'My Profile',
            help: 'Help'
        },
        admin: {
            help: 'Help',
            feedback: 'Feedback'
        },
        common: {
            likesArts: 'Likes on Arts',
            likesAuthors: 'Likes on Authors',
            subscriptions: 'Subscriptions to Authors',
            moderationArts: 'Moderation of Arts',
            moderationAuthors: 'Moderation of Authors',
            manageArts: 'Manage Arts',
            manageAuthors: 'Manage Authors',
            manageUsers: 'Manage Users',
            manageModerators: 'Manage Moderators',
            manageArtTypes: 'Manage Art Types',
            manageProfessions: 'Manage Professions',
            manageEvents: 'Manage Events',
            manageStyles: 'Manage Styles'
        }
    },
    zh: {
        moderationBanner: '您的个人资料正在审核中',
        profile: '个人资料',
        arts: '作品',
        support: '支持',
        paintings: '画作',
        moderation: '审核',
        authors: '作者',
        users: '用户',
        artTypes: '作品类型',
        professions: '职业',
        events: '活动',
        styles: '风格',
        privacy: '隐私政策',
        terms: '服务条款',
        guest: {
            title: '欢迎！',
            subtitle: '登录或注册以访问所有功能',
            login: '登录',
            register: '注册'
        },
        user: {
            myProfile: '我的个人资料',
            help: '帮助'
        },
        artist: {
            myProfile: '我的个人资料',
            myPaintings: '我的作品',
            addPainting: '添加作品',
            help: '帮助'
        },
        moderator: {
            myProfile: '我的个人资料',
            help: '帮助'
        },
        admin: {
            help: '帮助',
            feedback: '反馈'
        },
        common: {
            likesArts: '作品点赞',
            likesAuthors: '作者点赞',
            subscriptions: '作者订阅',
            moderationArts: '作品审核',
            moderationAuthors: '作者审核',
            manageArts: '管理作品',
            manageAuthors: '管理作者',
            manageUsers: '管理用户',
            manageModerators: '管理版主',
            manageArtTypes: '管理作品类型',
            manageProfessions: '管理职业',
            manageEvents: '管理活动',
            manageStyles: '管理风格'
        }
    }
};

export const getTranslation = (lang: Language, path: string): string => {
    const keys = path.split('.');
    let result: any = sidebarTranslations[lang];

    for (const key of keys) {
        if (result && result[key] !== undefined) {
            result = result[key];
        } else {
            return path;
        }
    }

    return typeof result === 'string' ? result : path;
};

export const useSidebarTranslation = (lang: Language) => {
    return {
        t: (path: string) => getTranslation(lang, path),
        translations: sidebarTranslations[lang]
    };
};