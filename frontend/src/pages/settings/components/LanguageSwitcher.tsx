// src/pages/Settings/components/LanguageSwitcher.tsx

import { useLanguage } from "../../../hooks/useLanguage";
import {
    settingsTranslations,
    languageSwitcherTranslations,
    type Language,
} from "../lang";

import "./LanguageSwitcher.css";

const LanguageSwitcher = () => {
    const { language, setLanguage } = useLanguage();

    const t = settingsTranslations[language as Language].settings.language;
    const names = languageSwitcherTranslations[language as Language];

    return (
        <div className="language-switcher">

            <div className="language-switcher__info">
                <h3 className="language-switcher__title">
                    {t.title}
                </h3>

                <p className="language-switcher__description">
                    {t.description}
                </p>
            </div>

            <div className="language-switcher__buttons">

                <button
                    type="button"
                    className={`language-switcher__button ${
                        language === "ru" ? "active" : ""
                    }`}
                    onClick={() => setLanguage("ru")}
                >
                    {names.ru}
                </button>

                <button
                    type="button"
                    className={`language-switcher__button ${
                        language === "en" ? "active" : ""
                    }`}
                    onClick={() => setLanguage("en")}
                >
                    {names.en}
                </button>

                <button
                    type="button"
                    className={`language-switcher__button ${
                        language === "zh" ? "active" : ""
                    }`}
                    onClick={() => setLanguage("zh")}
                >
                    {names.zh}
                </button>

            </div>

        </div>
    );
};

export default LanguageSwitcher;