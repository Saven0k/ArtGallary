import { Bell, CircleHelp, Gem, Heart, Image, LayoutDashboard, Mail, Palette, Plus, UserRound, type LucideIcon } from 'lucide-react';


export interface MenuItem {
    icon: LucideIcon;

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
            { icon: UserRound, labelKey: 'author.myProfile', path: '/profile' },
        ],
    },
    {
        titleKey: 'activity',
        items: [
            { icon: Heart, labelKey: 'common.likesArts',     path: '/profile?section=likes' },
            { icon: Bell, labelKey: 'common.subscriptions', path: '/profile?section=subscriptions' },
        ],
    },
    {
        titleKey: 'account',
        items: [
            { icon: Mail, labelKey: 'common.notifications', path: '/profile?section=notifications' },
            { icon: Gem, labelKey: 'common.tariff',        path: '/profile?section=tariff' },
        ],
    },
    {
        titleKey: 'arts',
        items: [
            { icon: Plus, labelKey: 'author.addPainting', path: '/arts/new' },
            { icon: Image, labelKey: 'author.myPaintings', path: '/arts/my' },
        ],
    },
    {
        titleKey: 'support',
        items: [
            { icon: CircleHelp, labelKey: 'author.help', path: '/help' },
        ],
    },
];





export const menuSectionsUser: MenuSection[] = [
    {
        titleKey: 'profile',
        items: [
            { icon: UserRound, labelKey: 'user.myProfile', path: '/profile' },
        ],
    },
    {
        titleKey: 'features',
        items: [
            { icon: Heart, labelKey: 'common.likesArts',     path: '/profile?section=likes' },
            { icon: Bell, labelKey: 'common.subscriptions', path: '/profile?section=subscriptions' },
        ],
    },
    {
        titleKey: 'support',
        items: [
            { icon: CircleHelp, labelKey: 'user.help', path: '/help' },
        ],
    },
];





export const menuSectionsModerator: MenuSection[] = [
    {
        titleKey: 'profile',
        items: [
            { icon: UserRound, labelKey: 'moderator.myProfile', path: '/profile' },
        ],
    },
    {
        titleKey: 'moderation',
        items: [
            { icon: Image,    labelKey: 'common.moderationArts',    path: '/admin?section=moderation&tab=arts' },
            { icon: Palette, labelKey: 'common.moderationAuthors', path: '/admin?section=moderation&tab=authors' },
        ],
    },
    {
        titleKey: 'support',
        items: [
            { icon: CircleHelp, labelKey: 'moderator.help', path: '/help' },
        ],
    },
];





export const menuSectionsAdmin: MenuSection[] = [
    {
        titleKey: 'adminka',
        items: [
            { icon: LayoutDashboard, labelKey: 'admin.panel', path: '/admin' },
        ],
    },
    {
        titleKey: 'support',
        items: [
            { icon: CircleHelp, labelKey: 'admin.help',     path: '/help' },
            { icon: Mail, labelKey: 'admin.feedback', path: '/contacts' },
        ],
    },
];
