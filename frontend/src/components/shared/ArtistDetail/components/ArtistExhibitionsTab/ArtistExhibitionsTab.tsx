import type { Exhibition } from '../../../../../api/exhibitions/main.api';
import { useLanguage } from '../../../../../context/LanguageContext';
import { ArtistExhibitionCard } from '../ArtistExhibitionCard/ArtistExhibitionCard';
import { artistExhibitionsTabTranslations } from './lang';
import './ArtistExhibitionsTab.css';

interface ArtistExhibitionsTabProps {
    exhibitions: Exhibition[];
    loading: boolean;
    onExhibitionClick: (exhibitionId: number) => void;
}

export const ArtistExhibitionsTab = ({ exhibitions, loading, onExhibitionClick }: ArtistExhibitionsTabProps) => {
    const { language } = useLanguage();
    const lang = artistExhibitionsTabTranslations[language];

    if (loading) {
        return (
            <div className="artist-exhibitions-tab__loading">
                <div className="artist-detail__spinner-small"></div>
                <p>{lang.loading}</p>
            </div>
        );
    }

    if (exhibitions.length === 0) {
        return (
            <div className="artist-detail__empty">
                <div className="artist-detail__empty-icon">🏛️</div>
                <h3>{lang.empty.title}</h3>
                <p>{lang.empty.description}</p>
            </div>
        );
    }

    return (
        <div className="artist-exhibitions-tab">
            <div className="artist-exhibitions-tab__grid">
                {exhibitions.map(exhibition => (
                    <ArtistExhibitionCard 
                        key={exhibition.id} 
                        exhibition={exhibition} 
                        onClick={() => onExhibitionClick(exhibition.id)}
                    />
                ))}
            </div>
        </div>
    );
};