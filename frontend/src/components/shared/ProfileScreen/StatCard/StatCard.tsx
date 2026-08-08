import "./StatCard.scss";

interface StatCardProps {
    key: number;
    icon: any;
    value: string | number;
    label: string;
}

const StatCard = ({
    key,
    icon,
    value,
    label
}: StatCardProps) => {
    return (
        <article className="stat-card" key={key}>

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

            </div>

        </article>
    );
};

export default StatCard;