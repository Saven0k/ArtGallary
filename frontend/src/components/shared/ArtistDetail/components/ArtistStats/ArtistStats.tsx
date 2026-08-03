import { useLanguage } from '../../../../../hooks/useLanguage';
import { artistStatsTranslations } from './lang';
import './ArtistStats.css';

interface ArtistStatsProps {
    artsCount: number;
    totalLikes?: number;
}

export const ArtistStats = ({ artsCount,  totalLikes = 0 }: ArtistStatsProps) => {
    const { language } = useLanguage();
    const lang = artistStatsTranslations[language];

    return (
        <div className="artist-stats">
            <div className="artist-stats__item">
                <span className="artist-stats__value">{artsCount}</span>
                <span className="artist-stats__label">{lang.works}</span>
            </div>
            <div className="artist-stats__item">
                <span className="artist-stats__value">{totalLikes}</span>
                <span className="artist-stats__label">{lang.likes}</span>
            </div>
        </div>
    );
};