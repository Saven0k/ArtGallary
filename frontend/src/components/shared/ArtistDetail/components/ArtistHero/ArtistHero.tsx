import type { ArtistProfileResponse } from '../../../../../api/artists/main.api';
import { useLanguage } from '../../../../../context/LanguageContext';
import { ArtistStats } from '../ArtistStats/ArtistStats';
import { artistHeroTranslations } from './lang';
import './ArtistHero.css';

interface ArtistHeroProps {
    artist: ArtistProfileResponse;
    artsCount: number;
}

export const ArtistHero = ({ artist, artsCount }: ArtistHeroProps) => {
    const { language } = useLanguage();
    const lang = artistHeroTranslations[language];
    
    const fullName = `${artist.surname} ${artist.name} ${artist.second_name || ''}`.trim();
    const initials = `${artist.surname?.[0]}${artist.name?.[0]}`;

    const getRoleText = () => {
        if (artist.role === 'artist') {
            return lang.role.artist;
        }
        return lang.role.user;
    };

    return (
        <div className="artist-hero">
            <div className="artist-hero__container">
                {/* Левая колонка - фото */}
                <div className="artist-hero__image-col">
                    <div className="artist-hero__image-wrapper">
                        {artist.avatar_path ? (
                            <img
                                src={String(artist.avatar_path)}
                                alt={fullName}
                                className="artist-hero__image"
                            />
                        ) : (
                            <div className="artist-hero__image-placeholder">
                                <span className="artist-hero__placeholder-icon">🎨</span>
                                <span className="artist-hero__placeholder-text">{initials}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Правая колонка - информация */}
                <div className="artist-hero__info-col">
                    <h1 className="artist-hero__name">{fullName}</h1>
                    <p className="artist-hero__role">{getRoleText()}</p>
                    <ArtistStats 
                        artsCount={artsCount}
                        exhibitionsCount={artist.artistProfile?.exhibitionsCount || 0}
                    />
                </div>
            </div>
        </div>
    );
};