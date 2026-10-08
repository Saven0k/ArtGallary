import { translatedValue } from '../../../utils/translations';

export type Language = 'ru' | 'en' | 'zh';

export const sidebarTranslations = {
    ru: {
        moderationBanner: 'Ваш профиль находится на модерации',


        profile: 'Профиль',
        activity: 'Активность',
        account: 'Аккаунт',
        features: 'Возможности',
        arts: 'Работы',
        moderation: 'Модерация',
        support: 'Поддержка',
        adminka: 'Админка',


        paintings: 'Картины',
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


        author: {
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
            panel: 'Админка',
            help: 'Помощь',
            feedback: 'Обратная связь'
        },


        common: {
            likesArts: 'Мои лайки',
            likesAuthors: 'Лайки авторов',
            subscriptions: 'Мои подписки',
            notifications: 'Уведомления',
            tariff: 'Тарифный план',
            moderationArts: 'Модерация работ',
            moderationAuthors: 'Модерация авторов',
            manageArts: 'Управление работами',
            manageAuthors: 'Управление авторами',
            manageUsers: 'Управление пользователями',
            manageModerators: 'Управление модераторами',
            manageArtTypes: 'Управление типами работ',
            manageProfessions: 'Управление профессиями',
            manageEvents: 'Управление событиями',
            manageStyles: 'Управление стилями'
        }
    },

    en: {
        moderationBanner: 'Your profile is under moderation',

        profile: 'Profile',
        activity: 'Activity',
        account: 'Account',
        features: 'Features',
        arts: 'Arts',
        moderation: 'Moderation',
        support: 'Support',
        adminka: 'Admin panel',

        paintings: 'Paintings',
        authors: 'Authors',
        users: 'Users',
        artTypes: 'Art types',
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

        author: {
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
            panel: 'Admin panel',
            help: 'Help',
            feedback: 'Feedback'
        },

        common: {
            likesArts: 'My likes',
            likesAuthors: 'Author likes',
            subscriptions: 'My subscriptions',
            notifications: 'Notifications',
            tariff: 'Subscription plan',
            moderationArts: 'Moderate arts',
            moderationAuthors: 'Moderate authors',
            manageArts: 'Manage arts',
            manageAuthors: 'Manage authors',
            manageUsers: 'Manage users',
            manageModerators: 'Manage moderators',
            manageArtTypes: 'Manage art types',
            manageProfessions: 'Manage professions',
            manageEvents: 'Manage events',
            manageStyles: 'Manage styles'
        }
    },

    zh: {
        moderationBanner: '您的个人资料正在审核中',

        profile: '个人资料',
        activity: '活动',
        account: '账户',
        features: '功能',
        arts: '作品',
        moderation: '审核',
        support: '支持',
        adminka: '管理后台',

        paintings: '画作',
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

        author: {
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
            panel: '管理后台',
            help: '帮助',
            feedback: '反馈'
        },

        common: {
            likesArts: '我的点赞',
            likesAuthors: '作者点赞',
            subscriptions: '我的订阅',
            notifications: '通知',
            tariff: '订阅套餐',
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
    return translatedValue(sidebarTranslations[lang], path);
};

export const useSidebarTranslation = (lang: Language) => {
    return {
        t: (path: string) => getTranslation(lang, path),
        translations: sidebarTranslations[lang]
    };
};