import type { Art } from '../../../../../api/arts/main.api';
import { useLanguage } from '../../../../../context/LanguageContext';
import { artistArtCardTranslations } from './lang';
import './ArtistArtCard.css';

interface ArtistArtCardProps {
    art: Art;
    onClick: () => void;
    isOwner?: boolean;
    onEdit?: () => void;
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

export const ArtistArtCard = ({ art, onClick, isOwner, onEdit }: ArtistArtCardProps) => {
    const { language } = useLanguage();
    const lang = artistArtCardTranslations[language];

    const handleEdit = (e: React.MouseEvent) => {
        e.stopPropagation();
        onEdit?.();
    };

    return (
        <div className="artist-art-card" onClick={onClick}>
            {isOwner && (
                <button 
                    className="artist-art-card__edit-btn"
                    onClick={handleEdit}
                    title={lang.edit}
                >
                    ✏️
                </button>
            )}
            <div className="artist-art-card__image-wrapper">
                <img src={art.image_path} alt={art.title} className="artist-art-card__image" />
                <div className="artist-art-card__overlay">
                    <span>🔍</span>
                </div>
                <div className="artist-art-card__likes">
                    ❤️ {art.likes || 0}
                </div>
            </div>
            <div className="artist-art-card__info">
                <h3 className="artist-art-card__title">{art.title}</h3>
                {art.cost && (
                    <p className="artist-art-card__price">💰 {art.cost.toLocaleString()} {lang.rub}</p>
                )}
                {art.date_published && (
                    <p className="artist-art-card__date">📅 {formatDate(art.date_published, language)}</p>
                )}
            </div>
        </div>
    );
};