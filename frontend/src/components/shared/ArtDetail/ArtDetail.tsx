import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getArtById, type Art, type CurrencyType } from '../../../api/arts/main.api';
import { useNotification } from '../../../context/NotificationContext';
import { useAuth } from '../../../hooks/useAuth';
import { useArtLikes } from '../../../hooks/useArtLikes';
import { useLanguage } from '../../../context/LanguageContext';
import { artDetailTranslations } from './lang';
import './index.css';

export const ArtDetail = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { showNotification } = useNotification();
    const { language } = useLanguage();
    const lang = artDetailTranslations[language];

    const [art, setArt] = useState<Art | null>(null);
    const [loading, setLoading] = useState(true);
    const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

    const { likesCount, isLiked, loading: likeLoading, handleLike } = useArtLikes(
        Number(id),
        art?.likes ?? 0
    );

    const isOwner = art?.artist?.user?.id === user?.id;
    
    useEffect(() => {
        loadArt();
    }, [id]);

    const loadArt = async () => {
        setLoading(true);
        try {
            const data = await getArtById(Number(id));
            if (data) {
                setArt(data);
            }
        } catch (error) {
            showNotification("Ошибка при загрузке картины", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = () => {
        navigate(`/arts/my/edit/${art?.id}`);
    };

    const handleTagClick = (type: 'genre' | 'type', id: number, name: string) => {
        // TODO: navigate(`/catalog?${type}=${id}`)
    };

    const handleCopyLink = async () => {
        try {
            const currentUrl = window.location.href;
            await navigator.clipboard.writeText(currentUrl);
            showNotification(lang.copySuccess, "success");
        } catch (err) {
            showNotification(lang.copyError, "error");
            console.error('Failed to copy:', err);
        }
    };

    const handleShare = async (platform: string) => {
        const currentUrl = window.location.href;
        const title = art?.title || 'Artwork';

        let shareUrl = '';
        switch (platform) {
            case 'facebook':
                shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`;
                break;
            case 'twitter':
                shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(currentUrl)}`;
                break;
            case 'telegram':
                shareUrl = `https://t.me/share/url?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(title)}`;
                break;
            default:
                return;
        }

        window.open(shareUrl, '_blank', 'noopener,noreferrer,width=600,height=400');
    };

    const formatPrice = (cost?: number, currency?: CurrencyType) => {
        if (!cost) return lang.priceNotSet;
        const symbols: Record<string, string> = { USD: "$", EUR: "€", RUB: "₽", UAH: "₴" };
        return `${cost.toLocaleString()} ${symbols[currency as string] || currency}`;
    };

    const formatDate = (date: Date | string) => {
        const locale = language === 'ru' ? 'ru-RU' : 'en-US';
        return new Date(date).toLocaleDateString(locale, {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const getMetadataKey = (key: string): string => {
        const metadataKeys = lang.metadataKeys as Record<string, string>;
        return metadataKeys[key] || key;
    };

    const parseMetadata = (metadata?: string) => {
        if (!metadata) return [];
        try {
            return Object.entries(JSON.parse(metadata));
        } catch {
            return [];
        }
    };
    
    if (loading) {
        return (
            <div className="art-detail__loading">
                <div className="art-detail__loading-spinner"></div>
                <p className="art-detail__loading-text">{lang.loading}</p>
            </div>
        );
    }

    if (!art) {
        return (
            <div className="art-detail__error">
                <div className="art-detail__error-icon">🎨</div>
                <h2 className="art-detail__error-title">{lang.error.title}</h2>
                <p className="art-detail__error-text">{lang.error.text}</p>
                <button className="art-detail__error-btn" onClick={() => navigate('/')}>
                    {lang.error.button}
                </button>
            </div>
        );
    }

    return (
        <>
            <div className="art-detail">
                <div className="art-detail__hero">
                    <div className="art-detail__hero-bg-wrapper">
                        <img src={art.image_path} alt="" className="art-detail__hero-bg" />
                        <div className="art-detail__hero-overlay"></div>
                    </div>

                    <div className="art-detail__container">
                        <div className="art-detail__image-wrapper">
                            <img
                                src={art.image_path}
                                alt={art.title}
                                className="art-detail__image"
                                onClick={() => setFullscreenImage(art.image_path)}
                            />
                            <button
                                className="art-detail__expand-btn"
                                onClick={() => setFullscreenImage(art.image_path)}
                            >
                                🔍
                            </button>
                            {isOwner && (
                                <button
                                    className="art-detail__edit-btn"
                                    onClick={handleEdit}
                                    title={lang.edit}
                                >
                                    ✏️
                                </button>
                            )}
                        </div>
                    </div>
                </div>
                <div className="art-detail__content">
                    <div className="art-detail__container">
                        <div className="art-detail__nav">
                            <button className="art-detail__nav-btn" onClick={() => navigate(-1)}>
                                ← {lang.nav.back}
                            </button>
                            <div className="art-detail__breadcrumbs">
                                <span onClick={() => navigate('/')}>{lang.nav.home}</span>
                                <span className="art-detail__breadcrumbs-sep">/</span>
                                <span onClick={() => navigate('/arts')}>{lang.nav.gallery}</span>
                                <span className="art-detail__breadcrumbs-sep">/</span>
                                <span className="art-detail__breadcrumbs-current">{art.title}</span>
                            </div>
                            {isOwner && (
                                <button className="art-detail__edit-mobile-btn" onClick={handleEdit}>
                                    ✏️ {lang.edit}
                                </button>
                            )}
                        </div>

                        <div className="art-detail__grid">
                            <div className="art-detail__main">
                                <div className="art-detail__title-wrapper">
                                    <h1 className="art-detail__title">{art.title}</h1>
                                    {isOwner && (
                                        <button className="art-detail__title-edit-btn" onClick={handleEdit}>
                                            ✏️
                                        </button>
                                    )}
                                </div>

                                <div className="art-detail__tags">
                                    {art.genre && (
                                        <button
                                            className="art-detail__tag"
                                            onClick={() => handleTagClick('genre', art.genre!.id, art.genre!.title)}
                                        >
                                            # {art.genre.title}
                                        </button>
                                    )}
                                    {art.style && (
                                        <button
                                            className="art-detail__tag"
                                            onClick={() => handleTagClick('type', art.style!.id, art.style!.name)}
                                        >
                                            # {art.style.name}
                                        </button>
                                    )}
                                </div>

                                <div className="art-detail__section">
                                    <h3 className="art-detail__section-title">{lang.description}</h3>
                                    <p className="art-detail__description">{art.description}</p>
                                </div>

                                {parseMetadata(art.metadata).length > 0 && (
                                    <div className="art-detail__section">
                                        <h3 className="art-detail__section-title">{lang.characteristics}</h3>
                                        <div className="art-detail__metadata">
                                            {parseMetadata(art.metadata).map(([key, value]) => (
                                                <div key={key} className="art-detail__metadata-item">
                                                    <span className="art-detail__metadata-key">
                                                        {getMetadataKey(key)}
                                                    </span>
                                                    <span className="art-detail__metadata-value">{String(value)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="art-detail__section">
                                    <h3 className="art-detail__section-title">{lang.info}</h3>
                                    <div className="art-detail__info-grid">
                                        <div className="art-detail__info-item">
                                            <span className="art-detail__info-icon">📅</span>
                                            <div>
                                                <div className="art-detail__info-label">{lang.dateCreated}</div>
                                                <div className="art-detail__info-value">{formatDate(art.date_published)}</div>
                                            </div>
                                        </div>
                                        {art.city && (
                                            <div className="art-detail__info-item">
                                                <span className="art-detail__info-icon">📍</span>
                                                <div>
                                                    <div className="art-detail__info-label">{lang.location}</div>
                                                    <div className="art-detail__info-value">
                                                        {art.city.name}{art.country ? `, ${art.country.name}` : ''}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="art-detail__sidebar">
                                <div className="art-detail__card">
                                    <div className="art-detail__price">
                                        <span className="art-detail__price-label">{lang.price}</span>
                                        <span className="art-detail__price-value">{formatPrice(art.cost, art?.currency)}</span>
                                    </div>

                                    <div className="art-detail__likes">
                                        <button
                                            className={`art-detail__like-btn ${isLiked ? 'art-detail__like-btn--active' : ''}`}
                                            onClick={handleLike}
                                            disabled={likeLoading}
                                        >
                                            {likeLoading ? '⏳' : (isLiked ? '❤️' : '🤍')} {likesCount}
                                        </button>
                                    </div>

                                    {isOwner && (
                                        <button className="art-detail__edit-sidebar-btn" onClick={handleEdit}>
                                            ✏️ {lang.edit}
                                        </button>
                                    )}

                                    <button className="art-detail__buy-btn" onClick={() => navigate("/buy")}>
                                        {lang.buy}
                                    </button>
                                    <button className="art-detail__contact-btn" onClick={() => navigate("/contact-artist")}>
                                        {lang.contact}
                                    </button>
                                </div>

                                {art.artist && (
                                    <div className="art-detail__artist">
                                        <div className="art-detail__artist-avatar">
                                            {art?.artist?.user?.avatar_path ? (
                                                <img src={art.artist.user.avatar_path} alt={art.artist.user.name} />
                                            ) : (
                                                <div className="art-detail__artist-avatar-placeholder">
                                                    {art?.artist?.user?.name?.[0]}{art?.artist?.user?.surname?.[0]}
                                                </div>
                                            )}
                                        </div>
                                        <div className="art-detail__artist-info">
                                            <div className="art-detail__artist-name">
                                                {art?.artist?.user?.surname} {art?.artist?.user?.name}
                                            </div>
                                            <div className="art-detail__artist-role">{lang.artist}</div>
                                            <a className="art-detail__artist-btn" href={`/artists/${art?.artist?.user?.id}`}>
                                                {lang.viewProfile}
                                            </a>
                                        </div>
                                    </div>
                                )}
                                <div className="art-detail__share">
                                    <span className="art-detail__share-label">{lang.share}</span>
                                    <div className="art-detail__share-buttons">
                                        <button
                                            className="art-detail__share-btn"
                                            onClick={() => handleShare('facebook')}
                                            title={lang.shareTitles.facebook}
                                        >
                                            📘
                                        </button>
                                        <button
                                            className="art-detail__share-btn"
                                            onClick={() => handleShare('twitter')}
                                            title={lang.shareTitles.twitter}
                                        >
                                            🐦
                                        </button>
                                        <button
                                            className="art-detail__share-btn"
                                            onClick={() => handleShare('telegram')}
                                            title={lang.shareTitles.telegram}
                                        >
                                            💬
                                        </button>
                                        <button
                                            className="art-detail__share-btn"
                                            onClick={handleCopyLink}
                                            title={lang.copyLink}
                                        >
                                            🔗
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Fullscreen Modal */}
            {fullscreenImage && (
                <div className="art-detail__fullscreen" onClick={() => setFullscreenImage(null)}>
                    <div className="art-detail__fullscreen-content">
                        <img src={fullscreenImage} alt={art.title} />
                        <button className="art-detail__fullscreen-close" onClick={() => setFullscreenImage(null)}>
                            ✕
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};