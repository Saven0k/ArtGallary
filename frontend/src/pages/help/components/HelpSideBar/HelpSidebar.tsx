// src/pages/Help/components/HelpSidebar.tsx
import "./HelpSidebar.scss";
import { translations } from "../../lang";
import { useLanguage } from "../../../../hooks/useLanguage";
import { type HelpSection } from "../../HelpPage";
import { BookIcon, ChatIcon, QuestionIcon } from "../../icons/Icons";

interface HelpSidebarProps {
    activeSection: HelpSection;
    onSectionChange: (section: HelpSection) => void;
}

const HelpSidebar = ({ activeSection, onSectionChange }: HelpSidebarProps) => {
    const { language } = useLanguage();
    const t = translations[language].help.sidebar;

    const sections = [
        { key: 'questions', icon: QuestionIcon, title: t.questions.title, description: t.questions.description },
        { key: 'knowledge', icon: BookIcon, title: t.knowledge.title, description: t.knowledge.description },
        { key: 'support', icon: ChatIcon, title: t.support.title, description: t.support.description },
    ] as const;

    return (
        <div className="help-sidebar">
            {sections.map((section) => (
                <button
                    key={section.key}
                    className={`help-sidebar__card ${activeSection === section.key ? 'help-sidebar__card--active' : ''}`}
                    onClick={() => onSectionChange(section.key)}
                    type="button"
                >
                    <div className="help-sidebar__icon">
                        <section.icon />
                    </div>
                    <div className="help-sidebar__content">
                        <h4 className="help-sidebar__title">{section.title}</h4>
                        <p className="help-sidebar__description">{section.description}</p>
                    </div>
                </button>
            ))}
        </div>
    );
};

export default HelpSidebar;