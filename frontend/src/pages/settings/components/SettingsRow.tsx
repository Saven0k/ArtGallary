// src/pages/Settings/components/SettingsRow.tsx
import "./SettingsRow.scss";

interface SettingsRowProps {
    title: string;
    subtitle?: string;
    children?: any;
}

const SettingsRow = ({
    title,
    subtitle,
    children,
}: SettingsRowProps) => {
    return (
        <div className="settings-row">
            <div className="settings-row__content">
                <h4 className="settings-row__title">{title}</h4>
                {subtitle && <p className="settings-row__subtitle">{subtitle}</p>}
            </div>

            {children && (
                <div className="settings-row__action">
                    {children}
                </div>
            )}
        </div>
    );
};

export default SettingsRow;