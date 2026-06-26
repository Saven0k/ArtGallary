import { useLanguage } from '../../../../context/LanguageContext';
import { artsEmptyTranslations } from './lang';
import "./ArtsEmpty.css";

interface ArtsEmptyProps {
    onReset: () => void;
}

export const ArtsEmpty = ({ onReset }: ArtsEmptyProps) => {
    const { language } = useLanguage();
    const lang = artsEmptyTranslations[language];

    return (
        <div className="arts-empty">
            <div className="arts-empty__icon">🎨</div>
            <h3 className="arts-empty__title">{lang.title}</h3>
            <p className="arts-empty__text">{lang.text}</p>
            <button className="arts-empty__btn" onClick={onReset}>
                {lang.button}
            </button>
        </div>
    );
};