// src/pages/Help/HelpPage.tsx
import { useState } from "react";
import "./HelpPage.scss";
import HelpSidebar from "./components/HelpSideBar/HelpSidebar";
import FAQ from "./components/FAQ/FAQ";
import KnowledgeBase from "./components/KnowledgeBase/KnowledgeBase";
import Support from "./components/Support/Support";
import Resources from "./components/Resources/Resources";
import { translations } from "./lang";
import { useLanguage } from "../../hooks/useLanguage";

export type HelpSection = 'questions' | 'knowledge' | 'support';

const HelpPage = () => {
    const { language } = useLanguage();
    const t = translations[language].help;
    const [activeSection, setActiveSection] = useState<HelpSection>('questions');

    const renderContent = () => {
        switch (activeSection) {
            case 'questions':
                return <FAQ items={t.faq.items} />;
            case 'knowledge':
                return <KnowledgeBase items={t.knowledge.items} />;
            case 'support':
                return <Support />;
            default:
                return <FAQ items={t.faq.items} />;
        }
    };

    return (
        <main className="help-page">
            <header className="help-page__header">
                <h3 className="help-page__title">{t.title}</h3>
                <p className="help-page__subtitle">{t.subtitle}</p>
            </header>

            <section className="help-page__content">
                <HelpSidebar 
                    activeSection={activeSection} 
                    onSectionChange={setActiveSection} 
                />
                {renderContent()}
            </section>
            <Resources items={t.resources.items} />
        </main>
    );
};

export default HelpPage;