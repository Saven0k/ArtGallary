// src/components/ProfileSideBar/components/GuestHeader.tsx
import React from 'react';
import { useLanguage } from '../../../../hooks/useLanguage';
import { sidebarTranslations } from '../lang';

interface GuestHeaderProps {
    onNavigate: (path: string) => void;
    onClose: () => void;
}

export const GuestHeader: React.FC<GuestHeaderProps> = ({ onNavigate, onClose }) => {
    const { language } = useLanguage();
    const t = sidebarTranslations[language].guest;

    const handleLogin = () => {
        onNavigate('/login');
        onClose();
    };

    const handleRegister = () => {
        onNavigate('/register');
        onClose();
    };

    return (
        <div className="sidebarProfile__guest">
            <h3 className="sidebarProfile__guest-title">{t.title}</h3>
            <p className="sidebarProfile__guest-subtitle">{t.subtitle}</p>
            <div className="sidebarProfile__guest-actions">
                <button
                    className="sidebarProfile__guest-btn sidebarProfile__guest-btn--primary"
                    onClick={handleLogin}
                >
                    {t.login}
                </button>
                <button
                    className="sidebarProfile__guest-btn sidebarProfile__guest-btn--secondary"
                    onClick={handleRegister}
                >
                    {t.register}
                </button>
            </div>
        </div>
    );
};