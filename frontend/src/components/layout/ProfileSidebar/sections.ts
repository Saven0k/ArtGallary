

export interface MenuItem {
    icon: string;

    labelKey: string;
    path: string;
    badge?: number | null;
}

export interface MenuSection {

    titleKey: string;
    items: MenuItem[];
}





export const menuSectionsAuthor: MenuSection[] = [
    {
        titleKey: 'profile',
        items: [
            { icon: '👤', labelKey: 'author.myProfile', path: '/profile' },
        ],
    },
    {
        titleKey: 'activity',
        items: [
            { icon: '❤️', labelKey: 'common.likesArts',     path: '/profile?section=likes' },
            { icon: '🔔', labelKey: 'common.subscriptions', path: '/profile?section=subscriptions' },
        ],
    },
    {
        titleKey: 'account',
        items: [
            { icon: '📩', labelKey: 'common.notifications', path: '/profile?section=notifications' },
            { icon: '💎', labelKey: 'common.tariff',        path: '/profile?section=tariff' },
        ],
    },
    {
        titleKey: 'arts',
        items: [
            { icon: '🎨', labelKey: 'author.addPainting', path: '/arts/new' },
            { icon: '🖼️', labelKey: 'author.myPaintings', path: '/arts/my' },
        ],
    },
    {
        titleKey: 'support',
        items: [
            { icon: '❓', labelKey: 'author.help', path: '/help' },
        ],
    },
];





export const menuSectionsUser: MenuSection[] = [
    {
        titleKey: 'profile',
        items: [
            { icon: '👤', labelKey: 'user.myProfile', path: '/profile' },
        ],
    },
    {
        titleKey: 'features',
        items: [
            { icon: '❤️', labelKey: 'common.likesArts',     path: '/profile?section=likes' },
            { icon: '🔔', labelKey: 'common.subscriptions', path: '/profile?section=subscriptions' },
        ],
    },
    {
        titleKey: 'support',
        items: [
            { icon: '❓', labelKey: 'user.help', path: '/help' },
        ],
    },
];





export const menuSectionsModerator: MenuSection[] = [
    {
        titleKey: 'profile',
        items: [
            { icon: '👤', labelKey: 'moderator.myProfile', path: '/profile' },
        ],
    },
    {
        titleKey: 'moderation',
        items: [
            { icon: '🖼️',    labelKey: 'common.moderationArts',    path: '/admin?section=moderation' },
            { icon: '👨‍🎨', labelKey: 'common.moderationAuthors', path: '/admin?section=moderation' },
        ],
    },
    {
        titleKey: 'support',
        items: [
            { icon: '❓', labelKey: 'moderator.help', path: '/help' },
        ],
    },
];





export const menuSectionsAdmin: MenuSection[] = [
    {
        titleKey: 'adminka',
        items: [
            { icon: '👥', labelKey: 'admin.panel', path: '/admin' },
        ],
    },
    {
        titleKey: 'support',
        items: [
            { icon: '❓', labelKey: 'admin.help',     path: '/help' },
            { icon: '📧', labelKey: 'admin.feedback', path: '/contacts' },
        ],
    },
];