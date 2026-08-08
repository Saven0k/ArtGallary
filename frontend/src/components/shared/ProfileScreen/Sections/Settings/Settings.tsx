// Settings.tsx
import { KeyRound, Mail, Trash2 } from "lucide-react";
import { profileTranslations } from "../../lang";
import "./Settings.scss";
import { useLanguage } from "../../../../../hooks/useLanguage";

interface SettingsProps {
    id: number;
    role: string;
}

const Settings = ({ id, role }: SettingsProps) => {
    const { language } = useLanguage();
    const t = profileTranslations[language].settings;

    // Используем id и role для получения данных
    console.log("Settings for user:", id, role);

    const items = [
        { icon: <KeyRound size={22} />, title: t.items[0].title, description: t.items[0].description },
        { icon: <Mail size={22} />, title: t.items[1].title, description: t.items[1].description },
        { icon: <Trash2 size={22} />, title: t.items[2].title, description: t.items[2].description, danger: true },
    ];

    return (
        <section className="profile-settings">
            <header className="profile-settings__header">
                <h2 className="profile-settings__title">{t.title}</h2>
                <p className="profile-settings__subtitle">{t.subtitle}</p>
            </header>

            <div className="profile-settings__list">
                {items.map((item, index) => (
                    <button
                        key={index}
                        type="button"
                        className={`profile-settings__item ${item.danger ? "profile-settings__item--danger" : ""}`}
                    >
                        <div className={`profile-settings__icon ${item.danger ? "profile-settings__icon--danger" : ""}`}>
                            {item.icon}
                        </div>
                        <div className="profile-settings__content">
                            <h3>{item.title}</h3>
                            <p>{item.description}</p>
                        </div>
                    </button>
                ))}
            </div>
        </section>
    );
};

export default Settings;