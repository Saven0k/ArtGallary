import { useState, useEffect } from 'react';
import { useNotification } from '../../../../context/NotificationContext';
import { useConfirm } from '../../../../hooks/useConfirm';
import '../AdminPage.css';
import { createStyle, deleteStyle, getAllStyles, updateStyle, type Style } from '../../../../api/styles/main.api';
import { AdminTable } from '../components/AdminTable';
import { AdminModal } from '../components/AdminModal';

export const TypesAdmin = () => {
    const { showNotification } = useNotification();
    const { confirm } = useConfirm();
    const [data, setData] = useState<Style[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Style | null>(null);
    const [formData, setFormData] = useState({ name: '' });

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            setData(await getAllStyles());
        } catch (error) {
            showNotification("Ошибка при загрузке", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.name.trim()) return;
        try {
            if (editingItem) {
                await updateStyle(editingItem.id, formData);
                showNotification("Стиль обновлен", "success");
            } else {
                await createStyle(formData);
                showNotification("Стиль добавлен", "success");
            }
            setModalOpen(false);
            setEditingItem(null);
            setFormData({ name: '' });
            loadData();
        } catch (error) {
            showNotification("Ошибка при сохранении", "error");
        }
    };

    const handleDelete = async (id: number, name: string) => {
        const confirmed = await confirm({
            title: "Удаление",
            message: `Удалить стиль "${name}"?`,
            confirmText: "Удалить",
            type: "danger"
        });
        if (confirmed) {
            try {
                await deleteStyle(id);
                showNotification("Стиль удален", "success");
                loadData();
            } catch (error) {
                showNotification("Ошибка при удалении", "error");
            }
        }
    };

    const columns = [
        { key: 'id', header: 'ID' },
        { key: 'name', header: 'Название' }];

    const actions = (item: Style) => (
        <>
            <button className="admin-table__edit" onClick={() => { setEditingItem(item); setFormData({ name: item.name }); setModalOpen(true); }}>✏️</button>
            <button className="admin-table__delete" onClick={() => handleDelete(item.id, item.name)}>🗑️</button>
        </>
    );

    if (loading) return <div className="admin-loading">Загрузка...</div>;

    return (
        <div className="admin-page">
            <div className="admin-page__header">
                <h1>🏷️ Типы</h1>
                <button className="admin-page__add-btn" onClick={() => { setEditingItem(null); setFormData({ name: '' }); setModalOpen(true); }}>+ Добавить</button>
            </div>
            <AdminTable data={data} columns={columns} actions={actions} emptyMessage="Типы не найдены" />
            <AdminModal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditingItem(null); }} title={editingItem ? "Редактировать стиль" : "Добавить стиль"} onSave={handleSave}>
                <div className="admin-form">
                    <label className="admin-form__label">Название *</label>
                    <input type="text" className="admin-form__input" value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} placeholder="Введите название" autoFocus />
                </div>
            </AdminModal>
        </div>
    );
};