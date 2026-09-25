// src/components/shared/ProfileScreen/ProfileSidebar/ProfileSidebar.tsx
import { useEffect, useState } from "react";
import "./ProfileSidebar.scss";
import {
    NotificationIcon,
    LockIcon,
    SubscriptionsIcon,
    StatIcon,
    SettingsIcon,
    LikeIcon,
} from "../icons/icons";
import type { UserRole } from "../../../../api/users/main.api";
import { getUnreadCount } from "../../../../api/notification/main.api";

export type ProfileSection =
    | "personal"
    | "notifications"
    | "statistics"
    | "likes"
    | "subscriptions"
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
    /** true — пункт виден только авторам */
    authorOnly?: boolean;
}

const ProfileSidebar = ({
    active,
    onChange,
    role,
}: ProfileSidebarProps) => {
    const [unreadCount, setUnreadCount] = useState<number>(0);

    // Загрузка непрочитанных + периодическое обновление
    useEffect(() => {
        let alive = true;

        const fetchUnread = async () => {
            const res = await getUnreadCount();
            if (alive && res) setUnreadCount(res.count);
        };

        fetchUnread();

        // обновляем каждые 30 секунд
        const interval = setInterval(fetchUnread, 30_000);

        return () => {
            alive = false;
            clearInterval(interval);
        };
    }, []);

    // Отдельный эффект: после перехода на "notifications" даём
    // Notifications.tsx время пометить всё прочитанным и обновляем счётчик
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
            title: "Личная информация",
            icon: LockIcon,
        },
        {
            id: "statistics",
            title: "Статистика",
            icon: StatIcon,
            authorOnly: true,
        },
        {
            id: "notifications",
            title: "Уведомления",
            icon: NotificationIcon,
        },
        {
            id: "likes",
            title: "Мои лайки",
            icon: LikeIcon,
        },
        {
            id: "subscriptions",
            title: "Мои подписки",
            icon: NotificationIcon,
        },
        {
            id: "tariff",
            title: "Тарифный план",
            icon: SettingsIcon,
            authorOnly: true,
        },
        {
            id: "cart",
            title: "Корзина",
            icon: SettingsIcon,
        },
        {
            id: "settings",
            title: "Настройки",
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
                                    aria-label={`${unreadCount} unread`}
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