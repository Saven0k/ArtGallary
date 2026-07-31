import "./Resources.css";
import { useLanguage } from "../../../context/LanguageContext";
import { translations } from "../lang";

export interface ResourceItem {
    title: string;
    description: string;
    icon: string;
}

interface ResourcesProps {
    items: ResourceItem[];
}

const Resources = ({ items }: ResourcesProps) => {
    const { language } = useLanguage();
    const t = translations[language].help.resources;

    return (
        <section className="resources">
            <header className="resources__header">
                <h4 className="resources__title">{t.title}</h4>
            </header>

            <div className="resources__list">
                {items.map((item, index) => (
                    <article key={index} className="resources__card">
                        <img  src={item.icon} alt="Svg icon" className="resources__card-icon"/>
                        <div className="resources__card-content">
                            <span className="resources__card-title">{item.title}</span>
                            <p className="resources__card-description">{item.description}</p>
                        </div>
                    </article>
                ))}
            </div>
        </section>
    );
};

export default Resources;