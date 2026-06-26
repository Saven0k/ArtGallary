import { useState, useEffect } from 'react';
import { useNotification } from '../../../../context/NotificationContext';
import { useConfirm } from '../../../../hooks/useConfirm';
import "../AdminPage.css"
import { getArtists, moderateArtist } from '../../../../api/artists/main.api';
import type { ArtistUser } from '../../../../types/user.types';
import { AdminTable } from '../components/AdminTable';
import { AdminModal } from '../components/AdminModal';
import { useAuth } from '../../../../hooks/useAuth';

export const ArtistsModerate = () => {
    const { showNotification } = useNotification();
    const { confirm } = useConfirm();
    const { user } = useAuth();
    const [data, setData] = useState<ArtistUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedArtist, setSelectedArtist] = useState<ArtistUser | null>(null);
    const [viewModalOpen, setViewModalOpen] = useState(false);

    // Модалка отклонения
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [artistToReject, setArtistToReject] = useState<ArtistUser | null>(null);
    const [rejectErrors, setRejectErrors] = useState<{ field: string; message: string }[]>([]);
    const [rejectComment, setRejectComment] = useState('');

    useEffect(() => { loadData(); }, []);

    // Функция для парсинга moderate
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
            const artistsData = response?.data || [];

            // Фильтруем только немодерированных художников
            const pendingArtists = artistsData.filter((artist: ArtistUser) => {
                const isModerated = parseModerate(artist.artistProfile?.moderate);
                return !isModerated;
            });
            setData(pendingArtists);
        } catch (error) {
            showNotification("Ошибка при загрузке художников", "error");
        } finally {
            setLoading(false);
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
            key: 'artistProfile',
            header: 'Город',
            className: 'admin-table__col-city',
            render: (item: ArtistUser) => item.artistProfile?.city?.name || '-'
        }
    ];

    const actions = (item: ArtistUser) => (
        <>
            <button className="admin-table__view" onClick={() => { setSelectedArtist(item); setViewModalOpen(true); }}>👁️</button>
            <button className="admin-table__approve" onClick={() => handleApprove(item.id, `${item.surname} ${item.name}`)}>✅ Одобрить</button>
            <button className="admin-table__reject" onClick={() => openRejectModal(item)}>❌ Отклонить</button>
        </>
    );

    if (loading) return <div className="admin-loading">Загрузка...</div>;

    return (
        <div className="admin-page">
            <div className="admin-page__header">
                <h1>👨‍🎨 Модерация художников</h1>
                <span className="admin-page__count">На модерации: {data.length}</span>
            </div>

            {data.length === 0 ? (
                <div className="admin-empty">
                    <div className="admin-empty__icon">✅</div>
                    <h3>Нет художников на модерации</h3>
                    <p>Все художники уже проверены</p>
                </div>
            ) : (
                <AdminTable data={data} columns={columns} actions={actions} emptyMessage="Нет художников на модерации" />
            )}

            <AdminModal isOpen={viewModalOpen} onClose={() => { setViewModalOpen(false); setSelectedArtist(null); }} title={`${selectedArtist?.surname} ${selectedArtist?.name}`}>
                {selectedArtist && (
                    <div className="admin-view">
                        {/* Основная информация */}
                        <div className="admin-view__section">
                            <h4>📋 Основная информация</h4>
                            <div className="admin-view__grid">
                                <div className="admin-view__item">
                                    <span className="admin-view__label">🆔 ID</span>
                                    <span className="admin-view__value">{selectedArtist.id}</span>
                                </div>
                                <div className="admin-view__item">
                                    <span className="admin-view__label">📧 Email</span>
                                    <span className="admin-view__value">{selectedArtist.email}</span>
                                </div>
                                <div className="admin-view__item">
                                    <span className="admin-view__label">📱 Телефон</span>
                                    <span className="admin-view__value">{selectedArtist.phone_number}</span>
                                </div>
                                <div className="admin-view__item">
                                    <span className="admin-view__label">👤 Имя</span>
                                    <span className="admin-view__value">{selectedArtist.name}</span>
                                </div>
                                <div className="admin-view__item">
                                    <span className="admin-view__label">👤 Фамилия</span>
                                    <span className="admin-view__value">{selectedArtist.surname}</span>
                                </div>
                                <div className="admin-view__item">
                                    <span className="admin-view__label">👤 Отчество</span>
                                    <span className="admin-view__value">{selectedArtist.second_name || 'Не указано'}</span>
                                </div>
                                <div className="admin-view__item">
                                    <span className="admin-view__label">🎭 Роль</span>
                                    <span className="admin-view__value">{selectedArtist.role}</span>
                                </div>
                            </div>
                        </div>

                        {/* Личная информация */}
                        <div className="admin-view__section">
                            <h4>👤 Личная информация</h4>
                            <div className="admin-view__grid">
                                <div className="admin-view__item">
                                    <span className="admin-view__label">📅 Дата рождения</span>
                                    <span className="admin-view__value">{selectedArtist.artistProfile?.date_birthday ? new Date(selectedArtist.artistProfile.date_birthday).toLocaleDateString('ru-RU') : '-'}</span>
                                </div>
                                <div className="admin-view__item">
                                    <span className="admin-view__label">🏙️ Город</span>
                                    <span className="admin-view__value">{selectedArtist.artistProfile?.city?.name || '-'}</span>
                                </div>
                                <div className="admin-view__item">
                                    <span className="admin-view__label">🌍 Страна</span>
                                    <span className="admin-view__value">{selectedArtist.artistProfile?.country?.name || '-'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Аватар */}
                        {selectedArtist.avatar_path && (
                            <div className="admin-view__section">
                                <h4>🖼️ Аватар</h4>
                                <div className="admin-view__avatar-wrapper">
                                    <img src={String(selectedArtist.avatar_path)} alt="Avatar" className="admin-view__avatar" />
                                </div>
                            </div>
                        )}

                        {/* Биография */}
                        {selectedArtist.artistProfile?.biography && (
                            <div className="admin-view__section">
                                <h4>📖 Биография</h4>
                                <div className="admin-view__biography">
                                    {selectedArtist.artistProfile.biography}
                                </div>
                            </div>
                        )}

                        {/* Статистика */}
                        <div className="admin-view__section">
                            <h4>📊 Статистика</h4>
                            <div className="admin-view__grid">
                                <div className="admin-view__item">
                                    <span className="admin-view__label">🖼️ Количество работ</span>
                                    <span className="admin-view__value">{selectedArtist.artistProfile?.artsCount || 0}</span>
                                </div>
                                <div className="admin-view__item">
                                    <span className="admin-view__label">🏛️ Количество выставок</span>
                                    <span className="admin-view__value">{selectedArtist.artistProfile?.exhibitionsCount || 0}</span>
                                </div>
                            </div>
                        </div>

                        {/* Статус модерации */}
                        <div className="admin-view__section">
                            <h4>⚖️ Статус модерации</h4>
                            <div className="admin-view__status">
                                {(() => {
                                    const moderate = selectedArtist.artistProfile?.moderate;
                                    let isModerated = false;
                                    let moderatorComment = null;
                                    let moderatedAt = null;

                                    if (typeof moderate === 'string') {
                                        try {
                                            const parsed = JSON.parse(moderate);
                                            isModerated = parsed.moderate;
                                            moderatorComment = parsed.comment;
                                            moderatedAt = parsed.moderated_at;
                                        } catch (e) { }
                                    } else if (typeof moderate === 'object' && moderate) {
                                        isModerated = moderate.moderate;
                                        moderatorComment = moderate.comment;
                                        moderatedAt = moderate.moderated_at;
                                    }

                                    return (
                                        <>
                                            <div className="admin-view__status-badge">
                                                <span className={`admin-view__status-icon ${isModerated ? 'approved' : 'pending'}`}>
                                                    {isModerated ? '✅' : '⏳'}
                                                </span>
                                                <span className="admin-view__status-text">
                                                    {isModerated ? 'Одобрен' : 'На модерации'}
                                                </span>
                                            </div>
                                            {moderatorComment && (
                                                <div className="admin-view__status-comment">
                                                    <strong>💬 Комментарий модератора:</strong>
                                                    <p>{moderatorComment}</p>
                                                </div>
                                            )}
                                            {moderatedAt && (
                                                <div className="admin-view__status-date">
                                                    📅 Дата модерации: {new Date(moderatedAt).toLocaleDateString('ru-RU')}
                                                </div>
                                            )}
                                        </>
                                    );
                                })()}
                            </div>
                        </div>

                        {/* Работы художника */}
                        {selectedArtist.artistProfile?.arts && selectedArtist.artistProfile.arts.length > 0 && (
                            <div className="admin-view__section">
                                <h4>🖼️ Работы художника ({selectedArtist.artistProfile.arts.length})</h4>
                                <div className="admin-view__arts">
                                    {selectedArtist.artistProfile.arts.map(art => (
                                        <div key={art.id} className="admin-view__art-item">
                                            {art.image_path && (
                                                <img src={art.image_path} alt={art.title} className="admin-view__art-image" />
                                            )}
                                            <div className="admin-view__art-info">
                                                <div className="admin-view__art-title">{art.title}</div>
                                                <div className="admin-view__art-likes">❤️ {art.likes || 0}</div>
                                                <div className="admin-view__art-date">📅 {new Date(art.date_published).toLocaleDateString('ru-RU')}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </AdminModal>
            <AdminModal isOpen={rejectModalOpen} onClose={() => { setRejectModalOpen(false); setArtistToReject(null); }} title={`Отклонить: ${artistToReject?.surname} ${artistToReject?.name}`} onSave={handleRejectConfirm} saveText="Отклонить">
                {artistToReject && (
                    <div className="admin-reject admin-reject--fixed">
                        <p className="admin-reject__warning">⚠️ Укажите причины отклонения. Это поможет художнику исправить ошибки.</p>

                        <div className="admin-reject__fields">
                            {/* ФИО (Имя, Фамилия, Отчество) */}
                            <div className="admin-reject__field">
                                <div className="admin-reject__field-header">
                                    <span className="admin-reject__field-label">👤 ФИО</span>
                                    <button className="admin-reject__add-error" onClick={() => addRejectError('fullName')}>✏️ Добавить замечание</button>
                                </div>
                                <div className="admin-reject__field-value">
                                    {artistToReject.surname} {artistToReject.name} {artistToReject.second_name || ''}
                                </div>
                            </div>

                            {/* Имя отдельно */}
                            <div className="admin-reject__field">
                                <div className="admin-reject__field-header">
                                    <span className="admin-reject__field-label">👤 Имя</span>
                                    <button className="admin-reject__add-error" onClick={() => addRejectError('name')}>✏️ Добавить замечание</button>
                                </div>
                                <div className="admin-reject__field-value">{artistToReject.name}</div>
                            </div>

                            {/* Фамилия отдельно */}
                            <div className="admin-reject__field">
                                <div className="admin-reject__field-header">
                                    <span className="admin-reject__field-label">👤 Фамилия</span>
                                    <button className="admin-reject__add-error" onClick={() => addRejectError('surname')}>✏️ Добавить замечание</button>
                                </div>
                                <div className="admin-reject__field-value">{artistToReject.surname}</div>
                            </div>

                            {/* Отчество */}
                            <div className="admin-reject__field">
                                <div className="admin-reject__field-header">
                                    <span className="admin-reject__field-label">👤 Отчество</span>
                                    <button className="admin-reject__add-error" onClick={() => addRejectError('secondName')}>✏️ Добавить замечание</button>
                                </div>
                                <div className="admin-reject__field-value">{artistToReject.second_name || 'Не указано'}</div>
                            </div>

                            {/* Email */}
                            <div className="admin-reject__field">
                                <div className="admin-reject__field-header">
                                    <span className="admin-reject__field-label">📧 Email</span>
                                    <button className="admin-reject__add-error" onClick={() => addRejectError('email')}>✏️ Добавить замечание</button>
                                </div>
                                <div className="admin-reject__field-value">{artistToReject.email}</div>
                            </div>

                            {/* Телефон */}
                            <div className="admin-reject__field">
                                <div className="admin-reject__field-header">
                                    <span className="admin-reject__field-label">📱 Телефон</span>
                                    <button className="admin-reject__add-error" onClick={() => addRejectError('phone')}>✏️ Добавить замечание</button>
                                </div>
                                <div className="admin-reject__field-value">{artistToReject.phone_number}</div>
                            </div>

                            {/* Дата рождения */}
                            <div className="admin-reject__field">
                                <div className="admin-reject__field-header">
                                    <span className="admin-reject__field-label">📅 Дата рождения</span>
                                    <button className="admin-reject__add-error" onClick={() => addRejectError('birthday')}>✏️ Добавить замечание</button>
                                </div>
                                <div className="admin-reject__field-value">
                                    {artistToReject.artistProfile?.date_birthday
                                        ? new Date(artistToReject.artistProfile.date_birthday).toLocaleDateString('ru-RU')
                                        : 'Не указано'}
                                </div>
                            </div>

                            {/* Город */}
                            <div className="admin-reject__field">
                                <div className="admin-reject__field-header">
                                    <span className="admin-reject__field-label">🏙️ Город</span>
                                    <button className="admin-reject__add-error" onClick={() => addRejectError('city')}>✏️ Добавить замечание</button>
                                </div>
                                <div className="admin-reject__field-value">{artistToReject.artistProfile?.city?.name || 'Не указано'}</div>
                            </div>

                            {/* Страна */}
                            <div className="admin-reject__field">
                                <div className="admin-reject__field-header">
                                    <span className="admin-reject__field-label">🌍 Страна</span>
                                    <button className="admin-reject__add-error" onClick={() => addRejectError('country')}>✏️ Добавить замечание</button>
                                </div>
                                <div className="admin-reject__field-value">{artistToReject.artistProfile?.country?.name || 'Не указано'}</div>
                            </div>

                            {/* Аватар */}
                            {artistToReject.avatar_path && (
                                <div className="admin-reject__field">
                                    <div className="admin-reject__field-header">
                                        <span className="admin-reject__field-label">🖼️ Аватар</span>
                                        <button className="admin-reject__add-error" onClick={() => addRejectError('avatar')}>✏️ Добавить замечание</button>
                                    </div>
                                    <div className="admin-reject__field-value">
                                        <img src={String(artistToReject.avatar_path)} alt="Avatar" className="admin-reject__avatar-preview" />
                                    </div>
                                </div>
                            )}

                            {/* Биография */}
                            <div className="admin-reject__field">
                                <div className="admin-reject__field-header">
                                    <span className="admin-reject__field-label">📖 Биография</span>
                                    <button className="admin-reject__add-error" onClick={() => addRejectError('biography')}>✏️ Добавить замечание</button>
                                </div>
                                <div className="admin-reject__field-value">{artistToReject.artistProfile?.biography?.substring(0, 150)}...</div>
                            </div>
                        </div>

                        {rejectErrors.length > 0 && (
                            <div className="admin-reject__errors">
                                <h4>📝 Замечания:</h4>
                                <div className="admin-reject__errors-list">
                                    {rejectErrors.map((error, index) => (
                                        <div key={index} className="admin-reject__error-item">
                                            <div className="admin-reject__error-header">
                                                <span className="admin-reject__error-field">
                                                    {error.field === 'fullName' ? 'ФИО' :
                                                        error.field === 'name' ? 'Имя' :
                                                            error.field === 'surname' ? 'Фамилия' :
                                                                error.field === 'secondName' ? 'Отчество' :
                                                                    error.field === 'email' ? 'Email' :
                                                                        error.field === 'phone' ? 'Телефон' :
                                                                            error.field === 'birthday' ? 'Дата рождения' :
                                                                                error.field === 'city' ? 'Город' :
                                                                                    error.field === 'country' ? 'Страна' :
                                                                                        error.field === 'avatar' ? 'Аватар' :
                                                                                            error.field === 'biography' ? 'Биография' : error.field}
                                                </span>
                                                <button className="admin-reject__error-remove" onClick={() => removeRejectError(index)}>🗑️</button>
                                            </div>
                                            <textarea
                                                className="admin-reject__error-input"
                                                value={error.message}
                                                onChange={(e) => updateRejectError(index, e.target.value)}
                                                placeholder="Введите замечание..."
                                                rows={2}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="admin-reject__global">
                            <label className="admin-reject__global-label">Общий комментарий</label>
                            <textarea
                                className="admin-reject__global-input"
                                value={rejectComment}
                                onChange={(e) => setRejectComment(e.target.value)}
                                placeholder="Добавьте общий комментарий к отклонению..."
                                rows={3}
                            />
                        </div>
                    </div>
                )}
            </AdminModal>
        </div>
    );
};