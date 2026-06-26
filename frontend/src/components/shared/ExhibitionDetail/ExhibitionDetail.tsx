import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../../context/LanguageContext';
import { exhibitionDetailTranslations } from './lang';
import { useNotification } from '../../../context/NotificationContext';
import { useAuth } from '../../../hooks/useAuth';
import { useConfirm } from '../../../hooks/useConfirm';
import { useExhibitionLike } from '../../../hooks/useExhibitionLike';
import { getExhibitionById, signUpToExhibition, cancelSignUp, type Exhibition, checkSignUpStatus } from '../../../api/exhibitions/main.api';
import './ExhibitionDetail.css';

const redirectStorage = {
    setRedirectUrl: (url: string) => {
        localStorage.setItem('redirect_after_login', url);
    },
    clearRedirectUrl: () => {
        localStorage.removeItem('redirect_after_login');
    }
};

export const ExhibitionDetail = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuth();
    const { confirm } = useConfirm();
    const { showNotification } = useNotification();
    const { language } = useLanguage();
    const lang = exhibitionDetailTranslations[language];

    const [exhibition, setExhibition] = useState<Exhibition | null>(null);
    const [loading, setLoading] = useState(true);
    const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
    const [isSignedUp, setIsSignedUp] = useState(false);
    const [accessDenied, setAccessDenied] = useState(false);

    const { isLiked, loading: likeLoading, toggleLike } = useExhibitionLike(Number(id));
    
    useEffect(() => {
        loadExhibition();
    }, [id]);

    useEffect(() => {
        if (exhibition && isAuthenticated && user) {
            checkSignUpStatus(Number(id), user.id).then(setIsSignedUp);
        }
    }, [exhibition, isAuthenticated, user, id]);

    const loadExhibition = async () => {
        setLoading(true);
        try {
            const data = await getExhibitionById(Number(id));

            if (data) {
                const isModerated = data?.moderate?.moderate || data?.moderate;
                const isOwner = data.owner_id === user?.id;
                const isAdmin = user?.role === 'admin';
                const isModerator = user?.role === 'moderator';

                if (!isModerated && !isOwner && !isAdmin && !isModerator) {
                    setAccessDenied(true);
                    setExhibition(null);
                    return;
                }
                setExhibition(data);
            } else {
                showNotification(lang.notifications.notFound, "error");
            }
        } catch (error) {
            showNotification(lang.notifications.loadError, "error");
        } finally {
            setLoading(false);
        }
    };

    const handleSignUp = async () => {
        const exhibitionId = Number(id);

        if (!isAuthenticated || !user) {
            redirectStorage.setRedirectUrl(window.location.pathname);
            showNotification(lang.notifications.needAuth, "error");
            navigate('/login');
            return;
        }

        const success = await signUpToExhibition(exhibitionId, user.id);
        if (success) {
            setIsSignedUp(true);
            showNotification(lang.notifications.signUpSuccess, "success");
            setExhibition(prev => prev ? { ...prev, visitors_count: (prev.visitors_count || 0) + 1 } : prev);
        } else {
            showNotification(lang.notifications.signUpError, "error");
        }
    };

    const handleCancelSignUp = async () => {
        const confirmed = await confirm({
            title: lang.confirm.title,
            message: lang.confirm.message,
            confirmText: lang.confirm.confirmText,
            cancelText: lang.confirm.cancelText,
            type: "warning"
        });

        if (!confirmed) return;

        const exhibitionId = Number(id);
        const success = await cancelSignUp(exhibitionId, user!.id);
        if (success) {
            setIsSignedUp(false);
            showNotification(lang.notifications.cancelSuccess, "success");
            setExhibition(prev => prev ? { ...prev, visitors_count: Math.max((prev.visitors_count || 0) - 1, 0) } : prev);
        } else {
            showNotification(lang.notifications.cancelError, "error");
        }
    };

    const handleArtClick = (artId: number) => navigate(`/arts/${artId}`);
    const handleArtistClick = (artistId: number) => navigate(`/artists/${artistId}`);

    const formatDate = (dateString: string) => {
        const locale = language === 'en' ? 'en-US' : 'ru-RU';
        return new Date(dateString).toLocaleDateString(locale, {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const hasImage = exhibition?.image_path && exhibition.image_path.trim() !== '' && exhibition.image_path !== 'null';

    // Функция для форматирования цены с валютой
    const formatPrice = (cost: string, currency?: string) => {
        const currencySymbols: Record<string, string> = {
            RUB: '₽',
            USD: '$',
            EUR: '€',
            UAH: '₴'
        };
        
        const symbol = currency ? currencySymbols[currency] || currency : '₽';
        return `${cost} ${symbol}`;
    };

    if (loading) {
        return (
            <div className="exhibition-detail__loading">
                <div className="exhibition-detail__spinner"></div>
                <p>{lang.loading}</p>
            </div>
        );
    }

    if (accessDenied) {
        return (
            <div className="exhibition-detail__error">
                <div className="exhibition-detail__error-icon">🔒</div>
                <h2>{lang.accessDenied.title}</h2>
                <p>{lang.accessDenied.description}</p>
                <button className="exhibition-detail__error-btn" onClick={() => navigate('/exhibitions')}>
                    {lang.accessDenied.button}
                </button>
            </div>
        );
    }

    if (!exhibition) {
        return (
            <div className="exhibition-detail__error">
                <div className="exhibition-detail__error-icon">🏛️</div>
                <h2>{lang.notFound.title}</h2>
                <p>{lang.notFound.description}</p>
                <button className="exhibition-detail__error-btn" onClick={() => navigate('/exhibitions')}>
                    {lang.notFound.button}
                </button>
            </div>
        );
    }

    return (
        <>
            <div className="exhibition-detail">
                {hasImage && (
                    <div className="exhibition-detail__hero">
                        <div className="exhibition-detail__hero-bg-wrapper">
                            <img src={exhibition.image_path} alt="" className="exhibition-detail__hero-bg" />
                            <div className="exhibition-detail__hero-overlay"></div>
                        </div>
                        <div className="exhibition-detail__container">
                            <div className="exhibition-detail__image-wrapper">
                                <img
                                    src={exhibition.image_path}
                                    alt={exhibition.title}
                                    className="exhibition-detail__image"
                                    onClick={() => setFullscreenImage(exhibition.image_path!)}
                                />
                                <button
                                    className="exhibition-detail__expand-btn"
                                    onClick={() => setFullscreenImage(exhibition.image_path!)}
                                >
                                    🔍
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                {!hasImage && (
                    <div className="exhibition-detail__hero-no-image">
                        <div className="exhibition-detail__container">
                            <div className="exhibition-detail__image-placeholder">
                                <span className="exhibition-detail__placeholder-icon">🏛️</span>
                                <span className="exhibition-detail__placeholder-text">
                                    {exhibition.title.slice(0, 2).toUpperCase()}
                                </span>
                            </div>
                        </div>
                    </div>
                )}
                <div className="exhibition-detail__content">
                    <div className="exhibition-detail__container">
                        <div className="exhibition-detail__nav">
                            <button className="exhibition-detail__nav-btn" onClick={() => navigate('/exhibitions')}>
                                {lang.nav.allExhibitions}
                            </button>
                            <div className="exhibition-detail__breadcrumbs">
                                <span onClick={() => navigate('/')}>{lang.nav.home}</span>
                                <span className="exhibition-detail__breadcrumbs-sep">/</span>
                                <span onClick={() => navigate('/exhibitions')}>{lang.nav.exhibitions}</span>
                                <span className="exhibition-detail__breadcrumbs-sep">/</span>
                                <span className="exhibition-detail__breadcrumbs-current">{exhibition.title}</span>
                            </div>
                        </div>

                        <div className="exhibition-detail__grid">
                            <div className="exhibition-detail__main">
                                <h1 className="exhibition-detail__title">{exhibition.title}</h1>
                                <div className="exhibition-detail__meta">
                                    <div className="exhibition-detail__meta-item">
                                        <span className="exhibition-detail__meta-icon">📅</span>
                                        <div>
                                            <div className="exhibition-detail__meta-label">{lang.labels.date}</div>
                                            <div className="exhibition-detail__meta-value">{formatDate(exhibition.date)}</div>
                                        </div>
                                    </div>
                                    <div className="exhibition-detail__meta-item">
                                        <span className="exhibition-detail__meta-icon">📍</span>
                                        <div>
                                            <div className="exhibition-detail__meta-label">{lang.labels.location}</div>
                                            <div className="exhibition-detail__meta-value">{exhibition.address}</div>
                                        </div>
                                    </div>
                                    {exhibition.city && (
                                        <div className="exhibition-detail__meta-item">
                                            <span className="exhibition-detail__meta-icon">🏙️</span>
                                            <div>
                                                <div className="exhibition-detail__meta-label">{lang.labels.city}</div>
                                                <div className="exhibition-detail__meta-value">
                                                    {exhibition.city.name}
                                                    {exhibition.country && `, ${exhibition.country.name}`}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="exhibition-detail__section">
                                    <h3 className="exhibition-detail__section-title">{lang.labels.about}</h3>
                                    <div className="exhibition-detail__description">
                                        {exhibition.description.split('\n').map((paragraph, index) => (
                                            <p key={index}>{paragraph}</p>
                                        ))}
                                    </div>
                                </div>
                                {exhibition.arts && exhibition.arts.length > 0 && (
                                    <div className="exhibition-detail__section">
                                        <h3 className="exhibition-detail__section-title">{lang.labels.paintings}</h3>
                                        <div className="exhibition-detail__arts">
                                            {exhibition.arts.map(art => (
                                                <div key={art.id} className="exhibition-detail__art-card" onClick={() => handleArtClick(art.id)}>
                                                    <div className="exhibition-detail__art-image-wrapper">
                                                        {art.image_path ? (
                                                            <img src={art.image_path} alt="" />
                                                        ) : (
                                                            <div className="exhibition-detail__art-placeholder">
                                                                <span>🖼️</span>
                                                            </div>
                                                        )}
                                                        <div className="exhibition-detail__art-overlay">
                                                            <span>🔍</span>
                                                        </div>
                                                    </div>
                                                    <div className="exhibition-detail__art-info">
                                                        <h4 className="exhibition-detail__art-title">{art.title}</h4>
                                                        <div className="exhibition-detail__art-likes">❤️ {art.likes || 0}</div>
                                                        {art.cost && (
                                                            <div className="exhibition-detail__art-cost">💰 {art.cost.toLocaleString()} ₽</div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {exhibition.artists && exhibition.artists.length > 0 && (
                                    <div className="exhibition-detail__section">
                                        <h3 className="exhibition-detail__section-title">{lang.labels.artists}</h3>
                                        <div className="exhibition-detail__artists">
                                            {exhibition.artists.map(artist => (
                                                <div key={artist.user_id} className="exhibition-detail__artist-card" onClick={() => handleArtistClick(artist.user_id)}>
                                                    {artist.user?.avatar_path ? (
                                                        <img src={artist.user.avatar_path} alt="" />
                                                    ) : (
                                                        <div className="exhibition-detail__artist-avatar-placeholder">
                                                            {artist.user?.surname?.[0]}{artist.user?.name?.[0]}
                                                        </div>
                                                    )}
                                                    <div className="exhibition-detail__artist-info">
                                                        <div className="exhibition-detail__artist-name">
                                                            {artist.user?.surname} {artist.user?.name}
                                                        </div>
                                                        <div className="exhibition-detail__artist-role">{lang.labels.artists.slice(0, -4)}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="exhibition-detail__sidebar">
                                <div className="exhibition-detail__card">
                                    <div className="exhibition-detail__price">
                                        <span className="exhibition-detail__price-label">{lang.labels.ticketPrice}</span>
                                        <span className="exhibition-detail__price-value">
                                            {formatPrice(exhibition.cost, exhibition.currency)}
                                        </span>
                                    </div>
                                    <div className="exhibition-detail__visitors">
                                        👥 {lang.labels.visitors}: {exhibition.visitors_count || 0}
                                    </div>

                                    {isSignedUp ? (
                                        <button className="exhibition-detail__cancel-btn" onClick={handleCancelSignUp}>
                                            {lang.buttons.cancelSignUp}
                                        </button>
                                    ) : (
                                        <button className="exhibition-detail__signup-btn" onClick={handleSignUp}>
                                            {lang.buttons.signUp}
                                        </button>
                                    )}

                                    <button
                                        className="exhibition-detail__like-btn"
                                        onClick={toggleLike}
                                        disabled={likeLoading}
                                    >
                                        {likeLoading ? '⏳' : (isLiked ? '❤️' : '🤍')} {lang.labels.interested}
                                    </button>
                                </div>
                                <div className="exhibition-detail__info-card">
                                    <h4 className="exhibition-detail__info-title">{lang.labels.details}</h4>
                                    <div className="exhibition-detail__info-list">
                                        {exhibition.type && (
                                            <div className="exhibition-detail__info-item">
                                                <span className="exhibition-detail__info-icon">🏷️</span>
                                                <span>{lang.labels.type}: {exhibition.type.name}</span>
                                            </div>
                                        )}
                                        {exhibition.genre && (
                                            <div className="exhibition-detail__info-item">
                                                <span className="exhibition-detail__info-icon">🎨</span>
                                                <span>{lang.labels.genre}: {exhibition.genre.title}</span>
                                            </div>
                                        )}
                                        {exhibition.currency && (
                                            <div className="exhibition-detail__info-item">
                                                <span className="exhibition-detail__info-icon">💵</span>
                                                <span>{lang.labels.currency}: {exhibition.currency}</span>
                                            </div>
                                        )}
                                        <div className="exhibition-detail__info-item">
                                            <span className="exhibition-detail__info-icon">🖼️</span>
                                            <span>{lang.labels.paintingsCount}: {exhibition.arts?.length || 0}</span>
                                        </div>
                                        <div className="exhibition-detail__info-item">
                                            <span className="exhibition-detail__info-icon">👨‍🎨</span>
                                            <span>{lang.labels.artistsCount}: {exhibition.artists?.length || 0}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="exhibition-detail__share">
                                    <span className="exhibition-detail__share-label">{lang.labels.share}</span>
                                    <div className="exhibition-detail__share-buttons">
                                        <button className="exhibition-detail__share-btn">📘</button>
                                        <button className="exhibition-detail__share-btn">🐦</button>
                                        <button className="exhibition-detail__share-btn">📷</button>
                                        <button className="exhibition-detail__share-btn">💬</button>
                                        <button className="exhibition-detail__share-btn">🔗</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {fullscreenImage && (
                <div className="exhibition-detail__fullscreen" onClick={() => setFullscreenImage(null)}>
                    <div className="exhibition-detail__fullscreen-content">
                        <img src={fullscreenImage} alt={exhibition.title} />
                        <button className="exhibition-detail__fullscreen-close" onClick={() => setFullscreenImage(null)}>
                            ✕
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default ExhibitionDetail;