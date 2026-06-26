import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { useLanguage } from '../../../context/LanguageContext';
import { myExhibitionsListTranslations } from './lang';
import { useNotification } from '../../../context/NotificationContext';
import { useConfirm } from '../../../hooks/useConfirm';
import { addArtToExhibition, removeArtFromExhibition, addArtistToExhibition, removeArtistFromExhibition, getAllArtistExhibitions, deleteExhibition, type Exhibition } from '../../../api/exhibitions/main.api';
import './MyExhibitionsList.css';
import { getModeratedArts, type Art } from '../../../api/arts/main.api';
import { MyExhibitionCard } from './components/MyExhibitionCard/MyExhibitionCard';
import { SelectModal } from './components/SelectModal/SelectModal';
import { getArtists, type ArtistProfileResponse } from '../../../api/artists/main.api';

interface ExhibitionArtist {
    user_id: number;
    user?: {
        id: number;
        name: string;
        surname: string;
        avatar_path?: string | null;
    };
}

interface ExtendedExhibition extends Exhibition {
    isOwner?: boolean;
}

export const MyExhibitionsList = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { showNotification } = useNotification();
    const { confirm } = useConfirm();
    const { language } = useLanguage();
    const lang = myExhibitionsListTranslations[language];

    const [ownedExhibitions, setOwnedExhibitions] = useState<ExtendedExhibition[]>([]);
    const [participantExhibitions, setParticipantExhibitions] = useState<ExtendedExhibition[]>([]);
    const [loading, setLoading] = useState(true);
    const [myArts, setMyArts] = useState<Art[]>([]);
    const [artists, setArtists] = useState<ArtistProfileResponse[]>([]);

    const [modalType, setModalType] = useState<'art' | 'artist' | null>(null);
    const [selectedExhibition, setSelectedExhibition] = useState<ExtendedExhibition | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            if (!user?.id) return;

            const [allExhibitions, allArts, allArtists] = await Promise.all([
                getAllArtistExhibitions(user.id),
                getModeratedArts(1, 100),
                getArtists(1, 100)
            ]);

            const owned: ExtendedExhibition[] = [];
            const participant: ExtendedExhibition[] = [];

            allExhibitions?.forEach((exhibition: ExtendedExhibition) => {
                if (exhibition.owner_id === user.id) {
                    owned.push({ ...exhibition, isOwner: true });
                } else {
                    participant.push({ ...exhibition, isOwner: false });
                }
            });

            setOwnedExhibitions(owned);
            setParticipantExhibitions(participant);
            setMyArts(allArts?.arts || []);
            setArtists(allArtists?.data || []);

        } catch (error) {
            console.error('Error loading data:', error);
            showNotification(lang.notifications.loadError, "error");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        const confirmed = await confirm({
            title: lang.confirm.deleteTitle,
            message: lang.confirm.deleteMessage,
            confirmText: lang.confirm.deleteConfirm,
            cancelText: lang.confirm.deleteCancel,
            type: "danger"
        });

        if (confirmed) {
            const result = await deleteExhibition(id);
            if (result) {
                showNotification(lang.notifications.deleted, "success");
                await loadData();
            }
        }
    };

    const handleRemoveArt = async (exhibition: Exhibition, artId: number) => {
        const confirmed = await confirm({
            title: lang.confirm.removeArtTitle,
            message: lang.confirm.removeArtMessage,
            confirmText: lang.confirm.removeArtConfirm,
            type: "warning"
        });

        if (confirmed) {
            const result = await removeArtFromExhibition(exhibition.id, artId);
            if (result) {
                showNotification(lang.notifications.artRemoved, "success");
                await loadData();
            } else {
                showNotification(lang.notifications.artRemoveError, "error");
            }
        }
    };

    const handleRemoveArtist = async (exhibition: Exhibition, artistUserId: number) => {
        const confirmed = await confirm({
            title: lang.confirm.removeArtistTitle,
            message: lang.confirm.removeArtistMessage,
            confirmText: lang.confirm.removeArtistConfirm,
            type: "warning"
        });

        if (confirmed) {
            const artistToRemove = artists.find(a => a.id === artistUserId);
            if (artistToRemove?.artistProfile?.user_id) {
                const result = await removeArtistFromExhibition(exhibition.id, artistToRemove.artistProfile.user_id);
                if (result) {
                    showNotification(lang.notifications.artistRemoved, "success");
                    await loadData();
                } else {
                    showNotification(lang.notifications.artistRemoveError, "error");
                }
            }
        }
    };

    const handleSelectItem = async (itemId: number) => {
        if (!selectedExhibition) return;

        let result;
        if (modalType === 'art') {
            result = await addArtToExhibition(selectedExhibition.id, itemId);
        } else {
            result = await addArtistToExhibition(selectedExhibition.id, itemId);
        }

        if (result) {
            showNotification(lang.notifications.addSuccess, "success");
            await loadData();
        } else {
            showNotification(lang.notifications.addError, "error");
        }

        setModalType(null);
        setSelectedExhibition(null);
    };

    const getAvailableItems = () => {
        if (!selectedExhibition) return [];
        
        if (modalType === 'art') {
            const existingArtIds = new Set(selectedExhibition.arts?.map((a: any) => a.id) || []);
            const available = myArts.filter(art => !existingArtIds.has(art.id));
            return available;
        } else {
            const existingArtistIds = new Set(selectedExhibition.artists?.map((a: ExhibitionArtist) => a.user_id) || []);
            const available = artists.filter(artist => !existingArtistIds.has(artist.id));
            return available;
        }
    };

    if (loading) {
        return (
            <div className="my-exhibitions__loading">
                <div className="my-exhibitions__spinner"></div>
                <p>{lang.loading}</p>
            </div>
        );
    }

    const totalExhibitions = ownedExhibitions.length + participantExhibitions.length;

    return (
        <div className="my-exhibitions">
            <div className="my-exhibitions__header">
                <h1>{lang.title}</h1>
                <button className="my-exhibitions__create-btn" onClick={() => navigate('/exhibitions/my/new')}>
                    {lang.createBtn}
                </button>
            </div>

            {totalExhibitions === 0 ? (
                <div className="my-exhibitions__empty">
                    <div className="my-exhibitions__empty-icon">{lang.empty.icon}</div>
                    <h3>{lang.empty.title}</h3>
                    <p>{lang.empty.text}</p>
                    <button onClick={() => navigate('/exhibitions/my/new')}>
                        {lang.empty.button}
                    </button>
                </div>
            ) : (
                <div className="my-exhibitions__list">
                    {ownedExhibitions.length > 0 && (
                        <div className="my-exhibitions__section">
                            <div className="my-exhibitions__section-header">
                                <h2>{lang.sections.myExhibitions}</h2>
                                <span className="my-exhibitions__section-count">{ownedExhibitions.length}</span>
                            </div>
                            <div className="my-exhibitions__cards">
                                {ownedExhibitions.map(exhibition => (
                                    <MyExhibitionCard
                                        key={exhibition.id}
                                        exhibition={exhibition}
                                        isOwner={true}
                                        onUpdate={() => navigate(`/exhibitions/my/edit/${exhibition.id}`)}
                                        onDelete={() => handleDelete(exhibition.id)}
                                        onAddArt={() => {
                                            setSelectedExhibition(exhibition);
                                            setModalType('art');
                                        }}
                                        onRemoveArt={(artId) => handleRemoveArt(exhibition, artId)}
                                        onAddArtist={() => {
                                            setSelectedExhibition(exhibition);
                                            setModalType('artist');
                                        }}
                                        onRemoveArtist={(artistId) => handleRemoveArtist(exhibition, artistId)}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {participantExhibitions.length > 0 && (
                        <div className="my-exhibitions__section">
                            <div className="my-exhibitions__section-header">
                                <h2>{lang.sections.participating}</h2>
                                <span className="my-exhibitions__section-count">{participantExhibitions.length}</span>
                            </div>
                            <div className="my-exhibitions__cards">
                                {participantExhibitions.map(exhibition => (
                                    <MyExhibitionCard
                                        key={exhibition.id}
                                        exhibition={exhibition}
                                        isOwner={false}
                                        onUpdate={() => navigate(`/exhibitions/my/edit/${exhibition.id}`)}
                                        onDelete={() => handleDelete(exhibition.id)}
                                        onAddArt={() => {
                                            setSelectedExhibition(exhibition);
                                            setModalType('art');
                                        }}
                                        onRemoveArt={(artId) => handleRemoveArt(exhibition, artId)}
                                        onAddArtist={() => {
                                            setSelectedExhibition(exhibition);
                                            setModalType('artist');
                                        }}
                                        onRemoveArtist={(artistId) => handleRemoveArtist(exhibition, artistId)}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {modalType && (
                <SelectModal
                    title={modalType === 'art' ? lang.modals.addArt : lang.modals.addArtist}
                    items={getAvailableItems()}
                    onSelect={handleSelectItem}
                    onClose={() => {
                        setModalType(null);
                        setSelectedExhibition(null);
                    }}
                    getItemName={(item) => modalType === 'art' ? item.title : `${item.surname} ${item.name}`}
                />
            )}
        </div>
    );
};