// src/components/shared/ProfileScreen/NotificationCard/NotificationCard.tsx
import { X } from 'lucide-react';
import './NotificationCard.scss';

interface NotificationCardProps {
    icon: any;
    title: string;
    description: string;
    time: string;
    unread?: boolean;
    onClick?: () => void;
    onDelete?: () => void;
}

const NotificationCard = ({
    icon,
    title,
    description,
    time,
    unread = true,
    onClick,
    onDelete,
}: NotificationCardProps) => {
    return (
        <div
            className={`notification-card ${
                unread ? 'notification-card--unread' : ''
            }`}
            onClick={onClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') onClick?.();
            }}
        >
            <div className="notification-card__icon">{icon}</div>

            <div className="notification-card__content">
                <h3 className="notification-card__title">{title}</h3>
                <p className="notification-card__description">{description}</p>
            </div>

            <div className="notification-card__meta">
                <span className="notification-card__time">{time}</span>

                {onDelete && (
                    <button
                        type="button"
                        className="notification-card__delete"
                        aria-label="Delete notification"
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete();
                        }}
                    >
                        <X size={16} />
                    </button>
                )}
            </div>
        </div>
    );
};

export default NotificationCard;