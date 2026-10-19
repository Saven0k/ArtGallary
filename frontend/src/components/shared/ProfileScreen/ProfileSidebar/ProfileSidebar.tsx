
import { useEffect, useState } from "react";
import "./ProfileSidebar.scss";
import {
    NotificationIcon,
    LockIcon,
    StatIcon,
    SettingsIcon,
    LikeIcon,
} from "../icons/icons";
import { useLanguage } from '../../../../hooks/useLanguage';
import { profileTranslations } from '../lang';
import type { UserRole } from "../../../../api/users/main.api";
import { getUnreadCount } from "../../../../api/notification/main.api";

export type ProfileSection =
    | "personal"
    | "notifications"
    | "statistics"
    | "likes"
    | "subscriptions"
    | "history"
    | "cart"
    | "settings"
    | "tariff";

interface ProfileSidebarProps {
    active: ProfileSection;
    onChange: (section: ProfileSection) => void;
    role: UserRole;
}

interface SidebarItem {
    id: ProfileSection;
    title: string;
    icon: React.FC<{ className?: string }>;

    authorOnly?: boolean;
}

const ProfileSidebar = ({
    active,
    onChange,
    role,
}: ProfileSidebarProps) => {
    const { language } = useLanguage();
    const labels = profileTranslations[language].sidebar;
    const [unreadCount, setUnreadCount] = useState<number>(0);


    useEffect(() => {
        let alive = true;

        const fetchUnread = async () => {
            const res = await getUnreadCount();
            if (alive && res) setUnreadCount(res.count);
        };

        fetchUnread();


        const interval = setInterval(fetchUnread, 30_000);

        return () => {
            alive = false;
            clearInterval(interval);
        };
    }, []);



    useEffect(() => {
        if (active !== "notifications") return;

        const t = setTimeout(async () => {
            const res = await getUnreadCount();
            if (res) setUnreadCount(res.count);
        }, 1500);

        return () => clearTimeout(t);
    }, [active]);

    const items: SidebarItem[] = [
        {
            id: "personal",
            title: labels.personal,
            icon: LockIcon,
        },
        {
            id: "statistics",
            title: labels.statistics,
            icon: StatIcon,
            authorOnly: true,
        },
        {
            id: "notifications",
            title: labels.notifications,
            icon: NotificationIcon,
        },
        {
            id: "likes",
            title: labels.likes,
            icon: LikeIcon,
        },
        {
            id: "subscriptions",
            title: labels.subscriptions,
            icon: NotificationIcon,
        },
        {
            id: "tariff",
            title: labels.tariff,
            icon: SettingsIcon,
            authorOnly: true,
        },
        {
            id: "cart",
            title: labels.cart,
            icon: SettingsIcon,
        },
        { id: "history", title: labels.history, icon: SettingsIcon },
        {
            id: "settings",
            title: labels.settings,
            icon: SettingsIcon,
        },
    ];

    const isAuthor = role === "author";

    const visibleItems = items.filter(
        (item) => !item.authorOnly || isAuthor,
    );

    return (
        <aside className="profile-sidebar">
            {visibleItems.map((item) => {
                const IconComponent = item.icon;
                const isNotifications = item.id === "notifications";
                const showBadge = isNotifications && unreadCount > 0;

                return (
                    <button
                        key={item.id}
                        type="button"
                        onClick={() => onChange(item.id)}
                        className={`profile-sidebar__item ${
                            active === item.id
                                ? "profile-sidebar__item--active"
                                : ""
                        }`}
                    >
                        <span className="profile-sidebar__icon-wrap">
                            <IconComponent className="profile-sidebar__icon" />

                            {showBadge && (
                                <span
                                    className="profile-sidebar__badge"
                                    aria-label={labels.unread.replace("{count}", String(unreadCount))}
                                >
                                    {unreadCount > 99 ? "99+" : unreadCount}
                                </span>
                            )}
                        </span>

                        <span className="profile-sidebar__text">
                            {item.title}
                        </span>
                    </button>
                );
            })}
        </aside>
    );
};

export default ProfileSidebar;