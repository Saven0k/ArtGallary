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
            { icon: "👤", labelKey: "artist.myProfile", path: "/profile", badge: null },
        ]
    },
    {
        titleKey: "paintings",
        items: [
            { icon: "🖼️", labelKey: "artist.myPaintings", path: "/arts/my" },
            { icon: "🎨", labelKey: "artist.addPainting", path: "/arts/my/new" },
        ]
    },
    {
        titleKey: "exhibitions",
        items: [
            { icon: "🏛️", labelKey: "artist.myExhibitions", path: "/exhibitions/my" },
            { icon: "🎟️", labelKey: "artist.addExhibition", path: "/exhibitions/my/new" },
        ]
    },
    {
        titleKey: "support",
        items: [
            { icon: "❓", labelKey: "artist.help", path: "/help" },
        ]
    }
];

export const menuSectionsUser: MenuSection[] = [
    {
        titleKey: "profile",
        items: [
            { icon: "👤", labelKey: "user.myProfile", path: "/profile", badge: null },
        ]
    },
    {
        titleKey: "paintings",
        items: [
            { icon: "🖼️", labelKey: "user.likedPaintings", path: "/profile/liked-arts" },
        ]
    },
    {
        titleKey: "exhibitions",
        items: [
            { icon: "🏛️", labelKey: "user.likedExhibitions", path: "/profile/liked-exhibitions" },
            { icon: "👨‍🎨", labelKey: "user.registeredExhibitions", path: "/profile/registered-exhibitions" },
        ]
    },
    {
        titleKey: "support",
        items: [
            { icon: "❓", labelKey: "user.help", path: "/help" },
        ]
    }
];

export const menuSectionsModerator: MenuSection[] = [
    {
        titleKey: "profile",
        items: [
            { icon: "👤", labelKey: "moderator.myProfile", path: "/profile", badge: null },
        ]
    },
    {
        titleKey: "moderation",
        items: [
            { icon: "🖼️", labelKey: "moderator.moderationPaintings", path: "/moderation/arts" },
            { icon: "🏛️", labelKey: "moderator.moderationExhibitions", path: "/moderation/exhibitions" },
            { icon: "👨‍🎨", labelKey: "moderator.moderationArtists", path: "/moderation/artists" },
        ]
    },
    {
        titleKey: "support",
        items: [
            { icon: "❓", labelKey: "moderator.help", path: "/help" },
            { icon: "📧", labelKey: "moderator.feedback", path: "/contacts" },
        ]
    }
];

export const menuSectionsAdmin: MenuSection[] = [
    {
        titleKey: "paintings",
        items: [
            { icon: "⭐", labelKey: "admin.moderation", path: "/admin/moderation/arts" },
            { icon: "📋", labelKey: "admin.allPaintings", path: "/admin/arts" },
        ]
    },
    {
        titleKey: "exhibitions",
        items: [
            { icon: "⭐", labelKey: "admin.moderation", path: "/admin/moderation/exhibitions" },
            { icon: "📋", labelKey: "admin.allExhibitions", path: "/admin/exhibitions" },
        ]
    },
    {
        titleKey: "artists",
        items: [
            { icon: "⭐", labelKey: "admin.moderation", path: "/admin/moderation/artists" },
            { icon: "📋", labelKey: "admin.allArtists", path: "/admin/artists" },
        ]
    },
    {
        titleKey: "users",
        items: [
            { icon: "👥", labelKey: "admin.allUsers", path: "/admin/users" },
        ]
    },
    {
        titleKey: "directories",
        items: [
            { icon: "🏙️", labelKey: "admin.cities", path: "/admin/cities" },
            { icon: "🌍", labelKey: "admin.countries", path: "/admin/countries" },
            { icon: "🎨", labelKey: "admin.genres", path: "/admin/genres" },
            { icon: "🏷️", labelKey: "admin.types", path: "/admin/types" },
        ]
    },
    {
        titleKey: "support",
        items: [
            { icon: "❓", labelKey: "admin.help", path: "/help" },
            { icon: "📧", labelKey: "admin.feedback", path: "/contacts" },
        ]
    }
];

export const menuSectionsGuest: MenuSection[] = [
    {
        titleKey: "paintings",
        items: [
            { icon: "🖼️", labelKey: "guest.likedPaintings", path: "/guest/paintings" },
        ]
    },
    {
        titleKey: "artists",
        items: [
            { icon: "🏛️", labelKey: "guest.likedArtists", path: "/guest/exhibitions" },
        ]
    },
    {
        titleKey: "support",
        items: [
            { icon: "❓", labelKey: "guest.help", path: "/help" },
        ]
    }
];