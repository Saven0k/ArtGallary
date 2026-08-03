import { useLanguage } from "../../../hooks/useLanguage";
import { translations } from "../lang";
import "./FAQTabs.css";

interface FAQTabsProps {
    active: string;
    onChange: (tab: string) => void;
}

const FAQTabs = ({ active, onChange }: FAQTabsProps) => {
    const { language } = useLanguage();
    const t = translations[language].help.faq.tabs;

    const tabs = [
        { key: 'general', label: t.general },
        { key: 'account', label: t.account },
        { key: 'payment', label: t.payment },
        { key: 'technical', label: t.technical },
    ];
    return (
        <div className="faq-tabs">
            {tabs.map((tab) => (
                <button
                    key={tab.key}
                    className={`faq-tab ${active === tab.key ? "active" : ""
                        }`}
                    onClick={() => onChange(tab.key)}
                >
                    {tab.label}
                </button>
            ))}
        </div>
    );
};

export default FAQTabs;