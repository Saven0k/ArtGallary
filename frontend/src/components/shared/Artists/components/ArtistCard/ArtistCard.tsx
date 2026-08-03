import type { ArtistUser } from '../../../../../types/user.types';
import { useLanguage } from '../../../../../hooks/useLanguage';
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

    const getFullImageUrl = (avatarPath?: string | null) => {
        if (!avatarPath) return null;
        if (avatarPath.startsWith('http')) return avatarPath;
        const baseUrl = 'http://localhost:5000';
        return `${baseUrl}${avatarPath.startsWith('/') ? avatarPath : `/${avatarPath}`}`;
    };

    return (
        <div className={`artist-card ${viewMode}`} onClick={onClick}>
            <div className="artist-card__image-container">
                {artist.avatar_path ? (
                    <img src={getFullImageUrl(String(artist.avatar_path)) || ''} alt={getFullName()} className="artist-card__image" />
                ) : (
                    <div className="artist-card__avatar-placeholder">🎨</div>
                )}
            </div>
            <div className="artist-card__info">
                <h3 className="artist-card__name">{getFullName()}</h3>
                <p className="artist-card__profession">{artist.artistProfile?.profession?.name || 'Художник'}</p>
                <div className="artist-card__details">
                    <span>🖼️ {artist.artistProfile?.artsCount || 0} работ</span>
                    <span>❤️ {artist.artistProfile?.totalLikes || 0} лайков</span>
                </div>
                <div className="artist-card__location">
                    {artist.artistProfile?.city?.name_en && <span>🏙️ {artist.artistProfile.city.name_en}</span>}
                    {artist.artistProfile?.country?.name_en && <span>🌍 {artist.artistProfile.country.name_en}</span>}
                </div>
                {artist.role === 'artist' && (
                    <span className={`artist-card__status ${artist.artistProfile?.moderate === true ? 'approved' : 'pending'}`}>
                        {artist.artistProfile?.moderate === true ? '✅ Одобрено' : '⏳ На модерации'}
                    </span>
                )}
            </div>
        </div>
    );
};
