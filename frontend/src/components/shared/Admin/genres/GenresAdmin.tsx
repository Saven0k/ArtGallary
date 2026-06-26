import { useState, useEffect } from 'react';
import { useNotification } from '../../../../context/NotificationContext';
import { useConfirm } from '../../../../hooks/useConfirm';
import '../AdminPage.css';
import { createGenre, deleteGenre, getAllGenres, updateGenre, type Genre } from '../../../../api/genres/main.api';
import { getAllStyles, type Style } from '../../../../api/styles/main.api';
import { AdminTable } from '../components/AdminTable';
import { AdminModal } from '../components/AdminModal';

export const GenresAdmin = () => {
    const { showNotification } = useNotification();
    const { confirm } = useConfirm();
    const [data, setData] = useState<Genre[]>([]);
    const [types, setTypes] = useState<Style[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Genre | null>(null);
    const [formData, setFormData] = useState({ title: '', description: '', typeId: '' });

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [genres, typesData] = await Promise.all([getAllGenres(), getAllStyles()]);
            setData(genres);
            setTypes(typesData);
        } catch (error) {
            showNotification("Ошибка при загрузке", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.title.trim()) return;
        try {
            if (editingItem) {
                await updateGenre(editingItem.id, { title: formData.title, description: formData.description, type_id: formData.typeId ? Number(formData.typeId) : undefined });
                showNotification("Жанр обновлен", "success");
            } else {
                await createGenre({ title: formData.title, description: formData.description, type_id: formData.typeId ? Number(formData.typeId) : undefined });
                showNotification("Жанр добавлен", "success");
            }
            setModalOpen(false);
            setEditingItem(null);
            setFormData({ title: '', description: '', typeId: '' });
            loadData();
        } catch (error) {
            showNotification("Ошибка при сохранении", "error");
        }
    };

    const handleDelete = async (id: number, title: string) => {
        const confirmed = await confirm({
            title: "Удаление",
            message: `Удалить жанр "${title}"?`,
            confirmText: "Удалить",
            type: "danger"
        });
        if (confirmed) {
            try {
                await deleteGenre(id);
                showNotification("Жанр удален", "success");
                loadData();
            } catch (error) {
                showNotification("Ошибка при удалении", "error");
            }
        }
    };

    const columns = [
        { key: 'id', header: 'ID' },
        { key: 'title', header: 'Название' },
        { key: 'description', header: 'Описание', render: (item: Genre) => item.description || '-' },
        { key: 'typeId', header: 'Тип', render: (item: Genre) => types.find(t => t.id === item.type_id)?.name || '-' }
    ];

    const actions = (item: Genre) => (
        <>
            <button className="admin-table__edit" onClick={() => { setEditingItem(item); setFormData({ title: item.title, description: item.description || '', typeId: item.type_id?.toString() || '' }); setModalOpen(true); }}>✏️</button>
            <button className="admin-table__delete" onClick={() => handleDelete(item.id, item.title)}>🗑️</button>
        </>
    );

    if (loading) return <div className="admin-loading">Загрузка...</div>;

    return (
        <div className="admin-page">
            <div className="admin-page__header">
                <h1>🎨 Жанры</h1>
                <button className="admin-page__add-btn" onClick={() => { setEditingItem(null); setFormData({ title: '', description: '', typeId: '' }); setModalOpen(true); }}>+ Добавить</button>
            </div>
            <AdminTable data={data} columns={columns} actions={actions} emptyMessage="Жанры не найдены" />
            <AdminModal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditingItem(null); }} title={editingItem ? "Редактировать жанр" : "Добавить жанр"} onSave={handleSave}>
                <div className="admin-form">
                    <label className="admin-form__label">Название *</label>
                    <input type="text" className="admin-form__input" value={formData.title} onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))} placeholder="Введите название" autoFocus />
                    <label className="admin-form__label">Описание</label>
                    <textarea className="admin-form__textarea" value={formData.description} onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} placeholder="Описание" rows={3} />
                    <label className="admin-form__label">Тип</label>
                    <select className="admin-form__select" value={formData.typeId} onChange={(e) => setFormData(prev => ({ ...prev, typeId: e.target.value }))}>
                        <option value="">Не выбран</option>
                        {types.map(type => <option key={type.id} value={type.id}>{type.name}</option>)}
                    </select>
                </div>
            </AdminModal>
        </div>
    );
};