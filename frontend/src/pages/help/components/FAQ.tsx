import { useState, useMemo, useEffect } from "react";
import FAQItem from "./FAQItem";
import "./FAQ.css";
import { translations } from "../lang";
import FAQTabs from "./FAQTabs";
import { useLanguage } from "../../../hooks/useLanguage";

export interface FAQItemType {
    question: string;
    answer: string;
    tag: string;
}

interface FAQProps {
    items: FAQItemType[];
}

const FAQ = ({ items }: FAQProps) => {
    const [activeTab, setActiveTab] = useState("general");
    const { language } = useLanguage();
    const t = translations[language].help.faq;
    const [activeIndex, setActiveIndex] = useState<number | null>(0);

    const handleToggle = (index: number) => {
        setActiveIndex((prev) => (prev === index ? null : index));
    };

    const handleTabChange = (tab: string) => {
        setActiveTab(tab);
        setActiveIndex(null);
    };

    const filteredItems = useMemo(() => {
        if (activeTab === "general") {
            return items;
        }
        return items.filter((item) => item.tag === activeTab);
    }, [items, activeTab]);

    return (
        <section className="faq">
            <header className="faq__header">
                <h3 className="faq__title">{t.title}</h3>
                <FAQTabs active={activeTab} onChange={handleTabChange} />
            </header>

            <div className="faq__list">
                {filteredItems.map((item, index) => (
                    <FAQItem
                        key={index}
                        question={item.question}
                        answer={item.answer}
                        isOpen={activeIndex === index}
                        onClick={() => handleToggle(index)}
                    />
                ))}
            </div>
        </section>
    );
};

export default FAQ;