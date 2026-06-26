import { useState, useEffect } from 'react';
import { settingsTranslations } from './lang.ts';
import './Settings.css';
import { useLanguage } from '../../../../context/LanguageContext.tsx';

export const Settings = () => {
    const { language, setLanguage } = useLanguage();
    const [notifications, setNotifications] = useState(true);
    const [emailNotifications, setEmailNotifications] = useState(false);
    
    const lang = settingsTranslations[language];

    // Загрузка настроек из localStorage при монтировании
    useEffect(() => {
        const savedNotifications = localStorage.getItem('notifications');
        const savedEmailNotifications = localStorage.getItem('emailNotifications');

        if (savedNotifications !== null) setNotifications(savedNotifications === 'true');
        if (savedEmailNotifications !== null) setEmailNotifications(savedEmailNotifications === 'true');
    }, []);

    // Сохранение настроек
    const saveNotifications = (value: boolean) => {
        setNotifications(value);
        localStorage.setItem('notifications', String(value));
    };

    const saveEmailNotifications = (value: boolean) => {
        setEmailNotifications(value);
        localStorage.setItem('emailNotifications', String(value));
    };

    const resetSettings = () => {
        if (window.confirm(lang.management.resetConfirm)) {
            setLanguage('ru');
            setNotifications(true);
            setEmailNotifications(false);
            
            localStorage.setItem('language', 'ru');
            localStorage.setItem('notifications', 'true');
            localStorage.setItem('emailNotifications', 'false');
            
            alert(lang.management.resetSuccess);
        }
    };

    return (
        <div className="settings">
            <div className="settings__header">
                <h1 className="settings__title">{lang.title}</h1>
                <p className="settings__subtitle">{lang.subtitle}</p>
            </div>

            <div className="settings__content">
                {/* Язык */}
                <div className="settings__section">
                    <div className="settings__section-header">
                        <span className="settings__section-icon">🌐</span>
                        <h2 className="settings__section-title">{lang.language.title}</h2>
                    </div>
                    
                    <div className="settings__option">
                        <div className="settings__option-info">
                            <div className="settings__option-label">{lang.language.label}</div>
                            <div className="settings__option-description">{lang.language.description}</div>
                        </div>
                        <div className="settings__lang-buttons">
                            <button
                                className={`settings__lang-btn ${language === 'ru' ? 'active' : ''}`}
                                onClick={() => setLanguage('ru')}
                            >
                                {lang.language.ru}
                            </button>
                            <button
                                className={`settings__lang-btn ${language === 'en' ? 'active' : ''}`}
                                onClick={() => setLanguage('en')}
                            >
                                {lang.language.en}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Уведомления */}
                <div className="settings__section">
                    <div className="settings__section-header">
                        <span className="settings__section-icon">🔔</span>
                        <h2 className="settings__section-title">{lang.notifications.title}</h2>
                    </div>
                    
                    <div className="settings__option">
                        <div className="settings__option-info">
                            <div className="settings__option-label">{lang.notifications.push.label}</div>
                            <div className="settings__option-description">{lang.notifications.push.description}</div>
                        </div>
                        <label className="settings__switch">
                            <input
                                type="checkbox"
                                checked={notifications}
                                onChange={(e) => saveNotifications(e.target.checked)}
                            />
                            <span className="settings__slider"></span>
                        </label>
                    </div>

                    <div className="settings__option">
                        <div className="settings__option-info">
                            <div className="settings__option-label">{lang.notifications.email.label}</div>
                            <div className="settings__option-description">{lang.notifications.email.description}</div>
                        </div>
                        <label className="settings__switch">
                            <input
                                type="checkbox"
                                checked={emailNotifications}
                                onChange={(e) => saveEmailNotifications(e.target.checked)}
                            />
                            <span className="settings__slider"></span>
                        </label>
                    </div>
                </div>

                {/* Сброс настроек */}
                <div className="settings__section">
                    <div className="settings__section-header">
                        <span className="settings__section-icon">⚙️</span>
                        <h2 className="settings__section-title">{lang.management.title}</h2>
                    </div>

                    <button className="settings__reset-btn" onClick={resetSettings}>
                        {lang.management.resetBtn}
                    </button>
                </div>
            </div>
        </div>
    );
};