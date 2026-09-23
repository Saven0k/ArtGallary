// src/pages/Profile/components/ProfileContent/Settings.tsx
import { useState } from 'react';
import { KeyRound, Mail, Trash2 } from 'lucide-react';
import { profileTranslations } from '../../lang';
import { useLanguage } from '../../../../../hooks/useLanguage';
import ChangePasswordModal from '../../ChangePasswordModal/ChangePasswordModal';
import './Settings.scss';

interface SettingsProps {
    id: number;
    role: string;
}

const Settings = ({ id, role }: SettingsProps) => {
    const { language } = useLanguage();
    const t = profileTranslations[language].settings;

    const [openChangePassword, setOpenChangePassword] = useState(false);

    const items = [
        {
            icon: <KeyRound size={22} />,
            title: t.items[0].title,
            description: t.items[0].description,
            onClick: () => setOpenChangePassword(true),
        },
        {
            icon: <Mail size={22} />,
            title: t.items[1].title,
            description: t.items[1].description,
            onClick: () => {
                // TODO: change email
            },
        },
        {
            icon: <Trash2 size={22} />,
            title: t.items[2].title,
            description: t.items[2].description,
            danger: true,
            onClick: () => {
                // TODO: delete account
            },
        },
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
                        className={`profile-settings__item ${
                            item.danger ? 'profile-settings__item--danger' : ''
                        }`}
                        onClick={item.onClick}
                    >
                        <div
                            className={`profile-settings__icon ${
                                item.danger ? 'profile-settings__icon--danger' : ''
                            }`}
                        >
                            {item.icon}
                        </div>
                        <div className="profile-settings__content">
                            <h3>{item.title}</h3>
                            <p>{item.description}</p>
                        </div>
                    </button>
                ))}
            </div>

            {openChangePassword && (
                <ChangePasswordModal
                    onClose={() => setOpenChangePassword(false)}
                    onSuccess={() => {
                        // опционально: показать тост «Пароль изменён»
                    }}
                />
            )}
        </section>
    );
};

export default Settings;