import { exhibitionsEmptyTranslations } from './lang';
import './ExhibitionsEmpty.css';
import { useLanguage } from '../../../../../context/LanguageContext';

interface ExhibitionsEmptyProps {
    onReset: () => void;
}

export const ExhibitionsEmpty = ({ onReset }: ExhibitionsEmptyProps) => {
    const { language } = useLanguage();
    const lang = exhibitionsEmptyTranslations[language];

    return (
        <div className="exhibitions-empty">
            <div className="exhibitions-empty__icon">🖼️</div>
            <h3 className="exhibitions-empty__title">{lang.title}</h3>
            <p className="exhibitions-empty__text">{lang.text}</p>
            <button className="exhibitions-empty__btn" onClick={onReset}>
                {lang.button}
            </button>
        </div>
    );
};