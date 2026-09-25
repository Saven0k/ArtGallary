// src/components/shared/Admin/sections/Styles/StylesSection.tsx
import { useCallback, useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Palette } from 'lucide-react';
import { useLanguage } from '../../../../../hooks/useLanguage';
import { adminTranslations } from '../../../../../pages/admin/lang';
import {
    getAllStyles,
    createStyle,
    updateStyle,
    deleteStyle,
    type Style,
} from '../../../../../api/styles/main.api';
import SectionHeader from '../../SectionHeader/SectionHeader';
import DataTable, { type Column } from '../../DataTable/DataTable';
import ConfirmModal from '../../ConfirmModal/ConfirmModal';
import EmptyState from '../../EmptyState/EmptyState';
import StyleFormModal from './StyleFormModal';
import { stylesTranslations } from './lang';
import './StylesSection.scss';

const StylesSection = () => {
    const { language } = useLanguage();
    const t = stylesTranslations[language];
    const common = adminTranslations[language].common;

    const [styles, setStyles] = useState<Style[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    const [createOpen, setCreateOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<Style | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Style | null>(null);

    // ---------- load ----------
    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getAllStyles();
            setStyles(data);
        } catch (e) {
            console.error('load styles error:', e);
            setError(t.errors.loadFailed);
        } finally {
            setLoading(false);
        }
    }, [t.errors.loadFailed]);

    useEffect(() => {
        load();
    }, [load]);

    // ---------- actions ----------
    const handleCreate = async (data: { name: string; description?: string }) => {
        setBusy(true);
        try {
            await createStyle(data);
            setCreateOpen(false);
            await load();
        } catch (e) {
            console.error(e);
            setError(t.errors.createFailed);
        } finally {
            setBusy(false);
        }
    };

    const handleUpdate = async (
        id: number,
        data: { name: string; description?: string },
    ) => {
        setBusy(true);
        try {
            await updateStyle(id, data);
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
            await deleteStyle(deleteTarget.id);
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
    const columns: Column<Style>[] = [
        {
            key: 'id',
            title: t.table.id,
            width: '60px',
            render: (s) => s.id,
        },
        {
            key: 'name',
            title: t.table.name,
            render: (s) => (
                <span className="styles-section__name">{s.name}</span>
            ),
        },
        {
            key: 'description',
            title: t.table.description,
            render: (s) => s.description || '—',
        },
        {
            key: 'actions',
            title: t.table.actions,
            align: 'right',
            width: '120px',
            render: (s) => (
                <div className="styles-section__actions">
                    <button
                        type="button"
                        className="styles-section__action styles-section__action--edit"
                        title={t.actions.edit}
                        onClick={() => setEditTarget(s)}
                    >
                        <Pencil size={16} />
                    </button>
                    <button
                        type="button"
                        className="styles-section__action styles-section__action--delete"
                        title={t.actions.delete}
                        onClick={() => setDeleteTarget(s)}
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            ),
        },
    ];

    return (
        <div className="admin-section styles-section">
            <SectionHeader
                title={t.title}
                subtitle={t.subtitle}
                actions={
                    <button
                        type="button"
                        className="styles-section__create-btn"
                        onClick={() => setCreateOpen(true)}
                    >
                        <Plus size={16} />
                        {t.actions.create}
                    </button>
                }
            />

            {error && <div className="styles-section__error">{error}</div>}

            {!loading && styles.length === 0 ? (
                <EmptyState text={t.empty} icon={<Palette size={24} />} />
            ) : (
                <DataTable
                    columns={columns}
                    rows={styles}
                    loading={loading}
                    emptyText={common.empty}
                    rowKey={(s) => s.id}
                />
            )}

            {/* Create */}
            {createOpen && (
                <StyleFormModal
                    mode="create"
                    busy={busy}
                    onClose={() => setCreateOpen(false)}
                    onSubmit={handleCreate}
                />
            )}

            {/* Edit */}
            {editTarget && (
                <StyleFormModal
                    mode="edit"
                    style={editTarget}
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

export default StylesSection;