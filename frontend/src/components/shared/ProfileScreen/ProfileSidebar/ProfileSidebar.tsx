// src/pages/Profile/components/ProfileSidebar/ProfileSidebar.tsx

import {
    User,
    Bell,
    BarChart3,
    Settings,
} from "lucide-react";

import "./ProfileSidebar.css";

export type ProfileSection =
    | "personal"
    | "notifications"
    | "statistics"
    | "settings";

interface ProfileSidebarProps {
    active: ProfileSection;
    onChange: (section: ProfileSection) => void;
}

const ProfileSidebar = ({
    active,
    onChange,
}: ProfileSidebarProps) => {
    const items = [
        {
            id: "personal",
            title: "Личная информация",
            icon: <User size={20} />,
        },
        {
            id: "notifications",
            title: "Уведомления",
            icon: <Bell size={20} />,
        },
        {
            id: "statistics",
            title: "Статистика",
            icon: <BarChart3 size={20} />,
        },
        {
            id: "settings",
            title: "Настройки",
            icon: <Settings size={20} />,
        },
    ] as const;

    return (
        <aside className="profile-sidebar">

            {items.map((item) => (
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
                    <span className="profile-sidebar__icon">
                        {item.icon}
                    </span>

                    <span className="profile-sidebar__text">
                        {item.title}
                    </span>
                </button>
            ))}

        </aside>
    );
};

export default ProfileSidebar;