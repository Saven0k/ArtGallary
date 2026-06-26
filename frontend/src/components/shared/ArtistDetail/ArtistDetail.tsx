import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useNotification } from '../../../context/NotificationContext';
import { useAuth } from '../../../hooks/useAuth';
import { useLanguage } from '../../../context/LanguageContext';
import { getArtistById, getArtsByArtist, type ArtistProfileResponse } from '../../../api/artists/main.api';
import { getAllArtistExhibitions } from '../../../api/exhibitions/main.api';
import { ArtistHero } from './components/ArtistHero/ArtistHero';
import { ArtistNav } from './components/ArtistNav/ArtistNav';
import { ArtistArtsTab } from './components/ArtistArtsTab/ArtistArtsTab';
import { ArtistExhibitionsTab } from './components/ArtistExhibitionsTab/ArtistExhibitionsTab';
import { ArtistInfoTab } from './components/ArtistInfoTab/ArtistInfoTab';
import { artistDetailTranslations } from './lang';
import type { Exhibition } from '../../../api/exhibitions/main.api';
import type { Art } from '../../../api/arts/main.api';
import './ArtistDetail.css';

export const ArtistDetail = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { showNotification } = useNotification();
    const { language } = useLanguage();
    const lang = artistDetailTranslations[language];

    const [artist, setArtist] = useState<ArtistProfileResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadingArts, setLoadingArts] = useState(false);
    const [loadingExhibitions, setLoadingExhibitions] = useState(false);
    const [activeTab, setActiveTab] = useState<'arts' | 'exhibitions' | 'info'>('info');
    const [accessDenied, setAccessDenied] = useState(false);

    const [arts, setArts] = useState<Art[]>([]);
    const [exhibitions, setExhibitions] = useState<Exhibition[]>([]);

    useEffect(() => {
        loadArtist();
    }, [id]);

    useEffect(() => {
        if (activeTab === 'arts' && arts.length === 0 && artist && !accessDenied) {
            loadArts();
        }
        if (activeTab === 'exhibitions' && exhibitions.length === 0 && artist && !accessDenied) {
            loadExhibitions();
        }
    }, [activeTab, artist, accessDenied]);

    const loadArtist = async () => {
        setLoading(true);
        try {
            const data = await getArtistById(Number(id));
            if (data) {
                const isModerated = data.artistProfile?.moderate?.moderate;
                const isOwner = data.id === user?.id;
                const isAdminOrModerator = user?.role === 'admin' || user?.role === 'moderator';
                
                if (!isModerated && !isOwner && !isAdminOrModerator) {
                    setAccessDenied(true);
                    setLoading(false);
                    return;
                }
                
                setArtist(data);
            } else {
                showNotification(lang.notifications.artistNotFound, "error");
            }
        } catch (error) {
            console.error('Error loading artist:', error);
            showNotification(lang.notifications.loadError, "error");
        } finally {
            setLoading(false);
        }
    };

    const loadArts = async () => {
        setLoadingArts(true);
        try {
            const data = await getArtsByArtist(Number(id));
            if (data) {
                setArts(data);
            } else {
                setArts([]);
            }
        } catch (error) {
            console.error('Error loading arts:', error);
            setArts([]);
        } finally {
            setLoadingArts(false);
        }
    };

    const loadExhibitions = async () => {
        setLoadingExhibitions(true);
        try {
            const data = await getAllArtistExhibitions(Number(id));
            if (data) {
                setExhibitions(data);
            } else {
                setExhibitions([]);
            }
        } catch (error) {
            console.error('Error loading exhibitions:', error);
            setExhibitions([]);
        } finally {
            setLoadingExhibitions(false);
        }
    };

    if (loading) {
        return (
            <div className="artist-detail__loading">
                <div className="artist-detail__spinner"></div>
                <p>{lang.loading}</p>
            </div>
        );
    }

    if (accessDenied) {
        return (
            <div className="artist-detail__error">
                <div className="artist-detail__error-icon">🔒</div>
                <h2>{lang.accessDenied.title}</h2>
                <p>{lang.accessDenied.description}</p>
                <button className="artist-detail__error-btn" onClick={() => navigate('/artists')}>
                    {lang.accessDenied.button}
                </button>
            </div>
        );
    }

    if (!artist) {
        return (
            <div className="artist-detail__error">
                <div className="artist-detail__error-icon">🎨</div>
                <h2>{lang.error.title}</h2>
                <p>{lang.error.description}</p>
                <button className="artist-detail__error-btn" onClick={() => navigate('/artists')}>
                    {lang.error.button}
                </button>
            </div>
        );
    }

    return (
        <div className="artist-detail">
            <ArtistHero artist={artist} artsCount={artist.artistProfile?.artsCount || 0} />

            <div className="artist-detail__container">
                <ArtistNav
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    artsCount={artist.artistProfile?.artsCount || 0}
                    exhibitionsCount={artist.artistProfile?.exhibitionsCount || 0}
                    onBack={() => navigate('/artists')}
                    artistUserId={artist.id}
                />

                <div className="artist-detail__content">
                    {activeTab === 'arts' && (
                        <ArtistArtsTab
                            arts={arts}
                            loading={loadingArts}
                            onArtClick={(artId) => navigate(`/arts/${artId}`)}
                            artistUserId={artist.id}
                        />
                    )}

                    {activeTab === 'exhibitions' && (
                        <ArtistExhibitionsTab
                            exhibitions={exhibitions}
                            loading={loadingExhibitions}
                            onExhibitionClick={(exhibitionId) => navigate(`/exhibitions/${exhibitionId}`)}
                        />
                    )}

                    {activeTab === 'info' && (
                        <ArtistInfoTab artist={artist} />
                    )}
                </div>
            </div>
        </div>
    );
};

export default ArtistDetail;