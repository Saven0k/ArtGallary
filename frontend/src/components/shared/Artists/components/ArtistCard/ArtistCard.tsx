import type { ArtistUser } from '../../../../../types/user.types';
import { useLanguage } from '../../../../../context/LanguageContext';
import { artistCardTranslations } from './lang';
import './ArtistCard.css';

interface ArtistCardProps {
    artist: ArtistUser;
    viewMode: 'grid' | 'list';
    onClick: () => void;
}

export const ArtistCard = ({ artist, viewMode, onClick }: ArtistCardProps) => {
    const { language } = useLanguage();
    const lang = artistCardTranslations[language];

    const getFullName = () => {
        const parts = [artist.surname, artist.name];
        if (artist.second_name) parts.push(artist.second_name);
        return parts.join(' ');
    };

    const getInitials = () => {
        return `${artist.surname?.[0] || ''}${artist.name?.[0] || ''}`;
    };

    const getArtCount = () => {
        return artist.artistProfile?.arts?.length || 0;
    };

    const formatDate = (date: string) => {
        const locale = language === 'en' ? 'en-US' : 'ru-RU';
        return new Date(date).toLocaleDateString(locale, {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <div className={`artist-card artist-card--${viewMode}`} onClick={onClick}>
            <div className="artist-card__image-wrapper">
                {artist.avatar_path ? (
                    <img src={String(artist.avatar_path)} alt={getFullName()} className="artist-card__image" />
                ) : (
                    <div className="artist-card__image-placeholder">
                        <span className="artist-card__initials">{getInitials()}</span>
                    </div>
                )}
                <div className="artist-card__overlay">
                    <button className="artist-card__view-btn">{lang.viewProfile}</button>
                </div>
                <div className="artist-card__art-count">
                    🖼️ {getArtCount()} {lang.works}
                </div>
            </div>

            <div className="artist-card__content">
                <h3 className="artist-card__name">{getFullName()}</h3>
                
                {artist.artistProfile?.date_birthday && (
                    <div className="artist-card__birthday">
                        📅 {formatDate(artist.artistProfile.date_birthday)}
                    </div>
                )}

                <div className="artist-card__location">
                    {artist.artistProfile?.city?.id && (
                        <span className="artist-card__city">📍 {artist.artistProfile.city.name}</span>
                    )}
                    {artist.artistProfile?.country?.id && (
                        <span className="artist-card__country">, {artist.artistProfile.country.name}</span>
                    )}
                </div>

                {artist.artistProfile?.biography && (
                    <p className="artist-card__bio">
                        {artist.artistProfile.biography.length > 100 
                            ? `${artist.artistProfile.biography.slice(0, 100)}...` 
                            : artist.artistProfile.biography}
                    </p>
                )}
            </div>
        </div>
    );
};