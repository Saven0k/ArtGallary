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

export const menuSectionsArtist: MenuSection[] = [
    {
        titleKey: "profile",
        items: [
            { icon: "👤", labelKey: "artist.myProfile", path: "/profile" }
        ]
    },
    {
        titleKey: "paintings",
        items: [
            { icon: "🖼️", labelKey: "artist.myPaintings", path: "/arts/my" },
            { icon: "🎨", labelKey: "artist.addPainting", path: "/arts/my/new" }
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
            { icon: "🖼️", labelKey: "user.likedPaintings", path: "/profile/liked-arts" }
            // { icon: "🖼️", labelKey: "user.likedPaintings", path: "/profile/liked-arts" } Сделай лайки артистов
        ]
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
            { icon: "🖼️", labelKey: "moderator.moderationPaintings", path: "/moderation/arts" },
            { icon: "👨‍🎨", labelKey: "moderator.moderationArtists", path: "/moderation/artists" }
        ]
    },
    {
        titleKey: "support",
        items: [
            { icon: "❓", labelKey: "moderator.help", path: "/help" },
            { icon: "📧", labelKey: "moderator.feedback", path: "/contacts" }
        ]
    }
];

export const menuSectionsAdmin: MenuSection[] = [
    {
        titleKey: "paintings",
        items: [
            { icon: "⭐", labelKey: "admin.moderation", path: "/admin/moderation/arts" },
            { icon: "📋", labelKey: "admin.allPaintings", path: "/admin/arts" }
        ]
    },
    {
        titleKey: "artists",
        items: [
            { icon: "⭐", labelKey: "admin.moderation", path: "/admin/moderation/artists" },
            { icon: "📋", labelKey: "admin.allArtists", path: "/admin/artists" }
        ]
    },
    {
        titleKey: "users",
        items: [
            { icon: "👥", labelKey: "admin.allUsers", path: "/admin/users" }
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