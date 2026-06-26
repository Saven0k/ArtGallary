import type { Exhibition } from '../../../../../api/exhibitions/main.api';
import { useLanguage } from '../../../../../context/LanguageContext';
import { artistExhibitionCardTranslations } from './lang';
import './ArtistExhibitionCard.css';

interface ArtistExhibitionCardProps {
    exhibition: Exhibition;
    onClick: () => void;
}

const formatDate = (dateString?: string, language?: string) => {
    if (!dateString) return null;
    const locale = language === 'en' ? 'en-US' : 'ru-RU';
    return new Date(dateString).toLocaleDateString(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

export const ArtistExhibitionCard = ({ exhibition, onClick }: ArtistExhibitionCardProps) => {
    const { language } = useLanguage();
    const lang = artistExhibitionCardTranslations[language];

    return (
        <div className="artist-exhibition-card" onClick={onClick}>
            {exhibition.image_path && (
                <div className="artist-exhibition-card__image">
                    <img src={exhibition.image_path} alt={exhibition.title} />
                </div>
            )}
            <div className="artist-exhibition-card__info">
                <h3 className="artist-exhibition-card__title">{exhibition.title}</h3>
                <div className="artist-exhibition-card__details">
                    <span className="artist-exhibition-card__date">
                        📅 {formatDate(exhibition.date, language)}
                    </span>
                    <span className="artist-exhibition-card__location">
                        📍 {exhibition.address}
                    </span>
                    <span className="artist-exhibition-card__cost">
                        💰 {lang.cost}{exhibition.cost}
                    </span>
                </div>
            </div>
        </div>
    );
};