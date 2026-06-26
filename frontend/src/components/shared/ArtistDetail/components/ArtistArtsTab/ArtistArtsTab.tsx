import { useNavigate } from 'react-router-dom';
import type { Art } from '../../../../../api/arts/main.api';
import { useAuth } from '../../../../../hooks/useAuth';
import { useLanguage } from '../../../../../context/LanguageContext';
import { ArtistArtCard } from '../ArtistArtCard/ArtistArtCard';
import { artistArtsTabTranslations } from './lang';
import './ArtistArtsTab.css';

interface ArtistArtsTabProps {
    arts: Art[];
    loading: boolean;
    onArtClick: (artId: number) => void;
    artistUserId?: number;
}

export const ArtistArtsTab = ({ arts, loading, onArtClick, artistUserId }: ArtistArtsTabProps) => {
    const { user } = useAuth();
    const { language } = useLanguage();
    const navigate = useNavigate();
    const isOwner = user?.id === artistUserId;
    const lang = artistArtsTabTranslations[language];

    if (loading) {
        return (
            <div className="artist-arts-tab__loading">
                <div className="artist-detail__spinner-small"></div>
                <p>{lang.loading}</p>
            </div>
        );
    }

    if (arts.length === 0) {
        return (
            <div className="artist-detail__empty">
                <div className="artist-detail__empty-icon">🖼️</div>
                <h3>{lang.empty.title}</h3>
                <p>{lang.empty.description}</p>
                {isOwner && (
                    <button 
                        className="artist-arts-tab__create-btn"
                        onClick={() => window.location.href = '/arts/my/new'}
                    >
                        {lang.empty.button}
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="artist-arts-tab">
            {isOwner && (
                <div className="artist-arts-tab__header">
                    <button 
                        className="artist-arts-tab__create-btn"
                        onClick={() => window.location.href = '/arts/my/new'}
                    >
                        {lang.addButton}
                    </button>
                </div>
            )}
            <div className="artist-arts-tab__grid">
                {arts.map(art => (
                    <ArtistArtCard 
                        key={art.id} 
                        art={art} 
                        onClick={() => onArtClick(art.id)}
                        isOwner={isOwner}
                        onEdit={() => navigate(`/arts/my/edit/${art.id}`)}
                    />
                ))}
            </div>
        </div>
    );
};