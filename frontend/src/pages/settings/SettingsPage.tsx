import {
    Globe,
    Bell,
    Settings2,
} from "lucide-react";

import SettingsCard from "./components/SettingsCard";
import SettingsRow from "./components/SettingsRow";
import LanguageSwitcher from "./components/LanguageSwitcher";
import Toggle from "./components/Toggle";

import { useLanguage } from "../../hooks/useLanguage";
import { useSettings } from "../../hooks/useSettings";
import { settingsTranslations } from "./lang";
import { notificationSettingsCopy } from './lang';
import { useAuth } from '../../hooks/useAuth';
import { Link } from 'react-router-dom';

import "./SettingsPage.scss";

const SettingsPage = () => {
    const { language } = useLanguage();
    const t = settingsTranslations[language];
    const copy = notificationSettingsCopy[language];
    const { user } = useAuth();
    const {
        emailEnabled,
        pushEnabled,
        setEmailEnabled,
        setPushEnabled,
        resetSettings,
        loading, busy, feedback, mailConfigured, pushConfigured, supported, permission, browserConnected, testNotification,
    } = useSettings();
    const disabled = !user || loading || busy;

    return (
        <main className="settings-page">
            <div className="settings-page__container">

                <header className="settings-page__header">
                    <h3 className="settings-page__title">{t.title}</h3>
                    <p className="settings-page__subtitle">{t.subtitle}</p>
                </header>

                <div className="settings-page__content">

                    <SettingsCard
                        icon={<Globe size={28} />}
                        title={t.cards.language.title}
                    >
                        <LanguageSwitcher />
                    </SettingsCard>

                    <SettingsCard
                        icon={<Bell size={28} />}
                        title={t.cards.notifications.title}
                    >
                        <p className="notification-settings__intro">{copy.intro}</p>
                        {!user && <p className="notification-settings__notice">{copy.login} <Link to="/login">{copy.signIn}</Link></p>}
                        <SettingsRow
                            title={t.cards.notifications.rows.email.title}
                            subtitle={t.cards.notifications.rows.email.subtitle}
                        >
                            <Toggle
                                label={t.cards.notifications.rows.email.title}
                                checked={emailEnabled}
                                onChange={setEmailEnabled}
                                disabled={disabled || (!mailConfigured && !emailEnabled)}
                            />
                        </SettingsRow>
                        <div className="notification-settings__channel">
                            <span className={`notification-settings__status ${emailEnabled ? 'is-active' : ''}`}>{!user ? copy.mailHint : !mailConfigured ? copy.mailUnavailable : emailEnabled ? copy.active : copy.inactive}</span>
                            <button type="button" className="notification-settings__test" disabled={disabled || !emailEnabled || !mailConfigured} onClick={() => void testNotification('email')}>{copy.test}</button>
                        </div>

                        <SettingsRow
                            title={t.cards.notifications.rows.push.title}
                            subtitle={t.cards.notifications.rows.push.subtitle}
                        >
                            <Toggle
                                label={t.cards.notifications.rows.push.title}
                                checked={pushEnabled}
                                onChange={setPushEnabled}
                                disabled={disabled || (!supported && !pushEnabled) || (!pushConfigured && !pushEnabled)}
                            />
                        </SettingsRow>
                        <div className="notification-settings__channel">
                            <span className={`notification-settings__status ${pushEnabled && browserConnected ? 'is-active' : ''}`}>{!supported ? copy.unsupported : user && !pushConfigured ? copy.pushUnavailable : pushEnabled ? browserConnected ? copy.active : copy.deviceInactive : copy.inactive}</span>
                            {pushEnabled && !browserConnected && supported && pushConfigured && permission !== 'denied'
                                ? <button type="button" className="notification-settings__test" disabled={disabled} onClick={() => void setPushEnabled(true)}>{copy.connect}</button>
                                : <button type="button" className="notification-settings__test" disabled={disabled || !pushEnabled || !browserConnected} onClick={() => void testNotification('push')}>{copy.test}</button>}
                        </div>
                        <p className="notification-settings__hint">{permission === 'denied' ? copy.denied : copy.pushHint}</p>
                        <div aria-live="polite" className={`notification-settings__feedback ${feedback && !['saved', 'testSent'].includes(feedback) ? 'is-error' : ''}`}>
                            {loading ? copy.loading : busy ? copy.busy : feedback ? copy[feedback] : ''}
                        </div>
                        <div className="notification-settings__previews" aria-label={copy.preview}>
                            <div className="notification-settings__preview notification-settings__preview--mail">
                                <span className="notification-settings__preview-label">{copy.email} · {copy.preview}</span>
                                <div className="notification-settings__brand">ART GALLERY</div>
                                <strong>{copy.previewTitle}</strong><p>{copy.previewBody}</p>
                                <span className="notification-settings__preview-link">{copy.open}</span>
                            </div>
                            <div className="notification-settings__preview notification-settings__preview--push">
                                <span className="notification-settings__preview-label">{copy.browser} · {copy.preview}</span>
                                <div className="notification-settings__push-content"><span className="notification-settings__monogram" aria-hidden="true">AG</span><div><span className="notification-settings__push-brand">Art Gallery</span><strong>{copy.previewTitle}</strong><p>{copy.previewBody}</p></div></div>
                            </div>
                        </div>
                    </SettingsCard>

                    <SettingsCard
                        icon={<Settings2 size={28} />}
                        title={t.cards.management.title}
                    >
                        <button
                            className="settings-page__reset"
                            type="button"
                            onClick={resetSettings}
                            disabled={disabled}
                        >
                            {t.cards.management.reset}
                        </button>
                    </SettingsCard>

                </div>

            </div>
        </main>
    );
};

export default SettingsPage;
