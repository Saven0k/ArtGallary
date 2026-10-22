import { commonTranslations } from '../../../../../lang';
import { useLanguage } from '../../../../../hooks/useLanguage';
import type { ReactNode } from 'react';
import { notificationsTranslations } from '../lang';

import { X } from 'lucide-react';
import './NotificationCard.scss';

interface NotificationCardProps {
    icon: ReactNode;
    title: string;
    description: string;
    time: string;
    dateTime?: string;
    disabled?: boolean;
    unread?: boolean;
    onClick?: () => void;
    onDelete?: () => void;
}

const NotificationCard = ({
    icon,
    title,
    description,
    time,
    dateTime,
    disabled = false,
    unread = true,
    onClick,
    onDelete,
}: NotificationCardProps) => {
    const { language } = useLanguage();
    return (
        <article
            className={`notification-card ${
                unread ? 'notification-card--unread' : ''
            }`}
        >
            <button
                type="button"
                className="notification-card__open"
                onClick={onClick}
                disabled={disabled}
            >
                <span className="notification-card__icon" aria-hidden="true">
                    {icon}
                </span>
                <span className="notification-card__content">
                    <span className="notification-card__title">{title}</span>
                    <span className="notification-card__description">
                        {description}
                    </span>
                    {unread && (
                        <span className="notification-card__sr-only">
                            {notificationsTranslations[language].unread}
                        </span>
                    )}
                </span>
                <time className="notification-card__time" dateTime={dateTime}>
                    {time}
                </time>
            </button>

            {onDelete && (
                <button
                    type="button"
                    className="notification-card__delete"
                    aria-label={commonTranslations[language].deleteNotification}
                    disabled={disabled}
                    onClick={onDelete}
                >
                    <X size={16} />
                </button>
            )}
        </article>
    );
};

export default NotificationCard;
