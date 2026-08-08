import "./ProfileSidebar.scss";
import { NotificationIcon, LockIcon, SubscriptionsIcon, StatIcon, SettingsIcon, LikeIcon } from "../icons/icons";
import type { UserRole } from "../../../../api/users/main.api";

export type ProfileSection =
    | "personal"
    | "notifications"
    | "statistics"
    | "likes"
    | "subscriptions"
    | "settings";

interface ProfileSidebarProps {
    active: ProfileSection;
    onChange: (section: ProfileSection) => void;
    role: UserRole;
}

const ProfileSidebar = ({
    active,
    onChange,
    role,
}: ProfileSidebarProps) => {
    const items: {
        id: ProfileSection;
        title: string;
        icon: React.FC<{ className?: string }>;
    }[] = [
        {
            id: "personal",
            title: "Личная информация",
            icon: LockIcon,
        },
        {
            id: "statistics",
            title: "Статистика",
            icon: StatIcon
        },
        {
            id: "notifications",
            title: "Уведомления",
            icon: NotificationIcon
        },
        {
            id: "likes",
            title: "Мои лайки",
            icon: LikeIcon
        },
        {
            id: "subscriptions",
            title: "Мои подписки",
            icon: NotificationIcon,
            // icon: SubscriptionsIcon
        },
        {
            id: "settings",
            title: "Настройки",
            icon: SettingsIcon
        },
    ];

    return (
        <aside className="profile-sidebar">
            {items.map((item) => {
                const IconComponent = item.icon;
                return (
                    <button
                        key={item.id}
                        type="button"
                        onClick={() => onChange(item.id)}
                        className={`profile-sidebar__item ${active === item.id
                            ? "profile-sidebar__item--active"
                            : ""
                            }`}
                    >
                        <IconComponent className="profile-sidebar__icon" />
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