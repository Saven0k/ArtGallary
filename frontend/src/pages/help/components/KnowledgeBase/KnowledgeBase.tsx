import "./KnowledgeBase.scss";
import { useLanguage } from "../../../../hooks/useLanguage";
import { translations } from "../../lang";

export interface KnowledgeItem {
    title: string;
    description: string;
    link?: string;
}

interface KnowledgeBaseProps {
    items: KnowledgeItem[];
}

const KnowledgeBase = ({ items }: KnowledgeBaseProps) => {
    const { language } = useLanguage();
    const t = translations[language].help.knowledge;

    return (
        <section className="knowledge-base">
            <header className="knowledge-base__header">
                <h3 className="knowledge-base__title">{t.title}</h3>
                <p className="knowledge-base__subtitle">{t.subtitle}</p>
            </header>
            <div className="knowledge-base__list">
                {items.map((item, index) => (
                    <article key={index} className="knowledge-base__card">
                        <h4 className="knowledge-base__card-title">{item.title}</h4>
                        <p className="knowledge-base__card-description">{item.description}</p>
                        {item.link && (
                            <a href={item.link} className="knowledge-base__card-link">
                                Читать →
                            </a>
                        )}
                    </article>
                ))}
            </div>
        </section>
    );
};

export default KnowledgeBase;