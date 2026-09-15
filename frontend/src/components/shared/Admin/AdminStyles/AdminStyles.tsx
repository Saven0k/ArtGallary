// src/components/admin/AdminStyles/AdminStyles.tsx
import { useState, useEffect } from 'react';
import { getAllStyles, createStyle, updateStyle, deleteStyle, type Style } from '../../../../api/styles/main.api';
import AdminTable from '../AdminTable/AdminTable';
import AdminModal from '../AdminModal/AdminModal';

import './AdminStyles.scss';
import { adminTranslations } from '../../../../pages/admin/lang';

const AdminStyles = () => {
    const t = adminTranslations.admin;
    const [data, setData] = useState<Style[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<Style | null>(null);
    const [formData, setFormData] = useState({ name: '', description: '' });
    const [submitting, setSubmitting] = useState(false);

    const columns = [
        { key: 'id', label: 'ID' },
        { key: 'name', label: t.name },
        { key: 'description', label: t.description, render: (v: string) => v || '—' },
    ];

    const fetchData = async () => {
        try {
            const res = await getAllStyles();
            setData(res);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleAdd = () => {
        setEditing(null);
        setFormData({ name: '', description: '' });
        setModalOpen(true);
    };

    const handleEdit = (item: Style) => {
        setEditing(item);
        setFormData({ name: item.name, description: item.description || '' });
        setModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm(t.deleteConfirm)) return;
        try {
            await deleteStyle(id);
            await fetchData();
        } catch (e) {
            console.error(e);
        }
    };

    const handleSubmit = async () => {
        if (!formData.name.trim()) return;
        setSubmitting(true);
        try {
            if (editing) {
                await updateStyle(editing.id, formData);
            } else {
                await createStyle(formData);
            }
            setModalOpen(false);
            await fetchData();
        } catch (e) {
            console.error(e);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <AdminTable
                title={t.styles}
                columns={columns}
                data={data}
                onAdd={handleAdd}
                onEdit={handleEdit}
                onDelete={handleDelete}
                loading={loading}
                addLabel={t.addStyle}
            />

            <AdminModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title={editing ? t.editStyle : t.addStyle}
                onSubmit={handleSubmit}
                loading={submitting}
            >
                <div className="admin-form">
                    <div className="admin-form__group">
                        <label>{t.name}</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder={t.namePlaceholder}
                            className="admin-form__input"
                        />
                    </div>
                    <div className="admin-form__group">
                        <label>{t.description}</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder={t.descriptionPlaceholder}
                            className="admin-form__textarea"
                            rows={3}
                        />
                    </div>
                </div>
            </AdminModal>
        </>
    );
};

export default AdminStyles;