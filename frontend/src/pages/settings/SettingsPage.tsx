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
import { useSettings } from "../../context/SettingsContext";
import { settingsTranslations } from "./lang";

import "./SettingsPage.css";

const SettingsPage = () => {
    const { language } = useLanguage();
    const t = settingsTranslations[language];
    const {
        emailEnabled,
        pushEnabled,
        setEmailEnabled,
        setPushEnabled,
        resetSettings,
    } = useSettings();

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
                        <SettingsRow
                            title={t.cards.notifications.rows.email.title}
                            subtitle={t.cards.notifications.rows.email.subtitle}
                        >
                            <Toggle
                                checked={emailEnabled}
                                onChange={setEmailEnabled}
                            />
                        </SettingsRow>

                        <SettingsRow
                            title={t.cards.notifications.rows.push.title}
                            subtitle={t.cards.notifications.rows.push.subtitle}
                        >
                            <Toggle
                                checked={pushEnabled}
                                onChange={setPushEnabled}
                            />
                        </SettingsRow>
                    </SettingsCard>

                    <SettingsCard
                        icon={<Settings2 size={28} />}
                        title={t.cards.management.title}
                    >
                        <button
                            className="settings-page__reset"
                            type="button"
                            onClick={resetSettings}
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