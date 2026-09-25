// src/components/shared/Admin/sections/ArtTypes/ArtTypesSection.tsx
import { useCallback, useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Sparkles, Brush } from 'lucide-react';
import { useLanguage } from '../../../../../hooks/useLanguage';
import { adminTranslations } from '../../../../../pages/admin/lang';
import {
    getAllArtTypes,
    createArtType,
    updateArtType,
    deleteArtType,
    seedArtTypes,
    type ArtType,
    type CreateArtTypeData,
    type UpdateArtTypeData,
} from '../../../../../api/art-types/main.api';
import SectionHeader from '../../SectionHeader/SectionHeader';
import DataTable, { type Column } from '../../DataTable/DataTable';
import ConfirmModal from '../../ConfirmModal/ConfirmModal';
import EmptyState from '../../EmptyState/EmptyState';
import ArtTypeFormModal from './ArtTypeFormModal';
import { artTypesTranslations } from './lang';
import './ArtTypesSection.scss';

const ArtTypesSection = () => {
    const { language } = useLanguage();
    const t = artTypesTranslations[language];
    const common = adminTranslations[language].common;

    const [artTypes, setArtTypes] = useState<ArtType[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    const [createOpen, setCreateOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<ArtType | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<ArtType | null>(null);
    const [seedOpen, setSeedOpen] = useState(false);

    // ---------- load ----------
    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getAllArtTypes();
            setArtTypes(data);
        } catch (e) {
            console.error('load art types error:', e);
            setError(t.errors.loadFailed);
        } finally {
            setLoading(false);
        }
    }, [t.errors.loadFailed]);

    useEffect(() => {
        load();
    }, [load]);

    // ---------- actions ----------
    const handleCreate = async (data: CreateArtTypeData) => {
        setBusy(true);
        try {
            await createArtType(data);
            setCreateOpen(false);
            await load();
        } catch (e) {
            console.error(e);
            setError(t.errors.createFailed);
        } finally {
            setBusy(false);
        }
    };

    const handleUpdate = async (id: number, data: UpdateArtTypeData) => {
        setBusy(true);
        try {
            await updateArtType(id, data);
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
            await deleteArtType(deleteTarget.id);
            setDeleteTarget(null);
            await load();
        } catch (e) {
            console.error(e);
            setError(t.errors.deleteFailed);
        } finally {
            setBusy(false);
        }
    };

    const handleSeed = async () => {
        setBusy(true);
        try {
            await seedArtTypes();
            setSeedOpen(false);
            await load();
        } catch (e) {
            console.error(e);
            setError(t.errors.seedFailed);
        } finally {
            setBusy(false);
        }
    };

    // ---------- columns ----------
    const columns: Column<ArtType>[] = [
        { key: 'id', title: t.table.id, width: '60px', render: (a) => a.id },
        {
            key: 'name',
            title: t.table.name,
            render: (a) => (
                <span className="art-types-section__name">{a.name}</span>
            ),
        },
        {
            key: 'description',
            title: t.table.description,
            render: (a) => a.description || '—',
        },
        {
            key: 'actions',
            title: t.table.actions,
            align: 'right',
            width: '120px',
            render: (a) => (
                <div className="art-types-section__actions">
                    <button
                        type="button"
                        className="art-types-section__action art-types-section__action--edit"
                        title={t.actions.edit}
                        onClick={() => setEditTarget(a)}
                    >
                        <Pencil size={16} />
                    </button>
                    <button
                        type="button"
                        className="art-types-section__action art-types-section__action--delete"
                        title={t.actions.delete}
                        onClick={() => setDeleteTarget(a)}
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            ),
        },
    ];

    return (
        <div className="admin-section art-types-section">
            <SectionHeader
                title={t.title}
                subtitle={t.subtitle}
                actions={
                    <>
                        <button
                            type="button"
                            className="art-types-section__seed-btn"
                            onClick={() => setSeedOpen(true)}
                            disabled={busy}
                        >
                            <Sparkles size={16} />
                            {t.actions.seed}
                        </button>
                        <button
                            type="button"
                            className="art-types-section__create-btn"
                            onClick={() => setCreateOpen(true)}
                        >
                            <Plus size={16} />
                            {t.actions.create}
                        </button>
                    </>
                }
            />

            {error && <div className="art-types-section__error">{error}</div>}

            {!loading && artTypes.length === 0 ? (
                <EmptyState text={t.empty} icon={<Brush size={24} />} />
            ) : (
                <DataTable
                    columns={columns}
                    rows={artTypes}
                    loading={loading}
                    emptyText={common.empty}
                    rowKey={(a) => a.id}
                />
            )}

            {createOpen && (
                <ArtTypeFormModal
                    mode="create"
                    busy={busy}
                    onClose={() => setCreateOpen(false)}
                    onSubmit={handleCreate}
                />
            )}

            {editTarget && (
                <ArtTypeFormModal
                    mode="edit"
                    artType={editTarget}
                    busy={busy}
                    onClose={() => setEditTarget(null)}
                    onSubmit={(data) => handleUpdate(editTarget.id, data)}
                />
            )}

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

            {seedOpen && (
                <ConfirmModal
                    title={t.seedModal.title}
                    text={t.seedModal.text}
                    confirmLabel={t.seedModal.confirm}
                    cancelLabel={common.cancel}
                    onConfirm={handleSeed}
                    onClose={() => setSeedOpen(false)}
                />
            )}
        </div>
    );
};

export default ArtTypesSection;