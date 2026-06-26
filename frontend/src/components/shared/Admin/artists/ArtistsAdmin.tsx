import { useState, useEffect } from 'react';
import { useNotification } from '../../../../context/NotificationContext';
import { useConfirm } from '../../../../hooks/useConfirm';
import "../AdminPage.css"
import type { ArtistUser } from '../../../../types/user.types';
import { deleteArtistById, getArtists, moderateArtist } from '../../../../api/artists/main.api';
import { StatusBadge } from '../components/StatusBadge';
import { AdminModal } from '../components/AdminModal';
import { AdminTable } from '../components/AdminTable';
import { useAuth } from '../../../../hooks/useAuth';

export const ArtistsAdmin = () => {
    const { showNotification } = useNotification();
    const { confirm } = useConfirm();
    const { user } = useAuth();
    const [data, setData] = useState<ArtistUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedArtist, setSelectedArtist] = useState<ArtistUser | null>(null);
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [fullscreenAvatar, setFullscreenAvatar] = useState<string | null>(null);
    
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [artistToReject, setArtistToReject] = useState<ArtistUser | null>(null);
    const [rejectErrors, setRejectErrors] = useState<{ field: string; message: string }[]>([]);
    const [rejectComment, setRejectComment] = useState('');

    useEffect(() => { loadData(); }, []);
    
    const parseModerate = (moderate: any): boolean => {
        if (!moderate) return false;
        if (typeof moderate === 'string') {
            try {
                const parsed = JSON.parse(moderate);
                return parsed.moderate === true;
            } catch {
                return false;
            }
        }
        if (typeof moderate === 'object') {
            return moderate.moderate === true;
        }
        return false;
    };

    const loadData = async () => {
        setLoading(true);
        try {
            const response = await getArtists();
            setData(response?.data || []);
        } catch (error) {
            showNotification("Ошибка при загрузке художников", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number, name: string) => {
        const confirmed = await confirm({
            title: "Удаление художника",
            message: `Вы уверены, что хотите удалить художника "${name}"?`,
            confirmText: "Удалить",
            cancelText: "Отмена",
            type: "danger"
        });
        if (confirmed) {
            try {
                await deleteArtistById(id);
                showNotification("Художник удален", "success");
                loadData();
            } catch (error) {
                showNotification("Ошибка при удалении художника", "error");
            }
        }
    };

    const handleApprove = async (id: number, name: string) => {
        const confirmed = await confirm({
            title: "Одобрить художника",
            message: `Вы уверены, что хотите одобрить художника "${name}"?`,
            confirmText: "Одобрить",
            cancelText: "Отмена",
            type: "info"
        });
        if (confirmed) {
            try {
                await moderateArtist(id, {
                    moderate: true,
                    moderator_id: Number(user?.id),
                    comment: null,
                    errors: {}
                });
                showNotification("Художник одобрен", "success");
                loadData();
            } catch (error) {
                showNotification("Ошибка при модерации", "error");
            }
        }
    };

    const openRejectModal = (artist: ArtistUser) => {
        setArtistToReject(artist);
        setRejectErrors([]);
        setRejectComment('');
        setRejectModalOpen(true);
    };

    const addRejectError = (field: string) => {
        setRejectErrors([...rejectErrors, { field, message: '' }]);
    };

    const removeRejectError = (index: number) => {
        setRejectErrors(rejectErrors.filter((_, i) => i !== index));
    };

    const updateRejectError = (index: number, message: string) => {
        const newErrors = [...rejectErrors];
        newErrors[index].message = message;
        setRejectErrors(newErrors);
    };

    const handleRejectConfirm = async () => {
        const errorsObject: Record<string, string> = {};
        rejectErrors.forEach(error => {
            if (error.message.trim()) {
                errorsObject[error.field] = error.message;
            }
        });

        try {
            await moderateArtist(artistToReject!.id, {
                moderate: false,
                moderator_id: Number(user?.id),
                comment: rejectComment || null,
                errors: errorsObject
            });
            showNotification("Художник отклонен", "success");
            setRejectModalOpen(false);
            setArtistToReject(null);
            loadData();
        } catch (error) {
            showNotification("Ошибка при модерации", "error");
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('ru-RU', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const getFullImageUrl = (avatarPath?: string | null) => {
        if (!avatarPath) return null;
        // Если путь уже полный
        if (avatarPath.startsWith('http')) return avatarPath;
        // Если путь относительный, добавляем базовый URL
        const baseUrl =  'http://localhost:5000';
        return `${baseUrl}${avatarPath.startsWith('/') ? avatarPath : `/${avatarPath}`}`;
    };

    const columns = [
        { key: 'id', header: 'ID', className: 'admin-table__col-id' },
        { 
            key: 'name', 
            header: 'ФИО', 
            className: 'admin-table__col-name',
            render: (item: ArtistUser) => `${item.surname} ${item.name} ${item.second_name || ''}`
        },
        { key: 'email', header: 'Email', className: 'admin-table__col-email' },
        { key: 'phone_number', header: 'Телефон', className: 'admin-table__col-phone' },
        { 
            key: 'artistCity', 
            header: 'Город', 
            className: 'admin-table__col-city',
            render: (item: ArtistUser) => item.artistProfile?.city?.name || '-'
        },
        { 
            key: 'artistProfile', 
            header: 'Статус', 
            className: 'admin-table__col-status',
            render: (item: ArtistUser) => {
                const isModerated = parseModerate(item.artistProfile?.moderate);
                return <StatusBadge status={isModerated ? 'approved' : 'pending'} />;
            }
        }
    ];

    const actions = (item: ArtistUser) => (
        <>
            <button className="admin-table__view" onClick={() => { setSelectedArtist(item); setViewModalOpen(true); }}>👁️</button>
            <button className="admin-table__approve" onClick={() => handleApprove(item.id, `${item.surname} ${item.name}`)}>✅ Одобрить</button>
            <button className="admin-table__reject" onClick={() => openRejectModal(item)}>❌ Отклонить</button>
            <button className="admin-table__delete" onClick={() => handleDelete(item.id, `${item.surname} ${item.name}`)}>🗑️</button>
        </>
    );

    if (loading) return <div className="admin-loading">Загрузка...</div>;

    return (
        <div className="admin-page">
            <div className="admin-page__header">
                <h1>👨‍🎨 Управление художниками</h1>
                <span className="admin-page__count">Всего: {data.length}</span>
            </div>

            <AdminTable data={data} columns={columns} actions={actions} emptyMessage="Художники не найдены" />
            
            <AdminModal isOpen={viewModalOpen} onClose={() => { setViewModalOpen(false); setSelectedArtist(null); }} title={`${selectedArtist?.surname} ${selectedArtist?.name}`}>
                {selectedArtist && (
                    <div className="admin-view">
                        {/* Аватарка с возможностью увеличения */}
                        <div className="admin-view__avatar-section">
                            {selectedArtist.avatar_path ? (
                                <div className="admin-view__avatar-wrapper">
                                    <img 
                                        src={getFullImageUrl(String(selectedArtist.avatar_path)) || ''}
                                        alt={`${selectedArtist.surname} ${selectedArtist.name}`}
                                        className="admin-view__avatar"
                                        onClick={() => setFullscreenAvatar(getFullImageUrl(String(selectedArtist.avatar_path)))}
                                    />
                                    <button 
                                        className="admin-view__avatar-expand"
                                        onClick={() => setFullscreenAvatar(getFullImageUrl(String(selectedArtist.avatar_path)))}
                                    >
                                        🔍
                                    </button>
                                </div>
                            ) : (
                                <div className="admin-view__avatar-placeholder">
                                    <span className="admin-view__avatar-placeholder-icon">🎨</span>
                                    <span className="admin-view__avatar-placeholder-text">
                                        {selectedArtist.surname?.[0]}{selectedArtist.name?.[0]}
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="admin-view__grid">
                            <div className="admin-view__item"><span className="admin-view__label">📧 Email</span><span className="admin-view__value">{selectedArtist.email}</span></div>
                            <div className="admin-view__item"><span className="admin-view__label">📱 Телефон</span><span className="admin-view__value">{selectedArtist.phone_number}</span></div>
                            <div className="admin-view__item"><span className="admin-view__label">📅 Дата рождения</span><span className="admin-view__value">{formatDate(selectedArtist.artistProfile?.date_birthday?.toString())}</span></div>
                            <div className="admin-view__item"><span className="admin-view__label">🏙️ Город</span><span className="admin-view__value">{selectedArtist.artistProfile?.city?.name || '-'}</span></div>
                            <div className="admin-view__item"><span className="admin-view__label">🌍 Страна</span><span className="admin-view__value">{selectedArtist.artistProfile?.country?.name || '-'}</span></div>
                            <div className="admin-view__item"><span className="admin-view__label">🖼️ Работ</span><span className="admin-view__value">{selectedArtist.artistProfile?.artsCount || 0}</span></div>
                            <div className="admin-view__item"><span className="admin-view__label">🏛️ Выставок</span><span className="admin-view__value">{selectedArtist.artistProfile?.exhibitionsCount || 0}</span></div>
                        </div>
                        {selectedArtist.artistProfile?.biography && (
                            <div className="admin-view__section"><h4>📖 Биография</h4><p>{selectedArtist.artistProfile.biography}</p></div>
                        )}
                    </div>
                )}
            </AdminModal>

            <AdminModal isOpen={rejectModalOpen} onClose={() => { setRejectModalOpen(false); setArtistToReject(null); }} title={`Отклонить: ${artistToReject?.surname} ${artistToReject?.name}`} onSave={handleRejectConfirm} saveText="Отклонить">
                {artistToReject && (
                    <div className="admin-reject">
                        <p className="admin-reject__warning">⚠️ Укажите причины отклонения. Это поможет художнику исправить ошибки.</p>
                        
                        <div className="admin-reject__fields">
                            <div className="admin-reject__field">
                                <div className="admin-reject__field-header">
                                    <span className="admin-reject__field-label">ФИО</span>
                                    <button className="admin-reject__add-error" onClick={() => addRejectError('name')}>✏️ Добавить замечание</button>
                                </div>
                                <div className="admin-reject__field-value">{artistToReject.surname} {artistToReject.name}</div>
                            </div>
                            <div className="admin-reject__field">
                                <div className="admin-reject__field-header">
                                    <span className="admin-reject__field-label">Email</span>
                                    <button className="admin-reject__add-error" onClick={() => addRejectError('email')}>✏️ Добавить замечание</button>
                                </div>
                                <div className="admin-reject__field-value">{artistToReject.email}</div>
                            </div>
                            <div className="admin-reject__field">
                                <div className="admin-reject__field-header">
                                    <span className="admin-reject__field-label">Биография</span>
                                    <button className="admin-reject__add-error" onClick={() => addRejectError('biography')}>✏️ Добавить замечание</button>
                                </div>
                                <div className="admin-reject__field-value">{artistToReject.artistProfile?.biography?.substring(0, 100)}...</div>
                            </div>
                        </div>

                        {rejectErrors.length > 0 && (
                            <div className="admin-reject__errors">
                                <h4>📝 Замечания:</h4>
                                {rejectErrors.map((error, index) => (
                                    <div key={index} className="admin-reject__error-item">
                                        <div className="admin-reject__error-header">
                                            <span className="admin-reject__error-field">{error.field === 'name' ? 'ФИО' : error.field === 'email' ? 'Email' : 'Биография'}</span>
                                            <button className="admin-reject__error-remove" onClick={() => removeRejectError(index)}>🗑️</button>
                                        </div>
                                        <textarea className="admin-reject__error-input" value={error.message} onChange={(e) => updateRejectError(index, e.target.value)} placeholder="Введите замечание..." rows={2} />
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="admin-reject__global">
                            <label className="admin-reject__global-label">Общий комментарий</label>
                            <textarea className="admin-reject__global-input" value={rejectComment} onChange={(e) => setRejectComment(e.target.value)} placeholder="Добавьте общий комментарий к отклонению..." rows={3} />
                        </div>
                    </div>
                )}
            </AdminModal>

            {/* Fullscreen Avatar Modal */}
            {fullscreenAvatar && (
                <div className="fullscreen-avatar" onClick={() => setFullscreenAvatar(null)}>
                    <div className="fullscreen-avatar__content" onClick={(e) => e.stopPropagation()}>
                        <img src={fullscreenAvatar} alt="Fullscreen avatar" />
                        <button className="fullscreen-avatar__close" onClick={() => setFullscreenAvatar(null)}>✕</button>
                    </div>
                </div>
            )}
        </div>
    );
};