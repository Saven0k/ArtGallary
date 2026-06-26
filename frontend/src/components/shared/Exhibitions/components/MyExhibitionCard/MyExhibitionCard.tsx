import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../../../../context/LanguageContext';
import { myExhibitionCardTranslations } from './lang';
import './MyExhibitionCard.css';

interface MyExhibitionCardProps {
    exhibition: any;
    isOwner?: boolean;
    onUpdate: () => void;
    onDelete: () => void;
    onAddArt: () => void;
    onRemoveArt: (artId: number) => void;
    onAddArtist: () => void;
    onRemoveArtist: (artistId: number) => void;
}

export const MyExhibitionCard = ({
    exhibition,
    onUpdate,
    onDelete,
    isOwner = false,
    onAddArt,
    onRemoveArt,
    onAddArtist,
    onRemoveArtist
}: MyExhibitionCardProps) => {
    const navigate = useNavigate();
    const { language } = useLanguage();
    const lang = myExhibitionCardTranslations[language];
    const [showArts, setShowArts] = useState(false);
    const [showArtists, setShowArtists] = useState(false);
    const [showVisitors, setShowVisitors] = useState(false);

    const handleNavigate = () => {
        navigate(`/exhibitions/${exhibition.id}`);
    };

    const formatVisitorsCount = (count?: number) => {
        if (!count) return '0';
        if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
        if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
        return count.toString();
    };

    const formatDate = (dateString: string) => {
        const locale = language === 'en' ? 'en-US' : 'ru-RU';
        return new Date(dateString).toLocaleDateString(locale, {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <div className={`my-exhibition-card ${!isOwner ? 'my-exhibition-card--participant' : ''}`}>
            {!isOwner && (
                <div className="my-exhibition-card__badge">{lang.participant}</div>
            )}
            
            <button 
                className="my-exhibition-card__nav-btn"
                onClick={handleNavigate}
                title={lang.navTitle}
            >
                🔗
            </button>

            <div className="my-exhibition-card__image">
                {exhibition.image_path ? (
                    <img src={exhibition.image_path} alt={exhibition.title} />
                ) : (
                    <div className="my-exhibition-card__image-placeholder">🏛️</div>
                )}
            </div>
            <div className="my-exhibition-card__content">
                <h3 className="my-exhibition-card__title">{exhibition.title}</h3>
                <div className="my-exhibition-card__info">
                    <span>📅 {formatDate(exhibition.date)}</span>
                    <span>📍 {exhibition.address}</span>
                    <span>💰 {exhibition.cost}</span>
                </div>

                {/* Посетители */}
                <div className="my-exhibition-card__section">
                    <div 
                        className="my-exhibition-card__section-header" 
                        onClick={() => setShowVisitors(!showVisitors)}
                        style={{ cursor: 'pointer' }}
                    >
                        <span>👥 {lang.visitors} ({formatVisitorsCount(exhibition.visitors_count)})</span>
                        {exhibition.max_visitors && (
                            <span className="my-exhibition-card__visitors-limit">
                                / {formatVisitorsCount(exhibition.max_visitors)} {lang.max}
                            </span>
                        )}
                    </div>
                    {showVisitors && (
                        <div className="my-exhibition-card__visitors-info">
                            <div className="my-exhibition-card__visitors-stats">
                                <div className="my-exhibition-card__visitors-stat">
                                    <span className="stat-label">{lang.currentVisitors}</span>
                                    <span className="stat-value">{exhibition.visitors_count || 0}</span>
                                </div>
                                {exhibition.max_visitors && (
                                    <>
                                        <div className="my-exhibition-card__visitors-stat">
                                            <span className="stat-label">{lang.maxVisitors}</span>
                                            <span className="stat-value">{exhibition.max_visitors}</span>
                                        </div>
                                        <div className="my-exhibition-card__visitors-progress">
                                            <div 
                                                className="my-exhibition-card__visitors-progress-bar"
                                                style={{ 
                                                    width: `${((exhibition.visitors_count || 0) / exhibition.max_visitors) * 100}%`,
                                                    background: ((exhibition.visitors_count || 0) / exhibition.max_visitors) > 0.9 
                                                        ? '#f44336' 
                                                        : ((exhibition.visitors_count || 0) / exhibition.max_visitors) > 0.7 
                                                            ? '#ff9800' 
                                                            : '#4caf50'
                                                }}
                                            />
                                        </div>
                                        <div className="my-exhibition-card__visitors-percent">
                                            {lang.filled} {Math.round(((exhibition.visitors_count || 0) / exhibition.max_visitors) * 100)}%
                                        </div>
                                    </>
                                )}
                            </div>
                            
                            {exhibition.visitors_details && (
                                <div className="my-exhibition-card__visitors-details">
                                    <h4>{lang.details}</h4>
                                    <ul>
                                        {exhibition.visitors_details.map((detail: any, idx: number) => (
                                            <li key={idx}>
                                                {detail.date}: {detail.count} {lang.visitorsCount}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Картины */}
                <div className="my-exhibition-card__section">
                    <div className="my-exhibition-card__section-header" onClick={() => setShowArts(!showArts)}>
                        <span>🖼️ {lang.paintings} ({exhibition.arts?.length || 0})</span>
                        <button className="my-exhibition-card__add-btn" onClick={(e) => { e.stopPropagation(); onAddArt(); }}>
                            + {lang.add}
                        </button>
                    </div>
                    {showArts && (
                        <div className="my-exhibition-card__list">
                            {exhibition.arts?.length > 0 ? (
                                exhibition.arts.map((art: any) => (
                                    <div key={art.id} className="my-exhibition-card__list-item">
                                        <span>{art.title}</span>
                                        <button
                                            className="my-exhibition-card__remove-btn"
                                            onClick={() => onRemoveArt(art.id)}
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <div className="my-exhibition-card__empty">{lang.noPaintings}</div>
                            )}
                        </div>
                    )}
                </div>

                {/* Художники */}
                <div className="my-exhibition-card__section">
                    <div className="my-exhibition-card__section-header" onClick={() => setShowArtists(!showArtists)}>
                        <span>👨‍🎨 {lang.artists} ({exhibition.artists?.length || 0})</span>
                        <button className="my-exhibition-card__add-btn" onClick={(e) => { e.stopPropagation(); onAddArtist(); }}>
                            + {lang.add}
                        </button>
                    </div>
                    {showArtists && (
                        <div className="my-exhibition-card__list">
                            {exhibition.artists?.length > 0 ? (
                                exhibition.artists.map((artist: any) => (
                                    <div key={artist.user_id} className="my-exhibition-card__list-item">
                                        <span>{artist.user?.surname} {artist.user?.name}</span>
                                        <button
                                            className="my-exhibition-card__remove-btn"
                                            onClick={() => onRemoveArtist(artist.user_id)}
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <div className="my-exhibition-card__empty">{lang.noArtists}</div>
                            )}
                        </div>
                    )}
                </div>

                {isOwner && (
                    <div className="my-exhibition-card__actions">
                        <button className="my-exhibition-card__edit-btn" onClick={onUpdate}>
                            ✏️ {lang.edit}
                        </button>
                        <button className="my-exhibition-card__delete-btn" onClick={onDelete}>
                            🗑️ {lang.delete}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};