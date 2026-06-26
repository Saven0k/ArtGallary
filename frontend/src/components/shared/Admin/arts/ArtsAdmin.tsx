import { useState, useEffect } from 'react';
import { useNotification } from '../../../../context/NotificationContext';
import { useConfirm } from '../../../../hooks/useConfirm';
import "../AdminPage.css"
import { deleteArt, getAllArts, moderateArt, type Art } from '../../../../api/arts/main.api';
import { AdminTable } from '../components/AdminTable';
import { AdminModal } from '../components/AdminModal';
import { StatusBadge } from '../components/StatusBadge';
import { useAuth } from '../../../../hooks/useAuth';

export const ArtsAdmin = () => {
    const { showNotification } = useNotification();
    const { confirm } = useConfirm();
    const { user } = useAuth();
    const [data, setData] = useState<Art[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedArt, setSelectedArt] = useState<Art | null>(null);
    const [viewModalOpen, setViewModalOpen] = useState(false);
    
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [artToReject, setArtToReject] = useState<Art | null>(null);
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
            const response = await getAllArts();
            setData(response?.arts || []);
        } catch (error) {
            showNotification("Ошибка при загрузке", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number, title: string) => {
        const confirmed = await confirm({
            title: "Удаление картины",
            message: `Удалить "${title}"?`,
            confirmText: "Удалить",
            type: "danger"
        });
        if (confirmed) {
            try {
                await deleteArt(id);
                showNotification("Картина удалена", "success");
                loadData();
            } catch (error) {
                showNotification("Ошибка при удалении", "error");
            }
        }
    };

    const handleApprove = async (id: number, title: string) => {
        const confirmed = await confirm({
            title: "Одобрить картину",
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

    const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric' });

    const columns = [
        { key: 'id', header: 'ID' },
        { key: 'title', header: 'Название' },
        { key: 'artist', header: 'Художник', render: (item: Art) => `${item.artist?.user?.surname} ${item.artist?.user?.name}` || '-' },
        { 
            key: 'moderate', 
            header: 'Статус', 
            render: (item: Art) => {
                const isModerated = parseModerate(item.moderate);
                return <StatusBadge status={isModerated ? 'approved' : 'pending'} />;
            }
        }
    ];

    const actions = (item: Art) => (
        <>
            <button className="admin-table__view" onClick={() => { setSelectedArt(item); setViewModalOpen(true); }}>👁️</button>
            <button className="admin-table__approve" onClick={() => handleApprove(item.id, item.title)}>✅ Одобрить</button>
            <button className="admin-table__reject" onClick={() => openRejectModal(item)}>❌ Отклонить</button>
            <button className="admin-table__delete" onClick={() => handleDelete(item.id, item.title)}>🗑️</button>
        </>
    );

    if (loading) return <div className="admin-loading">Загрузка...</div>;

    return (
        <div className="admin-page">
            <div className="admin-page__header"><h1>🖼️ Управление картинами</h1></div>
            <AdminTable data={data} columns={columns} actions={actions} emptyMessage="Картины не найдены" />
            
            <AdminModal isOpen={viewModalOpen} onClose={() => { setViewModalOpen(false); setSelectedArt(null); }} title={selectedArt?.title || ''}>
                {selectedArt && (
                    <div className="admin-view">
                        <img src={selectedArt.image_path} alt={selectedArt.title} className="admin-view__image" />
                        <div className="admin-view__grid">
                            <div className="admin-view__item"><span className="admin-view__label">ID</span><span className="admin-view__value">{selectedArt.id}</span></div>
                            <div className="admin-view__item"><span className="admin-view__label">Название</span><span className="admin-view__value">{selectedArt.title}</span></div>
                            <div className="admin-view__item"><span className="admin-view__label">Дата создания</span><span className="admin-view__value">{formatDate(selectedArt.date_published)}</span></div>
                            <div className="admin-view__item"><span className="admin-view__label">Стоимость</span><span className="admin-view__value">{selectedArt.cost} {selectedArt.currency}</span></div>
                            <div className="admin-view__item"><span className="admin-view__label">Лайки</span><span className="admin-view__value">❤️ {selectedArt.likes || 0}</span></div>
                        </div>
                        <div className="admin-view__section"><h4>📝 Описание</h4><p>{selectedArt.description}</p></div>
                        <div className="admin-view__section"><h4>👨‍🎨 Художник</h4><p>{selectedArt.artist?.user?.surname} {selectedArt.artist?.user?.name}</p></div>
                    </div>
                )}
            </AdminModal>

            <AdminModal isOpen={rejectModalOpen} onClose={() => { setRejectModalOpen(false); setArtToReject(null); }} title={`Отклонить: ${artToReject?.title}`} onSave={handleRejectConfirm} saveText="Отклонить">
                {artToReject && (
                    <div className="admin-reject">
                        <p className="admin-reject__warning">⚠️ Укажите причины отклонения. Это поможет художнику исправить ошибки.</p>
                        <div className="admin-reject__fields">
                            <div className="admin-reject__field">
                                <div className="admin-reject__field-header"><span className="admin-reject__field-label">Название</span><button className="admin-reject__add-error" onClick={() => addRejectError('title')}>✏️ Добавить замечание</button></div>
                                <div className="admin-reject__field-value">{artToReject.title}</div>
                            </div>
                            <div className="admin-reject__field">
                                <div className="admin-reject__field-header"><span className="admin-reject__field-label">Описание</span><button className="admin-reject__add-error" onClick={() => addRejectError('description')}>✏️ Добавить замечание</button></div>
                                <div className="admin-reject__field-value">{artToReject.description.substring(0, 100)}...</div>
                            </div>
                            {artToReject.cost && (
                                <div className="admin-reject__field">
                                    <div className="admin-reject__field-header"><span className="admin-reject__field-label">Стоимость</span><button className="admin-reject__add-error" onClick={() => addRejectError('cost')}>✏️ Добавить замечание</button></div>
                                    <div className="admin-reject__field-value">{artToReject.cost} {artToReject.currency}</div>
                                </div>
                            )}
                        </div>

                        {rejectErrors.length > 0 && (
                            <div className="admin-reject__errors">
                                <h4>📝 Замечания:</h4>
                                {rejectErrors.map((error, index) => (
                                    <div key={index} className="admin-reject__error-item">
                                        <div className="admin-reject__error-header"><span className="admin-reject__error-field">{error.field}</span><button className="admin-reject__error-remove" onClick={() => removeRejectError(index)}>🗑️</button></div>
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
        </div>
    );
};