import { useState, useEffect } from 'react';
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

    const { isLiked, likesCount, handleLikeClick } = useArtLikes(art?.id || undefined);

    useEffect(() => { loadArt(); }, [id]);

    const loadArt = async () => {
        try {
            const data = await getArtById(Number(id));
            if (data) {
                setArt(data);
            } else {
                showNotification('Картина не найдена', "error");
                navigate("/arts");
            }
        } catch (e) { console.error('Load error:', e); showNotification('Ошибка загрузки', "error"); }
        finally { setLoading(false); }
    };

    const formatDate = (dateString?: string | null) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString(language === 'ru' ? 'ru-RU' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    const formatPrice = (cost?: number | null, currency?: string | null): string => {
        if (!cost) return 'Бесплатно';
        const symbols: Record<string, string> = { USD: '$', EUR: '€', RUB: '₽', UAH: '₴' };
        return `${cost}${symbols[currency || ''] || currency || ''}`;
    };

    if (loading) return <div className="art-detail__loading"><div className="art-detail__spinner"></div><p>{lang.loading}</p></div>;
    if (!art) return <div className="art-detail__not-found">{lang.notFound}</div>;

    return (
        <div className="art-detail">
            <div className="art-detail__header"><h1>{art.title}</h1></div>

            <div className="art-detail__main">
                <div className="art-detail__image-section">
                    {art.image_path && (
                        <div className="art-detail__image-container">
                            <img src={art.image_path} alt={art.title} className="art-detail__image" onClick={() => openFullscreen(art.image_path!)} />
                        </div>
                    )}
                </div>

                <div className="art-detail__sidebar">
                    <div className="art-detail__card">
                        <div className="art-detail__price">{formatPrice(art.cost, art.currency)}</div>
                        <div className="art-detail__likes">
                            <button className={`art-detail__like-btn ${isLiked ? 'art-detail__like-btn--active' : ''}`} onClick={handleLikeClick}>❤️ <span>{likesCount}</span></button>
                            <div className="art-detail__views">👁️ {art.views || 0}</div>
                        </div>
                        <div className="art-detail__description">{art.description}</div>
                    </div>

                    <div className="art-detail__card">
                        <h3>{lang.artist}</h3>
                        {art.artist ? (
                            <div className="art-detail__artist" onClick={() => navigate(`/artists/${art.artist.user_id}`)}>
                                <div className="art-detail__artist-info">
                                    <div className="art-detail__artist-name">{art.artist.user?.surname} {art.artist.user?.name}</div>
                                    {art.artist.user?.avatar_path && (<img src={art.artist.user.avatar_path} alt="" className="art-detail__artist-avatar" />)}
                                </div>
                            </div>
                        ) : <p>Художник не указан</p>}
                    </div>

                    <div className="art-detail__card">
                        <h3>{lang.details}</h3>
                        <div className="art-detail__info-list">
                            <div className="art-detail__info-item"><span className="art-detail__info-label">📅 Дата публикации:</span><span>{formatDate(art.date_published)}</span></div>
                            {art.city && (<div className="art-detail__info-item"><span className="art-detail__info-label">🏙️ Город:</span><span>{art.city.name_en || '-'}</span></div>)}
                            {art.country && (<div className="art-detail__info-item"><span className="art-detail__info-label">🌍 Страна:</span><span>{art.country.name_en || '-'}</span></div>)}
                            {art.genre && (<div className="art-detail__info-item"><span className="art-detail__info-label">🎭 Жанр:</span><span>{art.genre.title}</span></div>)}
                            {art.style && (<div className="art-detail__info-item"><span className="art-detail__info-label">🎨 Стиль:</span><span>{art.style.name}</span></div>)}
                        </div>
                    </div>

                    {art.specifications && art.specifications !== '{}' && (
                        <div className="art-detail__card">
                            <h3>{lang.metadata}</h3>
                            <pre className="art-detail__metadata">{JSON.stringify(JSON.parse(art.specifications), null, 2)}</pre>
                        </div>
                    )}

                    {user?.id === art.artist?.user?.id && (
                        <button className="art-detail__edit-btn" onClick={() => navigate(`/arts/my/edit/${art.id}`)}>✏️ {lang.edit}</button>
                    )}
                </div>
            </div>

            {fullscreenImage && (
                <div className="art-detail__fullscreen" onClick={() => setFullscreenImage(null)}>
                    <div className="art-detail__fullscreen-content" onClick={(e) => e.stopPropagation()}>
                        <img src={fullscreenImage} alt="Fullscreen art" />
                        <button className="art-detail__fullscreen-close" onClick={() => setFullscreenImage(null)}>×</button>
                    </div>
                </div>
            )}
        </div>
    );
};
