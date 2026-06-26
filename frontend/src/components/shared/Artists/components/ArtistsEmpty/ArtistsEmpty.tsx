import { useLanguage } from '../../../../../context/LanguageContext';
import { artistsEmptyTranslations } from './lang';
import './ArtistsEmpty.css';

interface ArtistsEmptyProps {
    onReset: () => void;
}

export const ArtistsEmpty = ({ onReset }: ArtistsEmptyProps) => {
    const { language } = useLanguage();
    const lang = artistsEmptyTranslations[language];

    return (
        <div className="artists-empty">
            <div className="artists-empty__icon">🎨</div>
            <h3 className="artists-empty__title">{lang.title}</h3>
            <p className="artists-empty__text">{lang.text}</p>
            <button className="artists-empty__btn" onClick={onReset}>
                {lang.button}
            </button>
        </div>
    );
};