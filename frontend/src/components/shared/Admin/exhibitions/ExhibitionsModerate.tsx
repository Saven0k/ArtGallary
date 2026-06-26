import { useState, useEffect } from 'react';
import { useNotification } from '../../../../context/NotificationContext';
import { useConfirm } from '../../../../hooks/useConfirm';
import '../AdminPage.css';
import { getAllExhibitions, moderateExhibition, type Exhibition } from '../../../../api/exhibitions/main.api';
import { AdminModal } from '../components/AdminModal';
import { AdminTable } from '../components/AdminTable';
import { useAuth } from '../../../../hooks/useAuth';

export const ExhibitionsModerate = () => {
    const { showNotification } = useNotification();
    const { confirm } = useConfirm();
    const { user } = useAuth();
    const [data, setData] = useState<Exhibition[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedExhibition, setSelectedExhibition] = useState<Exhibition | null>(null);
    const [viewModalOpen, setViewModalOpen] = useState(false);

    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [exhibitionToReject, setExhibitionToReject] = useState<Exhibition | null>(null);
    const [rejectErrors, setRejectErrors] = useState<{ field: string; message: string }[]>([]);
    const [rejectComment, setRejectComment] = useState('');

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

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const response = await getAllExhibitions(1, 100);
            // Фильтруем только те, где moderate === false (не одобрены)
            const unmoderatedExhibitions = response?.data?.filter(ex => !parseModerate(ex.moderate)) || [];
            setData(unmoderatedExhibitions);
        } catch (error) {
            showNotification("Ошибка при загрузке выставок", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id: number, title: string) => {
        const confirmed = await confirm({
            title: "Одобрить выставку",
            message: `Одобрить "${title}"?`,
            confirmText: "Одобрить",
            type: "info"
        });

        if (confirmed) {
            try {
                await moderateExhibition(id, { moderate: true, moderator_id: Number(user?.id), comment: null, errors: {} });
                showNotification("Выставка одобрена", "success");
                loadData();
            } catch (error) {
                showNotification("Ошибка при модерации", "error");
            }
        }
    };

    const openRejectModal = (exhibition: Exhibition) => {
        setExhibitionToReject(exhibition);
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
            await moderateExhibition(exhibitionToReject!.id, { moderate: false, moderator_id: Number(user?.id), comment: rejectComment || null, errors: errorsObject });
            showNotification("Выставка отклонена", "success");
            setRejectModalOpen(false);
            setExhibitionToReject(null);
            loadData();
        } catch (error) {
            showNotification("Ошибка при модерации", "error");
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('ru-RU', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const columns = [
        { key: 'id', header: 'ID', className: 'admin-table__col-id' },
        { key: 'title', header: 'Название', className: 'admin-table__col-title' },
        { key: 'address', header: 'Адрес', className: 'admin-table__col-address' },
        {
            key: 'date',
            header: 'Дата',
            className: 'admin-table__col-date',
            render: (item: Exhibition) => formatDate(item.date)
        },
        {
            key: 'owner',
            header: 'Владелец',
            className: 'admin-table__col-owner',
            render: (item: Exhibition) => {
                const owner = item.artists?.find(a => a.user_id === item.owner_id);
                return owner?.user ? `${owner.user.surname} ${owner.user.name}` : '-';
            }
        }
    ];

    const actions = (item: Exhibition) => (
        <>
            <button
                className="admin-table__view"
                onClick={() => { setSelectedExhibition(item); setViewModalOpen(true); }}
                title="Просмотр"
            >
                👁️
            </button>
            <button
                className="admin-table__approve"
                onClick={() => handleApprove(item.id, item.title)}
                title="Одобрить"
            >
                ✅ Одобрить
            </button>
            <button
                className="admin-table__reject"
                onClick={() => openRejectModal(item)}
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
                <h1>🏛️ Модерация выставок</h1>
                <span className="admin-page__count">На модерации: {data.length}</span>
            </div>

            {data.length === 0 ? (
                <div className="admin-empty">
                    <div className="admin-empty__icon">✅</div>
                    <h3>Нет выставок на модерации</h3>
                    <p>Все выставки уже проверены</p>
                </div>
            ) : (
                <AdminTable
                    data={data}
                    columns={columns}
                    actions={actions}
                    emptyMessage="Нет выставок на модерации"
                />
            )}

            <AdminModal
                isOpen={viewModalOpen}
                onClose={() => { setViewModalOpen(false); setSelectedExhibition(null); }}
                title={selectedExhibition?.title || ''}
            >
                {selectedExhibition && (
                    <div className="admin-view">
                        {selectedExhibition.image_path && (
                            <img
                                src={selectedExhibition.image_path}
                                alt={selectedExhibition.title}
                                className="admin-view__image"
                            />
                        )}
                        <div className="admin-view__section">
                            <h4>Описание</h4>
                            <p>{selectedExhibition.description}</p>
                        </div>
                        <div className="admin-view__grid">
                            <div className="admin-view__item">
                                <span className="admin-view__label">📍 Адрес</span>
                                <span className="admin-view__value">{selectedExhibition.address}</span>
                            </div>
                            <div className="admin-view__item">
                                <span className="admin-view__label">📅 Дата</span>
                                <span className="admin-view__value">{formatDate(selectedExhibition.date)}</span>
                            </div>
                            <div className="admin-view__item">
                                <span className="admin-view__label">💰 Стоимость</span>
                                <span className="admin-view__value">{selectedExhibition.cost}</span>
                            </div>
                        </div>
                        {selectedExhibition.arts && selectedExhibition.arts.length > 0 && (
                            <div className="admin-view__section">
                                <h4>🖼️ Картины на выставке ({selectedExhibition.arts.length})</h4>
                                <div className="admin-view__tags">
                                    {selectedExhibition.arts.map(art => (
                                        <span key={art.id} className="admin-view__tag">{art.title}</span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </AdminModal>

            <AdminModal isOpen={rejectModalOpen} onClose={() => { setRejectModalOpen(false); setExhibitionToReject(null); }} title={`Отклонить: ${exhibitionToReject?.title}`} onSave={handleRejectConfirm} saveText="Отклонить">
                {exhibitionToReject && (
                    <div className="admin-reject">
                        <p className="admin-reject__warning">⚠️ Укажите причины отклонения. Это поможет организатору исправить ошибки.</p>
                        <div className="admin-reject__fields">
                            <div className="admin-reject__field">
                                <div className="admin-reject__field-header"><span className="admin-reject__field-label">Название</span><button className="admin-reject__add-error" onClick={() => addRejectError('title')}>✏️ Добавить замечание</button></div>
                                <div className="admin-reject__field-value">{exhibitionToReject.title}</div>
                            </div>
                            <div className="admin-reject__field">
                                <div className="admin-reject__field-header"><span className="admin-reject__field-label">Описание</span><button className="admin-reject__add-error" onClick={() => addRejectError('description')}>✏️ Добавить замечание</button></div>
                                <div className="admin-reject__field-value admin-reject__field-value--full admin-reject__field-value--scrollable">
                                    {exhibitionToReject.description}
                                </div>
                            </div>
                            <div className="admin-reject__field">
                                <div className="admin-reject__field-header"><span className="admin-reject__field-label">Адрес</span><button className="admin-reject__add-error" onClick={() => addRejectError('address')}>✏️ Добавить замечание</button></div>
                                <div className="admin-reject__field-value">{exhibitionToReject.address}</div>
                            </div>
                            {exhibitionToReject.image_path && (
                                <div className="admin-reject__field">
                                    <div className="admin-reject__field-header"><span className="admin-reject__field-label">Изображение</span><button className="admin-reject__add-error" onClick={() => addRejectError('image')}>✏️ Добавить замечание</button></div>
                                    <div className="admin-reject__field-value">
                                        <img src={exhibitionToReject.image_path} alt={exhibitionToReject.title} style={{ maxWidth: '200px', maxHeight: '150px', objectFit: 'cover', borderRadius: '8px' }} className="admin-reject__image-preview" />
                                    </div>
                                </div>
                            )}
                        </div>

                        {rejectErrors.length > 0 && (
                            <div className="admin-reject__errors">
                                <h4>📝 Замечания:</h4>
                                {rejectErrors.map((error, index) => (
                                    <div key={index} className="admin-reject__error-item">
                                        <div className="admin-reject__error-header">
                                            <span className="admin-reject__error-field">
                                                {error.field === 'title' ? 'Название' :
                                                    error.field === 'description' ? 'Описание' :
                                                        error.field === 'address' ? 'Адрес' :
                                                            error.field === 'image' ? 'Изображение' : error.field}
                                            </span>
                                            <button className="admin-reject__error-remove" onClick={() => removeRejectError(index)}>🗑️</button>
                                        </div>
                                        <textarea className="admin-reject__error-input" value={error.message} onChange={(e) => updateRejectError(index, e.target.value)} placeholder="Введите замечание..." rows={3} />
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="admin-reject__global">
                            <label className="admin-reject__global-label">Общий комментарий</label>
                            <textarea className="admin-reject__global-input" value={rejectComment} onChange={(e) => setRejectComment(e.target.value)} placeholder="Добавьте общий комментарий к отклонению..." rows={4} />
                        </div>
                    </div>
                )}
            </AdminModal>
        </div>
    );
};