import type { ArtistProfileResponse } from '../../../../../api/artists/main.api';
import { useLanguage } from '../../../../../context/LanguageContext';
import { ArtistInfoCard } from '../ArtistInfoCard/ArtistInfoCard';
import { artistInfoTabTranslations } from './lang';
import './ArtistInfoTab.css';

interface ArtistInfoTabProps {
    artist: ArtistProfileResponse;
}

const formatDate = (dateString?: string | null, language?: string) => {
    if (!dateString) return null;
    const locale = language === 'en' ? 'en-US' : 'ru-RU';
    return new Date(dateString).toLocaleDateString(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

const getAge = (birthDate?: string | null) => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    return age;
};

export const ArtistInfoTab = ({ artist }: ArtistInfoTabProps) => {
    const { language } = useLanguage();
    const lang = artistInfoTabTranslations[language];
    const age = getAge(artist.artistProfile?.date_birthday);
    const formattedBirthDate = formatDate(artist.artistProfile?.date_birthday, language);

    return (
        <div className="artist-info-tab">
            {/* Биография */}
            <div className="artist-info-tab__section">
                <h3 className="artist-info-tab__section-title">{lang.biography}</h3>
                <div className="artist-info-tab__biography">
                    {artist.artistProfile?.biography ? (
                        <p>{artist.artistProfile.biography}</p>
                    ) : (
                        <p className="artist-info-tab__empty-text">{lang.noBiography}</p>
                    )}
                </div>
            </div>

            {/* Личная информация */}
            <div className="artist-info-tab__section">
                <h3 className="artist-info-tab__section-title">{lang.personalInfo}</h3>
                <div className="artist-info-tab__grid">
                    <ArtistInfoCard
                        icon="📅"
                        label={lang.birthDate}
                        value={formattedBirthDate || lang.notSpecified}
                        extra={age ? ` (${age} ${lang.yearsOld})` : null}
                    />
                    <ArtistInfoCard 
                        icon="📍"
                        label={lang.location}
                        value={artist.artistProfile?.city?.name || lang.notSpecified}
                        extra={artist.artistProfile?.country?.name ? `, ${artist.artistProfile.country.name}` : null}
                    />
                </div>
            </div>
            {(artist.artistProfile?.moderate || artist.createdAt) && (
                <div className="artist-info-tab__section">
                    <h3 className="artist-info-tab__section-title">{lang.additional}</h3>
                    <div className="artist-info-tab__meta">
                        {artist.createdAt && (
                            <div className="artist-info-tab__meta-item">
                                <span className="artist-info-tab__meta-label">{lang.onSiteSince}</span>
                                <span className="artist-info-tab__meta-value">{formatDate(artist.createdAt, language)}</span>
                            </div>
                        )}
                        {artist.artistProfile?.moderate?.moderate && (
                            <div className="artist-info-tab__meta-item">
                                <span className="artist-info-tab__meta-label">{lang.status}</span>
                                <span className="artist-info-tab__meta-value artist-info-tab__meta-value--verified">
                                    {lang.verified}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};