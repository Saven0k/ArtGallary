// ResourceModal.tsx
import "./ResourceModal.scss";
import { useLanguage } from "../../../../hooks/useLanguage";
import { translations } from "../../lang";

interface ResourceItem {
    icon: string;
    title: string;
    description: string;
}

interface ResourceModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    description: string;
    img: string;
    list: ResourceItem[];
}

const ResourceModal = ({ isOpen, onClose, title, description, img, list }: ResourceModalProps) => {
    const { language } = useLanguage();
    const t = translations[language].help.resources;

    if (!isOpen) return null;

    return (
        <div className="resource-modal__overlay" onClick={onClose}>
            <div className="resource-modal" onClick={(e) => e.stopPropagation()}>
                <button className="resource-modal__close" onClick={onClose} type="button">
                    ✕
                </button>

                <div className="resource-modal__content">
                    <h3 className="resource-modal__title">{title}</h3>
                    {description && (
                        <p className="resource-modal__description">{description}</p>
                    )}

                    <div className="resource-modal__body">
                        {list && list.length > 0 && (
                            <div className="resource-modal__list">
                                {list.map((item, index) => (
                                    <div key={index} className="resource-modal__list-item">
                                        <div className="resource-modal__list-icon">
                                            {item.icon}
                                        </div>
                                        <div className="resource-modal__list-content">
                                            <h4 className="resource-modal__list-title">{item.title}</h4>
                                            <p className="resource-modal__list-description">{item.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResourceModal;