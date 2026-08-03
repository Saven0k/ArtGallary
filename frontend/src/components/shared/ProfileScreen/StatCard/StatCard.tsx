import "./StatCard.css";

interface StatCardProps {
    icon: string;
    value: string | number;
    label: string;
    trend?: string;
    positive?: boolean;
}

const StatCard = ({
    icon,
    value,
    label,
    trend,
    positive = true,
}: StatCardProps) => {
    return (
        <article className="stat-card">

            <div className="stat-card__icon">
                {icon}
            </div>

            <div className="stat-card__content">

                <h3 className="stat-card__value">
                    {value}
                </h3>

                <p className="stat-card__label">
                    {label}
                </p>

                {trend && (
                    <span
                        className={`stat-card__trend ${
                            positive
                                ? "stat-card__trend--positive"
                                : "stat-card__trend--negative"
                        }`}
                    >
                        {trend}
                    </span>
                )}

            </div>

        </article>
    );
};

export default StatCard;