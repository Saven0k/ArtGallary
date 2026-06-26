import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../LikedItems.css';
import { getUserRegisteredExhibitions, type Exhibition } from '../../../../api/exhibitions/main.api';
import { useNotification } from '../../../../context/NotificationContext';
import { useLanguage } from '../../../../context/LanguageContext';
import { registeredExhibitionsTranslations } from './lang';

export const RegisteredExhibitions = () => {
    const [registeredExhibitions, setRegisteredExhibitions] = useState<Exhibition[]>([]);
    const [loading, setLoading] = useState(true);
    const { showNotification } = useNotification();
    const { language } = useLanguage();
    const lang = registeredExhibitionsTranslations[language];

    useEffect(() => {
        loadRegisteredExhibitions();
    }, []);

    const loadRegisteredExhibitions = async () => {
        setLoading(true);
        try {
            const data = await getUserRegisteredExhibitions();
            setRegisteredExhibitions(data);
        } catch (error) {
            console.error('Error loading registered exhibitions:', error);
            showNotification(lang.notifications.loadError, "error");
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        const locale = language === 'en' ? 'en-US' : 'ru-RU';
        return new Date(dateString).toLocaleDateString(locale, {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (loading) {
        return <div className="liked-items__loading">{lang.loading}</div>;
    }

    if (registeredExhibitions.length === 0) {
        return (
            <div className="liked-items__empty">
                <div className="liked-items__empty-icon">{lang.empty.icon}</div>
                <h2>{lang.empty.title}</h2>
                <p>{lang.empty.text}</p>
                <Link to="/exhibitions" className="liked-items__empty-btn">{lang.empty.button}</Link>
            </div>
        );
    }

    return (
        <div className="liked-items">
            <h1 className="liked-items__title">{lang.title}</h1>
            <div className="liked-items__grid">
                {registeredExhibitions.map(exhibition => (
                    <div key={exhibition.id} className="liked-items__card">
                        <Link to={`/exhibitions/${exhibition.id}`} className="liked-items__link">
                            <div className="liked-items__image-wrapper">
                                {exhibition.image_path ? (
                                    <img src={exhibition.image_path} alt={exhibition.title} className="liked-items__image" />
                                ) : (
                                    <div className="liked-items__image-placeholder">🏛️</div>
                                )}
                            </div>
                            <h3 className="liked-items__card-title">{exhibition.title}</h3>
                            <p className="liked-items__card-info">📅 {formatDate(exhibition.date)}</p>
                            <p className="liked-items__card-info">📍 {exhibition.address}</p>
                            <p className="liked-items__card-info">💰 {exhibition.cost}</p>
                            <p className="liked-items__card-description">{exhibition.description?.slice(0, 100)}...</p>
                        </Link>
                    </div>
                ))}
            </div>
        </div>
    );
};