import "./ProfileStats.css";

interface ProfileStatsProps {
    icon: string;
    title: string;
    value: string | number;
    change?: string;
    positive?: boolean;
}

const ProfileStats = ({
    icon,
    title,
    value,
    change,
    positive = true,
}: ProfileStatsProps) => {
    return (
        <article className="profile-stats">

            <div className="profile-stats__icon">
                {icon}
            </div>

            <div className="profile-stats__content">

                <span className="profile-stats__title">
                    {title}
                </span>

                <h3 className="profile-stats__value">
                    {value}
                </h3>

                {change && (
                    <span
                        className={`profile-stats__change ${
                            positive
                                ? "profile-stats__change--positive"
                                : "profile-stats__change--negative"
                        }`}
                    >
                        {change}
                    </span>
                )}

            </div>

        </article>
    );
};

export default ProfileStats;