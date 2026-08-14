// Resources.tsx (обновленный)
import { useState } from "react";
import "./Resources.scss";
import { translations } from "../../lang";
import { useLanguage } from "../../../../hooks/useLanguage";
import ResourceModal from "../ResourceModal/ResourceModal";

export interface ResourceItem {
    title: string;
    description: string;
    icon: React.FC<{ className?: string }>;
    img: string;
    list: {
        icon: string;
        title: string;
        description: string;
    }[];
}

interface ResourcesProps {
    items: ResourceItem[];
}

const Resources = ({ items }: ResourcesProps) => {
    const { language } = useLanguage();
    const t = translations[language].help.resources;
    const [activeIndex, setActiveIndex] = useState<number | null>(null);

    const handleOpen = (index: number) => {
        setActiveIndex(index);
    };

    const handleClose = () => {
        setActiveIndex(null);
    };

    return (
        <section className="resources">
            <header className="resources__header">
                <h4 className="resources__title">{t.title}</h4>
            </header>

            <div className="resources__list">
                {items.map((item, index) => {
                    const IconComponent = item.icon;
                    return (
                        <button
                            key={index}
                            className={`resources__card ${activeIndex === index ? "resources__card--active" : ""}`}
                            onClick={() => handleOpen(index)}
                            type="button"
                        >
                            <IconComponent className="resources__card-icon" />
                            <div className="resources__card-content">
                                <span className="resources__card-title">{item.title}</span>
                                <p className="resources__card-description">{item.description}</p>
                            </div>
                        </button>
                    );
                })}
            </div>

            {activeIndex !== null && items[activeIndex] && (
                <ResourceModal
                    isOpen={true}
                    onClose={handleClose}
                    title={items[activeIndex].title}
                    description={items[activeIndex].description}
                    img={items[activeIndex].img || ""}
                    list={items[activeIndex].list || []}
                />
            )}
        </section>
    );
};

export default Resources;