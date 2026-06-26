import { useState } from 'react';
import { useAuth } from '../../../../hooks/useAuth';
import { useLanguage } from '../../../../context/LanguageContext';
import type { Art } from '../../../../api/arts/main.api';
import { artCardTranslations } from './lang';
import './index.css';
import { AgeVerificationModal } from '../../../ui/AgeVerificationModal/AgeVerificationModal';

interface ArtCardProps {
    art: Art;
    viewMode: 'grid' | 'list';
    onClick: () => void;
}

export const ArtCard = ({ art, viewMode, onClick }: ArtCardProps) => {
    const { isAuthenticated } = useAuth();
    const { language } = useLanguage();
    const lang = artCardTranslations[language];
    
    const [isAdultVerified, setIsAdultVerified] = useState(false);
    const [showAgeModal, setShowAgeModal] = useState(false);
    const [isAgeCheckFailed, setIsAgeCheckFailed] = useState(false);

    const isAdultContent = art.is_adult === true;

    const saveVerification = () => {
        localStorage.setItem('adult_verified', 'true');
        localStorage.setItem('adult_verified_date', new Date().toISOString());
    };

    const checkStoredVerification = (): boolean => {
        const verified = localStorage.getItem('adult_verified');
        const verifiedDate = localStorage.getItem('adult_verified_date');
        if (verified === 'true' && verifiedDate) {
            const daysSince = (Date.now() - new Date(verifiedDate).getTime()) / (1000 * 60 * 60 * 24);
            if (daysSince < 30) {
                return true;
            }
        }
        return false;
    };

    const handleAgeSuccess = () => {
        setIsAdultVerified(true);
        saveVerification();
        setShowAgeModal(false);
    };

    const handleAgeFail = () => {
        setIsAgeCheckFailed(true);
        setIsAdultVerified(false);
        setShowAgeModal(false);
    };

    const handleCardClick = () => {
        if (!isAdultContent) {
            onClick();
            return;
        }

        if (!isAuthenticated) {
            // TODO: Показать модалку с предложением войти
            return;
        }

        if (checkStoredVerification() || isAdultVerified) {
            onClick();
            return;
        }

        if (isAgeCheckFailed) {
            return;
        }

        setShowAgeModal(true);
    };

    const handleVerifyClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowAgeModal(true);
    };

    const getArtistName = () => {
        return `${art.artist?.user?.surname || ''} ${art.artist?.user?.name || ''}`.trim() || lang.unknownArtist;
    };

    const getArtistInitials = () => {
        const surname = art.artist?.user?.surname?.[0] || '';
        const name = art.artist?.user?.name?.[0] || '';
        return `${surname}${name}`;
    };

    const isBlocked = isAdultContent && !isAdultVerified && !checkStoredVerification() && !isAgeCheckFailed;

    return (
        <>
            <div 
                className={`art-card art-card--${viewMode} ${isBlocked ? 'art-card--blocked' : ''}`} 
                onClick={handleCardClick}
            >
                <div className="art-card__image-wrapper">
                    <img 
                        src={art.image_path} 
                        alt={art.title} 
                        className="art-card__image" 
                    />
                    <div className="art-card__overlay">
                        <button className="art-card__view-btn">{lang.quickView}</button>
                    </div>
                    <div className="art-card__likes">
                        ❤️ {art.likes || 0}
                    </div>
                    {isAdultContent && (
                        <div className="art-card__adult-badge">🔞 {lang.adultWarning}</div>
                    )}
                    {isBlocked && (
                        <div className="art-card__adult-overlay" onClick={(e) => e.stopPropagation()}>
                            <div className="art-card__adult-icon">🔞</div>
                            <div className="art-card__adult-text">{lang.adultWarning}</div>
                            <button 
                                className="art-card__adult-btn"
                                onClick={handleVerifyClick}
                            >
                                {lang.confirmAge}
                            </button>
                        </div>
                    )}
                </div>

                <div className="art-card__content">
                    <h3 className="art-card__title">{art.title}</h3>

                    <div className="art-card__artist">
                        {art.artist?.user?.avatar_path ? (
                            <img
                                src={art.artist.user.avatar_path}
                                alt={getArtistName()}
                                className="art-card__artist-avatar"
                            />
                        ) : (
                            <div className="art-card__artist-avatar-placeholder">
                                {getArtistInitials()}
                            </div>
                        )}
                        <span className="art-card__artist-name">{getArtistName()}</span>
                    </div>

                    <div className="art-card__tags">
                        {art.genre && (
                            <span className="art-card__tag">{art.genre.title}</span>
                        )}
                        {art.style && (
                            <span className="art-card__tag">{art.style.name}</span>
                        )}
                    </div>
                </div>
            </div>

            <AgeVerificationModal
                isOpen={showAgeModal}
                onClose={() => setShowAgeModal(false)}
                onSuccess={handleAgeSuccess}
                onFail={handleAgeFail}
            />
        </>
    );
};