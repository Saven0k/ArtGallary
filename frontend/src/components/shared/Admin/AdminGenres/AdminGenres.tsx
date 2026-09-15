// src/components/admin/AdminGenres/AdminGenres.tsx
import { useState, useEffect } from 'react';
import { getAllGenres, createGenre, updateGenre, deleteGenre, type Genre } from '../../../../api/genres/main.api';
import { getAllArtTypes, type ArtType } from '../../../../api/art-types/main.api';
import AdminTable from '../AdminTable/AdminTable';
import AdminModal from '../AdminModal/AdminModal';
import { adminTranslations } from '../../../../pages/admin/lang';

const AdminGenres = () => {
    const t = adminTranslations.admin;
    const [data, setData] = useState<Genre[]>([]);
    const [artTypes, setArtTypes] = useState<ArtType[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<Genre | null>(null);
    const [formData, setFormData] = useState({ title: '', art_type_id: '', description: '' });
    const [submitting, setSubmitting] = useState(false);

    const columns = [
        { key: 'id', label: 'ID' },
        { key: 'title', label: t.name },
        { key: 'art_type_id', label: t.artType, render: (v: number) => {
            const found = artTypes.find(a => a.id === v);
            return found?.name || v;
        }},
        { key: 'description', label: t.description, render: (v: string) => v || '—' },
    ];

    const fetchData = async () => {
        try {
            const [genres, types] = await Promise.all([
                getAllGenres('ru'),
                getAllArtTypes()
            ]);
            setData(genres);
            setArtTypes(types);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleAdd = () => {
        setEditing(null);
        setFormData({ title: '', art_type_id: '', description: '' });
        setModalOpen(true);
    };

    const handleEdit = (item: Genre) => {
        setEditing(item);
        setFormData({ 
            title: item.title, 
            art_type_id: String(item.art_type_id), 
            description: item.description || '' 
        });
        setModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm(t.deleteConfirm)) return;
        try {
            await deleteGenre(id);
            await fetchData();
        } catch (e) {
            console.error(e);
        }
    };

    const handleSubmit = async () => {
        if (!formData.title.trim() || !formData.art_type_id) return;
        setSubmitting(true);
        try {
            const payload = {
                title: formData.title,
                art_type_id: Number(formData.art_type_id),
                description: formData.description || undefined,
            };
            if (editing) {
                await updateGenre(editing.id, payload);
            } else {
                await createGenre(payload);
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
                title={t.genres}
                columns={columns}
                data={data}
                onAdd={handleAdd}
                onEdit={handleEdit}
                onDelete={handleDelete}
                loading={loading}
                addLabel={t.addGenre}
            />

            <AdminModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title={editing ? t.editGenre : t.addGenre}
                onSubmit={handleSubmit}
                loading={submitting}
            >
                <div className="admin-form">
                    <div className="admin-form__group">
                        <label>{t.name}</label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder={t.namePlaceholder}
                            className="admin-form__input"
                        />
                    </div>
                    <div className="admin-form__group">
                        <label>{t.artType}</label>
                        <select
                            value={formData.art_type_id}
                            onChange={(e) => setFormData({ ...formData, art_type_id: e.target.value })}
                            className="admin-form__select"
                        >
                            <option value="">{t.selectArtType}</option>
                            {artTypes.map((type) => (
                                <option key={type.id} value={type.id}>{type.name}</option>
                            ))}
                        </select>
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

export default AdminGenres;