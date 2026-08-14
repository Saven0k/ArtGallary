import { useLanguage } from "../../../../hooks/useLanguage";
import { translations } from "../../lang";
import "./Support.scss";

const Support = () => {
    const { language } = useLanguage();
    const t = translations[language].help.support;

    return (
        <section className="support">
            <header className="support__header">
                <h3 className="support__title">{t.title}</h3>
                <p className="support__subtitle">{t.subtitle}</p>
            </header>
            <div className="support__content">
                <div className="support__contact">
                    <span className="support__contact-label">{t.email}</span>
                    <a href="mailto:support@artgallery.com" className="support__contact-value">
                        support@artgallery.com
                    </a>
                </div>
                <div className="support__contact">
                    <span className="support__contact-label">{t.phone}</span>
                    <a href="tel:+78005553535" className="support__contact-value">
                        +7 (800) 555-35-35
                    </a>
                </div>
                <div className="support__hours">
                    <span className="support__hours-label">{t.hours}</span>
                    <span className="support__hours-value">{t.hoursValue}</span>
                </div>
                <button className="support__button">{t.button}</button>
            </div>
        </section>
    );
};

export default Support;