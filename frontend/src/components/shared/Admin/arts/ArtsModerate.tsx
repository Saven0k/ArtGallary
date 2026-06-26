import { useState, useEffect } from 'react';
import { useNotification } from '../../../../context/NotificationContext';
import { useConfirm } from '../../../../hooks/useConfirm';
import '../AdminPage.css';
import { getUnmoderatedArts, moderateArt, type Art } from '../../../../api/arts/main.api';
import { AdminTable } from '../components/AdminTable';
import { AdminModal } from '../components/AdminModal';
import { useAuth } from '../../../../hooks/useAuth';

export const ArtsModerate = () => {
    const { showNotification } = useNotification();
    const { confirm } = useConfirm();
    const [data, setData] = useState<Art[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedArt, setSelectedArt] = useState<Art | null>(null);
    const { user } = useAuth();
    const [viewModalOpen, setViewModalOpen] = useState(false);

    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [artToReject, setArtToReject] = useState<Art | null>(null);
    const [rejectErrors, setRejectErrors] = useState<{ field: string; message: string }[]>([]);
    const [rejectComment, setRejectComment] = useState('');

    useEffect(() => { loadData(); }, []);

    // Функция для парсинга moderate (проверка, не одобрена ли уже)
    const isModerated = (moderate: any): boolean => {
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
            const response = await getUnmoderatedArts();
            // Фильтруем только те, где moderate === false (не одобрены)
            const unmoderatedArts = response?.arts?.filter(art => !isModerated(art.moderate)) || [];
            setData(unmoderatedArts);
        } catch (error) {
            showNotification("Ошибка при загрузке", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id: number, title: string) => {
        const confirmed = await confirm({
            title: "Одобрить",
            message: `Одобрить "${title}"?`,
            confirmText: "Одобрить",
            type: "info"
        });
        if (confirmed) {
            try {
                await moderateArt(id, { moderate: true, moderator_id: Number(user?.id), comment: null, errors: {} });
                showNotification("Картина одобрена", "success");
                loadData();
            } catch (error) {
                showNotification("Ошибка при модерации", "error");
            }
        }
    };

    const openRejectModal = (art: Art) => {
        setArtToReject(art);
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
            if (error.message.trim()) errorsObject[error.field] = error.message;
        });

        try {
            await moderateArt(artToReject!.id, { moderate: false, moderator_id: Number(user?.id), comment: rejectComment || null, errors: errorsObject });
            showNotification("Картина отклонена", "success");
            setRejectModalOpen(false);
            setArtToReject(null);
            loadData();
        } catch (error) {
            showNotification("Ошибка при модерации", "error");
        }
    };

    const handleRowClick = (art: Art) => {
        setSelectedArt(art);
        setViewModalOpen(true);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('ru-RU', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatCurrency = (cost?: number, currency?: string) => {
        if (!cost) return 'Не указана';
        const symbols: Record<string, string> = { USD: "$", EUR: "€", RUB: "₽", UAH: "₴" };
        return `${cost.toLocaleString()} ${symbols[currency || 'USD'] || currency}`;
    };

    const parseMetadata = (metadata?: string) => {
        if (!metadata) return [];
        try {
            return Object.entries(JSON.parse(metadata));
        } catch {
            return [];
        }
    };

    const columns = [
        { key: 'id', header: 'ID', className: 'admin-table__col-id' },
        { key: 'title', header: 'Название', className: 'admin-table__col-title' },
        {
            key: 'artist', header: 'Художник', className: 'admin-table__col-artist',
            render: (item: Art) => `${item.artist?.user?.surname} ${item.artist?.user?.name}` || '-'
        }
    ];

    const actions = (item: Art) => (
        <>
            <button
                className="admin-table__view"
                onClick={(e) => { e.stopPropagation(); setSelectedArt(item); setViewModalOpen(true); }}
                title="Просмотр"
            >
                👁️
            </button>
            <button
                className="admin-table__approve"
                onClick={(e) => { e.stopPropagation(); handleApprove(item.id, item.title); }}
                title="Одобрить"
            >
                ✅ Одобрить
            </button>
            <button
                className="admin-table__reject"
                onClick={(e) => { e.stopPropagation(); openRejectModal(item); }}
                title="Отклонить"
            >
                ❌ Отклонить
            </button>
        </>
    );

    if (loading) return <div className="admin-loading">Загрузка...</div>;

    return (
        <div className="admin-page">
            <div className="admin-page__header">
                <h1>🖼️ Модерация картин</h1>
                <span className="admin-page__count">На модерации: {data.length}</span>
            </div>

            <AdminTable
                data={data}
                columns={columns}
                actions={actions}
                onRowClick={handleRowClick}
                emptyMessage="Нет картин на модерации"
            />

            <AdminModal
                isOpen={viewModalOpen}
                onClose={() => { setViewModalOpen(false); setSelectedArt(null); }}
                title={selectedArt?.title || 'Детали картины'}
            >
                {selectedArt && (
                    <div className="admin-view">
                        <div className="admin-view__image-wrapper">
                            <img src={selectedArt.image_path} alt={selectedArt.title} className="admin-view__image" />
                        </div>
                        <div className="admin-view__section">
                            <h4>📋 Основная информация</h4>
                            <div className="admin-view__grid">
                                <div className="admin-view__item"><span className="admin-view__label">ID</span><span className="admin-view__value">{selectedArt.id}</span></div>
                                <div className="admin-view__item"><span className="admin-view__label">Название</span><span className="admin-view__value">{selectedArt.title}</span></div>
                                <div className="admin-view__item"><span className="admin-view__label">Дата создания</span><span className="admin-view__value">{formatDate(selectedArt.date_published)}</span></div>
                                <div className="admin-view__item"><span className="admin-view__label">Стоимость</span><span className="admin-view__value">{formatCurrency(selectedArt.cost, selectedArt.currency)}</span></div>
                                <div className="admin-view__item"><span className="admin-view__label">Лайки</span><span className="admin-view__value">❤️ {selectedArt.likes || 0}</span></div>
                                <div className="admin-view__item"><span className="admin-view__label">18+ контент</span><span className="admin-view__value">{selectedArt.is_adult ? '🔞 Да' : '✅ Нет'}</span></div>
                            </div>
                        </div>
                        <div className="admin-view__section"><h4>📝 Описание</h4><p>{selectedArt.description}</p></div>
                        {parseMetadata(selectedArt.metadata).length > 0 && (
                            <div className="admin-view__section">
                                <h4>🎨 Характеристики</h4>
                                <div className="admin-view__metadata">
                                    {parseMetadata(selectedArt.metadata).map(([key, value]) => (
                                        <div key={key} className="admin-view__metadata-item">
                                            <span className="admin-view__metadata-key">{key}</span>
                                            <span className="admin-view__metadata-value">{String(value)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </AdminModal>

            <AdminModal isOpen={rejectModalOpen} onClose={() => { setRejectModalOpen(false); setArtToReject(null); }} title={`Отклонить: ${artToReject?.title}`} onSave={handleRejectConfirm} saveText="Отклонить">
                {artToReject && (
                    <div className="admin-reject">
                        <p className="admin-reject__warning">⚠️ Укажите причины отклонения. Это поможет художнику исправить ошибки.</p>

                        <div className="admin-reject__fields">
                            {/* Название */}
                            <div className="admin-reject__field">
                                <div className="admin-reject__field-header">
                                    <span className="admin-reject__field-label">Название</span>
                                    <button className="admin-reject__add-error" onClick={() => addRejectError('title')}>✏️ Добавить замечание</button>
                                </div>
                                <div className="admin-reject__field-value admin-reject__field-value--full">
                                    {artToReject.title}
                                </div>
                            </div>

                            {/* Описание - полный текст */}
                            <div className="admin-reject__field">
                                <div className="admin-reject__field-header">
                                    <span className="admin-reject__field-label">Описание</span>
                                    <button className="admin-reject__add-error" onClick={() => addRejectError('description')}>✏️ Добавить замечание</button>
                                </div>
                                <div className="admin-reject__field-value admin-reject__field-value--full admin-reject__field-value--scrollable">
                                    {artToReject.description}
                                </div>
                            </div>

                            {/* Изображение - с превью */}
                            <div className="admin-reject__field">
                                <div className="admin-reject__field-header">
                                    <span className="admin-reject__field-label">Изображение</span>
                                    <button className="admin-reject__add-error" onClick={() => addRejectError('image')}>✏️ Добавить замечание</button>
                                </div>
                                <div className="admin-reject__field-value">
                                    <img
                                        src={artToReject.image_path}
                                        alt={artToReject.title}
                                        className="admin-reject__image-preview"
                                        style={{ maxWidth: '200px', maxHeight: '150px', objectFit: 'cover', borderRadius: '8px' }}
                                    />
                                </div>
                            </div>

                            {/* Стоимость */}
                            {artToReject.cost && (
                                <div className="admin-reject__field">
                                    <div className="admin-reject__field-header">
                                        <span className="admin-reject__field-label">Стоимость</span>
                                        <button className="admin-reject__add-error" onClick={() => addRejectError('cost')}>✏️ Добавить замечание</button>
                                    </div>
                                    <div className="admin-reject__field-value">
                                        {artToReject.cost} {artToReject.currency}
                                    </div>
                                </div>
                            )}

                            {/* Жанр */}
                            {artToReject.genre && (
                                <div className="admin-reject__field">
                                    <div className="admin-reject__field-header">
                                        <span className="admin-reject__field-label">Жанр</span>
                                        <button className="admin-reject__add-error" onClick={() => addRejectError('genre')}>✏️ Добавить замечание</button>
                                    </div>
                                    <div className="admin-reject__field-value">
                                        {artToReject.genre.title}
                                    </div>
                                </div>
                            )}

                            {/* Тип */}
                            {artToReject.style && (
                                <div className="admin-reject__field">
                                    <div className="admin-reject__field-header">
                                        <span className="admin-reject__field-label">Тип</span>
                                        <button className="admin-reject__add-error" onClick={() => addRejectError('type')}>✏️ Добавить замечание</button>
                                    </div>
                                    <div className="admin-reject__field-value">
                                        {artToReject.style.name}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Список добавленных замечаний */}
                        {rejectErrors.length > 0 && (
                            <div className="admin-reject__errors">
                                <h4>📝 Замечания:</h4>
                                {rejectErrors.map((error, index) => (
                                    <div key={index} className="admin-reject__error-item">
                                        <div className="admin-reject__error-header">
                                            <span className="admin-reject__error-field">
                                                {error.field === 'title' ? 'Название' :
                                                    error.field === 'description' ? 'Описание' :
                                                        error.field === 'image' ? 'Изображение' :
                                                            error.field === 'cost' ? 'Стоимость' :
                                                                error.field === 'genre' ? 'Жанр' :
                                                                    error.field === 'type' ? 'Тип' : error.field}
                                            </span>
                                            <button className="admin-reject__error-remove" onClick={() => removeRejectError(index)}>🗑️</button>
                                        </div>
                                        <textarea
                                            className="admin-reject__error-input"
                                            value={error.message}
                                            onChange={(e) => updateRejectError(index, e.target.value)}
                                            placeholder="Введите замечание..."
                                            rows={3}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Общий комментарий */}
                        <div className="admin-reject__global">
                            <label className="admin-reject__global-label">Общий комментарий</label>
                            <textarea
                                className="admin-reject__global-input"
                                value={rejectComment}
                                onChange={(e) => setRejectComment(e.target.value)}
                                placeholder="Добавьте общий комментарий к отклонению..."
                                rows={4}
                            />
                        </div>
                    </div>
                )}
            </AdminModal>
        </div>
    );
};