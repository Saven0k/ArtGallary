// src/components/ProfileSideBar/sections.ts
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
        titleKey: "profile",
        items: [
            { icon: "👤", labelKey: "artist.myProfile", path: "/profile" }
        ]
    },
    {
        titleKey: "arts",
        items: [
            { icon: "🖼️", labelKey: "artist.myPaintings", path: "/arts/my" },
            { icon: "🎨", labelKey: "artist.addPainting", path: "/arts/my/new" },
            { icon: "🎨", labelKey: "Лайки по работам", path: "/arts/my/likes" },
            { icon: "🎨", labelKey: "Подписки на авторов", path: "/authors/my/subs" },
            { icon: "🎨", labelKey: "Лайка по авторам", path: "/authors/my/likes" },
        ]
    },
    {
        titleKey: "support",
        items: [
            { icon: "❓", labelKey: "artist.help", path: "/help" }
        ]
    }
];

export const menuSectionsUser: MenuSection[] = [
    {
        titleKey: "profile",
        items: [
            { icon: "👤", labelKey: "user.myProfile", path: "/profile" }
        ]
    },
    {
        titleKey: "paintings",
        items: [
            { icon: "🖼️", labelKey: "Лайки по работам", path: "/arts/my/likes" },
            { icon: "🖼️", labelKey: "Лайки по авторам", path: "/authors/my/likes" },
            { icon: "🖼️", labelKey: "Подписки на авторов", path: "/authors/my/subs" },
        ],
    },
    {
        titleKey: "support",
        items: [
            { icon: "❓", labelKey: "user.help", path: "/help" }
        ]
    }
];

export const menuSectionsModerator: MenuSection[] = [
    {
        titleKey: "profile",
        items: [
            { icon: "👤", labelKey: "moderator.myProfile", path: "/profile" }
        ]
    },
    {
        titleKey: "moderation",
        items: [
            { icon: "🖼️", labelKey: "Модерация работ", path: "/moderation/arts" },
            { icon: "👨‍🎨", labelKey: "Модерация авторов", path: "/moderation/authors" }
        ]
    },
    {
        titleKey: "support",
        items: [
            { icon: "❓", labelKey: "moderator.help", path: "/help" },
        ]
    }
];

export const menuSectionsAdmin: MenuSection[] = [
    {
        titleKey: "paintings",
        items: [
            { icon: "⭐", labelKey: "Модерация артов", path: "/admin/moderation/arts" },
            { icon: "📋", labelKey: "Управление артами", path: "/admin/arts" },
            { icon: "🖼️", labelKey: "Лайки по работам", path: "/arts/my/likes" },
        ],
    },
    {
        titleKey: "authors",
        items: [
            { icon: "🖼️", labelKey: "Лайки по авторам", path: "/authors/my/likes" },
            { icon: "🖼️", labelKey: "Подписки на авторов", path: "/authors/my/subs" },

            { icon: "⭐", labelKey: "Модерация авторов", path: "/admin/moderation/authors" },
            { icon: "📋", labelKey: "Управление авторами", path: "/admin/authors" }
        ]
    },
    {
        titleKey: "users",
        items: [
            { icon: "👥", labelKey: "Управление пользователями", path: "/admin/users" },
            { icon: "👥", labelKey: "Управление модераторами", path: "/admin/moderatiors" },
        ]
    },
    {
        titleKey: "artTypes",
        items: [
            { icon: "👥", labelKey: "Работа с типами работ", path: "/admin/art-types" }
        ]
    },
    {
        titleKey: "Professions",
        items: [
            { icon: "👥", labelKey: "Управление профессиями", path: "/admin/professions" }
        ]
    },
    {
        titleKey: "Events",
        items: [
            { icon: "👥", labelKey: "Управление событиями", path: "/admin/events" }
        ]
    }  ,
    {
        titleKey: "Styles",
        items: [
            { icon: "👥", labelKey: "Управление стилями", path: "/admin/styles" }
        ]
    },
    {
        titleKey: "support",
        items: [
            { icon: "❓", labelKey: "admin.help", path: "/help" },
            { icon: "📧", labelKey: "admin.feedback", path: "/contacts" }
        ]
    }
];