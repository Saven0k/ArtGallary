// Notifications.tsx
import { Heart, UserPlus, BadgeCheck } from "lucide-react";
import { profileTranslations } from "../../lang";
import NotificationCard from "../../NotificationCard/NotificationCard";
import "./Notifications.scss";
import { useLanguage } from "../../../../../hooks/useLanguage";

interface NotificationsProps {
    id: number;
    role: string;
}

const Notifications = ({ id, role }: NotificationsProps) => {
    const { language } = useLanguage();
    const t = profileTranslations[language].notifications;

    // Используем id и role для получения данных
    console.log("Notifications for user:", id, role);

    const notifications = t.items.map((item, index) => {
        const icons = [
            <BadgeCheck size={22} />,
            <Heart size={22} />,
            <UserPlus size={22} />,
        ];
        return {
            id: index + 1,
            icon: icons[index % icons.length],
            title: item.title,
            description: item.description,
            time: item.time,
        };
    });

    return (
        <section className="notifications">
            <header className="notifications__header">
                <h2 className="notifications__title">{t.title}</h2>
                <p className="notifications__subtitle">{t.subtitle}</p>
            </header>

            <div className="notifications__list">
                {notifications.map((notification) => (
                    <NotificationCard key={notification.id} {...notification} />
                ))}
            </div>
        </section>
    );
};

export default Notifications;