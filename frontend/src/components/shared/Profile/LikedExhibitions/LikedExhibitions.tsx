import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../LikedItems.css';
import { getExhibitionById, type Exhibition } from '../../../../api/exhibitions/main.api';
import { useNotification } from '../../../../context/NotificationContext';

const LIKED_EXHIBITIONS_KEY = 'liked_exhibitions';

export const LikedExhibitions = () => {
    const [likedExhibitions, setLikedExhibitions] = useState<Exhibition[]>([]);
    const [loading, setLoading] = useState(true);
    const { showNotification } = useNotification();

    useEffect(() => {
        loadLikedExhibitions();
    }, []);

    const loadLikedExhibitions = async () => {
        setLoading(true);
        try {
            const stored = localStorage.getItem(LIKED_EXHIBITIONS_KEY);
            const likedIds: number[] = stored ? JSON.parse(stored) : [];
            
            const exhibitions = await Promise.all(
                likedIds.map(id => getExhibitionById(id))
            );
            
            setLikedExhibitions(exhibitions.filter(ex => ex !== null));
        } catch (error) {
            console.error('Error loading liked exhibitions:', error);
            showNotification("Ошибка при загрузке понравившихся выставок", "error");
        } finally {
            setLoading(false);
        }
    };

    const removeFromLiked = (exhibitionId: number) => {
        const likedExhibitions = JSON.parse(localStorage.getItem(LIKED_EXHIBITIONS_KEY) || '[]');
        const updated = likedExhibitions.filter((id: number) => id !== exhibitionId);
        localStorage.setItem(LIKED_EXHIBITIONS_KEY, JSON.stringify(updated));
        setLikedExhibitions(prev => prev.filter(ex => ex.id !== exhibitionId));
        showNotification("Выставка удалена из понравившихся", "success");
    };

    if (loading) {
        return <div className="liked-items__loading">Загрузка...</div>;
    }

    if (likedExhibitions.length === 0) {
        return (
            <div className="liked-items__empty">
                <div className="liked-items__empty-icon">🏛️</div>
                <h2>У вас пока нет понравившихся выставок</h2>
                <p>Нажимайте "Заинтересовало" на выставках, чтобы они появлялись здесь</p>
                <Link to="/exhibitions" className="liked-items__empty-btn">Перейти к выставкам</Link>
            </div>
        );
    }

    return (
        <div className="liked-items">
            <h1 className="liked-items__title">Понравившиеся выставки</h1>
            <div className="liked-items__grid">
                {likedExhibitions.map(exhibition => (
                    <div key={exhibition.id} className="liked-items__card">
                        <Link to={`/exhibitions/${exhibition.id}`} className="liked-items__link">
                            <div className="liked-items__image-wrapper">
                                {exhibition.image_path ? (
                                    <img src={exhibition.image_path} alt={exhibition.title} className="liked-items__image" />
                                ) : (
                                    <div className="liked-items__image-placeholder">🏛️</div>
                                )}
                                <button 
                                    className="liked-items__remove"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        removeFromLiked(exhibition.id);
                                    }}
                                >
                                    ❌
                                </button>
                            </div>
                            <h3 className="liked-items__card-title">{exhibition.title}</h3>
                            <p className="liked-items__card-info">📅 {new Date(exhibition.date).toLocaleDateString('ru-RU')}</p>
                            <p className="liked-items__card-info">📍 {exhibition.address}</p>
                            <p className="liked-items__card-description">{exhibition.description?.slice(0, 100)}...</p>
                        </Link>
                    </div>
                ))}
            </div>
        </div>
    );
};