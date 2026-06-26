import { useState, useEffect } from 'react';
import { useNotification } from '../../../../context/NotificationContext';
import { useConfirm } from '../../../../hooks/useConfirm';
import '../AdminPage.css';
import { createCountry, deleteCountry, getAllCountries, updateCountry, type Country } from '../../../../api/contries/main.api';
import { AdminTable } from '../components/AdminTable';
import { AdminModal } from '../components/AdminModal';

export const CountriesAdmin = () => {
    const { showNotification } = useNotification();
    const { confirm } = useConfirm();
    const [data, setData] = useState<Country[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Country | null>(null);
    const [formData, setFormData] = useState({ name: '' });

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            setData(await getAllCountries());
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
                await updateCountry(editingItem.id, formData);
                showNotification("Страна обновлена", "success");
            } else {
                await createCountry(formData);
                showNotification("Страна добавлена", "success");
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
            message: `Удалить "${name}"?`,
            confirmText: "Удалить",
            type: "danger"
        });
        if (confirmed) {
            try {
                await deleteCountry(id);
                showNotification("Страна удалена", "success");
                loadData();
            } catch (error) {
                showNotification("Ошибка при удалении", "error");
            }
        }
    };

    const columns = [
        { key: 'id', header: 'ID' },
        { key: 'name', header: 'Название' }
    ];

    const actions = (item: Country) => (
        <>
            <button className="admin-table__edit" onClick={() => { setEditingItem(item); setFormData({ name: item.name }); setModalOpen(true); }}>✏️</button>
            <button className="admin-table__delete" onClick={() => handleDelete(item.id, item.name)}>🗑️</button>
        </>
    );

    if (loading) return <div className="admin-loading">Загрузка...</div>;

    return (
        <div className="admin-page">
            <div className="admin-page__header">
                <h1>🌍 Страны</h1>
                <button className="admin-page__add-btn" onClick={() => { setEditingItem(null); setFormData({ name: '' }); setModalOpen(true); }}>+ Добавить</button>
            </div>
            <AdminTable data={data} columns={columns} actions={actions} emptyMessage="Страны не найдены" />
            <AdminModal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditingItem(null); }} title={editingItem ? "Редактировать страну" : "Добавить страну"} onSave={handleSave}>
                <div className="admin-form">
                    <label className="admin-form__label">Название</label>
                    <input type="text" className="admin-form__input" value={formData.name} onChange={(e) => setFormData({ name: e.target.value })} placeholder="Введите название" autoFocus />
                </div>
            </AdminModal>
        </div>
    );
};