import "./SettingsCard.scss";

interface SettingsCardProps {
    title: string;
    icon: any;
    children: any;
}

const SettingsCard = ({
    title,
    icon,
    children,
}: SettingsCardProps) => {
    return (
        <section className="settings-card">
            <header className="settings-card__header">
                <div className="settings-card__icon">
                    {icon}
                </div>

                <h2 className="settings-card__title">
                    {title}
                </h2>
            </header>

            <div className="settings-card__divider" />

            <div className="settings-card__content">
                {children}
            </div>
        </section>
    );
};

export default SettingsCard;