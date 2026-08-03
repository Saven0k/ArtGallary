import React from 'react';
import { useLanguage } from '../../../../hooks/useLanguage';
import { profileSidebarTranslations } from '../lang';
import { Benefits } from './Benefits';

interface GuestHeaderProps {
    onNavigate: (path: string) => void;
    onClose: () => void;
}

export const GuestHeader: React.FC<GuestHeaderProps> = ({ onNavigate, onClose }) => {
    const { language } = useLanguage();
    const lang = profileSidebarTranslations[language];

    const handleNavigation = (path: string) => {
        onNavigate(path);
        onClose();
    };

    return (
        <div className="sidebarProfile__guest-content">
            <div className="sidebarProfile__guest-header">
                <div className="sidebarProfile__guest-icon">🎨</div>
                <h2 className="sidebarProfile__guest-title">{lang.sidebar.guest.title}</h2>
            </div>
            <div className="sidebarProfile__guest-message">
                <p className="sidebarProfile__guest-subtitle">
                    {lang.sidebar.guest.subtitle || 'Войдите в аккаунт'}
                </p>
                <p className="sidebarProfile__guest-text">
                    {lang.sidebar.guest.description || 'Чтобы получить доступ ко всем функциям галереи'}
                </p>
            </div>
            <div className="sidebarProfile__guest-actions">
                <button 
                    onClick={() => handleNavigation('/login')} 
                    className="sidebarProfile__login-btn"
                >
                    {lang.sidebar.guest.login || 'Войти / Зарегистрироваться'}
                </button>
                <button 
                    onClick={() => handleNavigation('/register')} 
                    className="sidebarProfile__guest-btn"
                >
                    {lang.sidebar.guest.becomeArtist || 'Стать художником'}
                </button>
            </div>
            <Benefits />
        </div>
    );
};