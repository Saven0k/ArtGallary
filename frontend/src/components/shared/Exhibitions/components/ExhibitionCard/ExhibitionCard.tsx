import type { Exhibition } from '../../../../../api/exhibitions/main.api';
import { useLanguage } from '../../../../../context/LanguageContext';
import { exhibitionCardTranslations } from './lang';
import "./ExhibitionsCard.css";

interface ExhibitionCardProps {
    exhibition: Exhibition;
    viewMode: 'grid' | 'list';
    onClick: () => void;
}

export const ExhibitionCard = ({ exhibition, viewMode, onClick }: ExhibitionCardProps) => {
    const { language } = useLanguage();
    const lang = exhibitionCardTranslations[language];
    
    const formatDate = (date: string) => {
        const locale = language === 'en' ? 'en-US' : 'ru-RU';
        return new Date(date).toLocaleDateString(locale, {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const getInitials = () => {
        return exhibition.title.slice(0, 2).toUpperCase();
    };

    const hasImage = exhibition.image_path && exhibition.image_path.trim() !== '' && exhibition.image_path !== 'null';

    return (
        <div className={`exhibition-card exhibition-card--${viewMode}`} onClick={onClick}>
            <div className="exhibition-card__image-wrapper">
                {hasImage ? (
                    <img src={exhibition.image_path} alt="" className="exhibition-card__image" />
                ) : (
                    <div className="exhibition-card__image-placeholder">
                        <span className="exhibition-card__placeholder-icon">🏛️</span>
                        <span className="exhibition-card__placeholder-text">{getInitials()}</span>
                    </div>
                )}
                <div className="exhibition-card__overlay">
                    <button className="exhibition-card__view-btn">{lang.viewDetails}</button>
                </div>
                <div className="exhibition-card__visitors">
                    👥 {exhibition.visitors_count || 0} {lang.visitors}
                </div>
            </div>

            <div className="exhibition-card__content">
                <h3 className="exhibition-card__title">{exhibition.title}</h3>
                
                <div className="exhibition-card__date">
                    📅 {formatDate(exhibition.date)}
                </div>

                <div className="exhibition-card__location">
                    📍 {exhibition.address}
                </div>

                {exhibition.city && (
                    <div className="exhibition-card__city">
                        🏙️ {exhibition.city.name}
                        {exhibition.country && `, ${exhibition.country.name}`}
                    </div>
                )}

                <div className="exhibition-card__cost">
                    💰 {exhibition.cost}
                </div>

                <p className="exhibition-card__description">
                    {exhibition.description.length > 120 
                        ? `${exhibition.description.slice(0, 120)}...` 
                        : exhibition.description}
                </p>

                <div className="exhibition-card__tags">
                    {exhibition.type && (
                        <span className="exhibition-card__tag">{exhibition.type.name}</span>
                    )}
                    {exhibition.genre && (
                        <span className="exhibition-card__tag">{exhibition.genre.title}</span>
                    )}
                </div>
            </div>
        </div>
    );
};