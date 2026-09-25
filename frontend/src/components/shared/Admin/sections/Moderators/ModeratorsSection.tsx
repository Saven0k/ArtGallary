// src/components/shared/Admin/sections/Moderators/ModeratorsSection.tsx
import { useCallback, useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, UserCog } from 'lucide-react';
import { useLanguage } from '../../../../../hooks/useLanguage';
import { adminTranslations } from '../../../../../pages/admin/lang';
import {
    getAllModerators,
    createModerator,
    updateModerator,
    deleteModerator,
    type Moderator,
    type CreateModeratorData,
    type UpdateModeratorData,
} from '../../../../../api/moderators/main.api';
import SectionHeader from '../../SectionHeader/SectionHeader';
import DataTable, { type Column } from '../../DataTable/DataTable';
import ConfirmModal from '../../ConfirmModal/ConfirmModal';
import EmptyState from '../../EmptyState/EmptyState';
import ModeratorFormModal from './ModeratorFormModal';
import { moderatorsTranslations } from './lang';
import './ModeratorsSection.scss';

const PAGE_SIZE = 10;

const ModeratorsSection = () => {
    const { language } = useLanguage();
    const t = moderatorsTranslations[language];
    const common = adminTranslations[language].common;

    const [moderators, setModerators] = useState<Moderator[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

    const [createOpen, setCreateOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<Moderator | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Moderator | null>(null);

    // ---------- load ----------
    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await getAllModerators(page, PAGE_SIZE);
            if (!res) throw new Error();
            setModerators(res.data);
            setTotalPages(res.pagination.totalPages);
            setTotal(res.pagination.total);
        } catch (e) {
            console.error('load moderators error:', e);
            setError(t.errors.loadFailed);
        } finally {
            setLoading(false);
        }
    }, [page, t.errors.loadFailed]);

    useEffect(() => {
        load();
    }, [load]);

    // ---------- actions ----------
    const handleCreate = async (data: CreateModeratorData) => {
        setBusy(true);
        try {
            const res = await createModerator(data);
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

    const handleUpdate = async (id: number, data: UpdateModeratorData) => {
        setBusy(true);
        try {
            const res = await updateModerator(id, data);
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
            const ok = await deleteModerator(deleteTarget.id);
            if (!ok) throw new Error();
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
    const columns: Column<Moderator>[] = [
        {
            key: 'avatar',
            title: t.table.avatar,
            width: '64px',
            render: (m) =>
                m.user?.avatar_path ? (
                    <img
                        src={m.user.avatar_path}
                        alt={m.user.name}
                        className="moderators-section__avatar"
                    />
                ) : (
                    <div className="moderators-section__avatar moderators-section__avatar--empty">
                        <UserCog size={18} />
                    </div>
                ),
        },
        {
            key: 'name',
            title: t.table.name,
            render: (m) =>
                m.user
                    ? `${m.user.name ?? ''} ${m.user.surname ?? ''}`.trim() || '—'
                    : '—',
        },
        {
            key: 'email',
            title: t.table.email,
            render: (m) => m.user?.email ?? '—',
        },
        {
            key: 'phone',
            title: t.table.phone,
            render: (m) => m.user?.phone_number ?? '—',
        },
        {
            key: 'createdAt',
            title: t.table.createdAt,
            width: '140px',
            render: (m) =>
                m.createdAt
                    ? new Date(m.createdAt).toLocaleDateString(
                          language === 'ru'
                              ? 'ru-RU'
                              : language === 'zh'
                              ? 'zh-CN'
                              : 'en-US',
                      )
                    : '—',
        },
        {
            key: 'actions',
            title: t.table.actions,
            align: 'right',
            width: '120px',
            render: (m) => (
                <div className="moderators-section__actions">
                    <button
                        type="button"
                        className="moderators-section__action moderators-section__action--edit"
                        title={t.actions.edit}
                        onClick={() => setEditTarget(m)}
                    >
                        <Pencil size={16} />
                    </button>
                    <button
                        type="button"
                        className="moderators-section__action moderators-section__action--delete"
                        title={t.actions.delete}
                        onClick={() => setDeleteTarget(m)}
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            ),
        },
    ];

    return (
        <div className="admin-section moderators-section">
            <SectionHeader
                title={t.title}
                subtitle={t.subtitle}
                actions={
                    <button
                        type="button"
                        className="moderators-section__create-btn"
                        onClick={() => setCreateOpen(true)}
                    >
                        <Plus size={16} />
                        {t.actions.create}
                    </button>
                }
            />

            {error && <div className="moderators-section__error">{error}</div>}

            {!loading && moderators.length === 0 ? (
                <EmptyState text={t.empty} icon={<UserCog size={24} />} />
            ) : (
                <DataTable
                    columns={columns}
                    rows={moderators}
                    loading={loading}
                    emptyText={common.empty}
                    rowKey={(m) => m.id}
                />
            )}

            {!loading && totalPages > 1 && (
                <div className="moderators-section__pagination">
                    <button
                        type="button"
                        disabled={page <= 1}
                        onClick={() => setPage((p) => p - 1)}
                    >
                        ←
                    </button>
                    <span>
                        {page} / {totalPages}
                        <span className="moderators-section__total">
                            {' '}
                            ({total})
                        </span>
                    </span>
                    <button
                        type="button"
                        disabled={page >= totalPages}
                        onClick={() => setPage((p) => p + 1)}
                    >
                        →
                    </button>
                </div>
            )}

            {/* Create */}
            {createOpen && (
                <ModeratorFormModal
                    mode="create"
                    busy={busy}
                    onClose={() => setCreateOpen(false)}
                    onSubmit={handleCreate}
                />
            )}

            {/* Edit */}
            {editTarget && (
                <ModeratorFormModal
                    mode="edit"
                    moderator={editTarget}
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

export default ModeratorsSection;