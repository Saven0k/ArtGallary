// src/components/shared/Admin/sections/Professions/ProfessionsSection.tsx
import { useCallback, useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Briefcase } from 'lucide-react';
import { useLanguage } from '../../../../../hooks/useLanguage';
import { adminTranslations } from '../../../../../pages/admin/lang';
import {
    getAllProfessions,
    createProfession,
    updateProfession,
    deleteProfession,
    type Profession,
    type CreateProfessionData,
    type UpdateProfessionData,
} from '../../../../../api/professions/main.api';
import SectionHeader from '../../SectionHeader/SectionHeader';
import DataTable, { type Column } from '../../DataTable/DataTable';
import ConfirmModal from '../../ConfirmModal/ConfirmModal';
import EmptyState from '../../EmptyState/EmptyState';
import ProfessionFormModal from './ProfessionFormModal';
import { professionsTranslations } from './lang';
import './ProfessionsSection.scss';

const ProfessionsSection = () => {
    const { language } = useLanguage();
    const t = professionsTranslations[language];
    const common = adminTranslations[language].common;

    const [professions, setProfessions] = useState<Profession[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    const [createOpen, setCreateOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<Profession | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Profession | null>(null);

    // ---------- load ----------
    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getAllProfessions();
            if (!data) throw new Error();
            setProfessions(data);
        } catch (e) {
            console.error('load professions error:', e);
            setError(t.errors.loadFailed);
        } finally {
            setLoading(false);
        }
    }, [t.errors.loadFailed]);

    useEffect(() => {
        load();
    }, [load]);

    // ---------- actions ----------
    const handleCreate = async (data: CreateProfessionData) => {
        setBusy(true);
        try {
            const res = await createProfession(data);
            if (!res) throw new Error();
            setCreateOpen(false);
            await load();
        } catch (e) {
            console.error(e);
            setError(t.errors.createFailed);
        } finally {
            setBusy(false);
        }
    };

    const handleUpdate = async (id: number, data: UpdateProfessionData) => {
        setBusy(true);
        try {
            const res = await updateProfession(id, data);
            if (!res) throw new Error();
            setEditTarget(null);
            await load();
        } catch (e) {
            console.error(e);
            setError(t.errors.updateFailed);
        } finally {
            setBusy(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setBusy(true);
        try {
            const res = await deleteProfession(deleteTarget.id);
            if (!res) throw new Error();
            setDeleteTarget(null);
            await load();
        } catch (e) {
            console.error(e);
            setError(t.errors.deleteFailed);
        } finally {
            setBusy(false);
        }
    };

    // ---------- columns ----------
    const columns: Column<Profession>[] = [
        {
            key: 'id',
            title: t.table.id,
            width: '60px',
            render: (p) => p.id,
        },
        {
            key: 'name',
            title: t.table.name,
            render: (p) => (
                <span className="professions-section__name">{p.name}</span>
            ),
        },
        {
            key: 'description',
            title: t.table.description,
            render: (p) => p.description || '—',
        },
        {
            key: 'actions',
            title: t.table.actions,
            align: 'right',
            width: '120px',
            render: (p) => (
                <div className="professions-section__actions">
                    <button
                        type="button"
                        className="professions-section__action professions-section__action--edit"
                        title={t.actions.edit}
                        onClick={() => setEditTarget(p)}
                    >
                        <Pencil size={16} />
                    </button>
                    <button
                        type="button"
                        className="professions-section__action professions-section__action--delete"
                        title={t.actions.delete}
                        onClick={() => setDeleteTarget(p)}
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            ),
        },
    ];

    return (
        <div className="admin-section professions-section">
            <SectionHeader
                title={t.title}
                subtitle={t.subtitle}
                actions={
                    <button
                        type="button"
                        className="professions-section__create-btn"
                        onClick={() => setCreateOpen(true)}
                    >
                        <Plus size={16} />
                        {t.actions.create}
                    </button>
                }
            />

            {error && <div className="professions-section__error">{error}</div>}

            {!loading && professions.length === 0 ? (
                <EmptyState
                    text={t.empty}
                    icon={<Briefcase size={24} />}
                />
            ) : (
                <DataTable
                    columns={columns}
                    rows={professions}
                    loading={loading}
                    emptyText={common.empty}
                    rowKey={(p) => p.id}
                />
            )}

            {/* Create */}
            {createOpen && (
                <ProfessionFormModal
                    mode="create"
                    busy={busy}
                    onClose={() => setCreateOpen(false)}
                    onSubmit={handleCreate}
                />
            )}

            {/* Edit */}
            {editTarget && (
                <ProfessionFormModal
                    mode="edit"
                    profession={editTarget}
                    busy={busy}
                    onClose={() => setEditTarget(null)}
                    onSubmit={(data) => handleUpdate(editTarget.id, data)}
                />
            )}

            {/* Delete */}
            {deleteTarget && (
                <ConfirmModal
                    title={t.deleteModal.title}
                    text={t.deleteModal.text}
                    confirmLabel={t.deleteModal.confirm}
                    cancelLabel={common.cancel}
                    danger
                    onConfirm={handleDelete}
                    onClose={() => setDeleteTarget(null)}
                />
            )}
        </div>
    );
};

export default ProfessionsSection;