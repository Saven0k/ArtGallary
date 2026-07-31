import "./HelpPage.css";
import HelpSidebar from "./components/HelpSidebar";
import FAQ from "./components/FAQ";
import Resources from "./components/Resources";
import { useLanguage } from "../../context/LanguageContext";
import { translations } from "./lang";

const HelpPage = () => {
    const { language } = useLanguage();
    const t = translations[language].help;

    return (
        <main className="help-page">
            <header className="help-page__header">
                <h3 className="help-page__title">{t.title}</h3>
                <p className="help-page__subtitle">{t.subtitle}</p>
            </header>

            <section className="help-page__content">
                <HelpSidebar />

                <FAQ items={t.faq.items} />
            </section>
            <Resources items={t.resources.items} />
        </main>
    );
};

export default HelpPage;