import { useLanguage } from '../../../../../context/LanguageContext';
import { artistStatsTranslations } from './lang';
import './ArtistStats.css';

interface ArtistStatsProps {
    artsCount: number;
    exhibitionsCount: number;
    totalLikes?: number;
}

export const ArtistStats = ({ artsCount, exhibitionsCount, totalLikes = 0 }: ArtistStatsProps) => {
    const { language } = useLanguage();
    const lang = artistStatsTranslations[language];

    return (
        <div className="artist-stats">
            <div className="artist-stats__item">
                <span className="artist-stats__value">{artsCount}</span>
                <span className="artist-stats__label">{lang.works}</span>
            </div>
            <div className="artist-stats__item">
                <span className="artist-stats__value">{exhibitionsCount}</span>
                <span className="artist-stats__label">{lang.exhibitions}</span>
            </div>
            <div className="artist-stats__item">
                <span className="artist-stats__value">{totalLikes}</span>
                <span className="artist-stats__label">{lang.likes}</span>
            </div>
        </div>
    );
};