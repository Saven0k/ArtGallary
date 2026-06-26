import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { likedArtsTranslations } from './lang';
import '../LikedItems.css';
import { useNotification } from '../../../../context/NotificationContext';
import { getArtById, type Art } from '../../../../api/arts/main.api';
import { useLanguage } from '../../../../context/LanguageContext';

const LIKED_ARTS_KEY = 'liked_arts';

export const LikedArts = () => {
    const [likedArts, setLikedArts] = useState<Art[]>([]);
    const [loading, setLoading] = useState(true);
    const { showNotification } = useNotification();
    const { language } = useLanguage();
    const lang = likedArtsTranslations[language];

    useEffect(() => {
        loadLikedArts();
    }, []);

    const loadLikedArts = async () => {
        setLoading(true);
        try {
            const stored = localStorage.getItem(LIKED_ARTS_KEY);
            const likedIds: number[] = stored ? JSON.parse(stored) : [];
            
            const arts = await Promise.all(
                likedIds.map(id => getArtById(id))
            );
            
            setLikedArts(arts.filter(art => art !== null));
        } catch (error) {
            console.error('Error loading liked arts:', error);
            showNotification(lang.notifications.loadError, "error");
        } finally {
            setLoading(false);
        }
    };

    const removeFromLiked = (artId: number) => {
        const likedArts = JSON.parse(localStorage.getItem(LIKED_ARTS_KEY) || '[]');
        const updated = likedArts.filter((id: number) => id !== artId);
        localStorage.setItem(LIKED_ARTS_KEY, JSON.stringify(updated));
        setLikedArts(prev => prev.filter(art => art.id !== artId));
        showNotification(lang.notifications.removed, "success");
    };

    if (loading) {
        return <div className="liked-items__loading">{lang.loading}</div>;
    }

    if (likedArts.length === 0) {
        return (
            <div className="liked-items__empty">
                <div className="liked-items__empty-icon">{lang.empty.icon}</div>
                <h2>{lang.empty.title}</h2>
                <p>{lang.empty.text}</p>
                <Link to="/arts" className="liked-items__empty-btn">{lang.empty.button}</Link>
            </div>
        );
    }

    return (
        <div className="liked-items">
            <h1 className="liked-items__title">{lang.title}</h1>
            <div className="liked-items__grid">
                {likedArts.map(art => (
                    <div key={art.id} className="liked-items__card">
                        <Link to={`/arts/${art.id}`} className="liked-items__link">
                            <div className="liked-items__image-wrapper">
                                <img src={art.image_path} alt={art.title} className="liked-items__image" />
                                <button 
                                    className="liked-items__remove"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        removeFromLiked(art.id);
                                    }}
                                >
                                    ❌
                                </button>
                            </div>
                            <h3 className="liked-items__card-title">{art.title}</h3>
                            <p className="liked-items__card-description">{art.description?.slice(0, 100)}...</p>
                        </Link>
                    </div>
                ))}
            </div>
        </div>
    );
};