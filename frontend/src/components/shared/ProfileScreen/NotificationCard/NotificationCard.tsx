import "./NotificationCard.css";

interface NotificationCardProps {
    icon: string;
    title: string;
    description: string;
    time: string;
    unread?: boolean;
    onClick?: () => void;
}

const NotificationCard = ({
    icon,
    title,
    description,
    time,
    unread = true,
    onClick,
}: NotificationCardProps) => {
    return (
        <button
            type="button"
            className={`notification-card ${
                unread ? "notification-card--unread" : ""
            }`}
            onClick={onClick}
        >
            <div className="notification-card__icon">
                {icon}
            </div>

            <div className="notification-card__content">
                <h3 className="notification-card__title">
                    {title}
                </h3>

                <p className="notification-card__description">
                    {description}
                </p>
            </div>

            <span className="notification-card__time">
                {time}
            </span>
        </button>
    );
};

export default NotificationCard;