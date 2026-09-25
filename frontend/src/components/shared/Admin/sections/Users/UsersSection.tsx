// src/components/shared/Admin/sections/Users/UsersSection.tsx
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Eye,
    Pencil,
    Trash2,
    RotateCcw,
    Plus,
    User as UserIcon,
} from 'lucide-react';
import { useLanguage } from '../../../../../hooks/useLanguage';
import { adminTranslations } from '../../../../../pages/admin/lang';
import {
    getAllUsers,
    getDeletedUsers,
    createUser,
    updateUser,
    deleteUser,
    restoreUser,
    type User,
    type CreateUserData,
    type UpdateUserData,
} from '../../../../../api/users/main.api';
import SectionHeader from '../../SectionHeader/SectionHeader';
import DataTable, { type Column } from '../../DataTable/DataTable';
import ConfirmModal from '../../ConfirmModal/ConfirmModal';
import EmptyState from '../../EmptyState/EmptyState';
import UserFormModal from './UserFormModal';
import UserViewModal from './UserViewModal';
import { usersTranslations } from './lang';
import './UsersSection.scss';

type Tab = 'all' | 'deleted';

const UsersSection = () => {
    const { language } = useLanguage();
    const t = usersTranslations[language];
    const common = adminTranslations[language].common;

    const [tab, setTab] = useState<Tab>('all');
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const PAGE_SIZE = 15;

    // модалки
    const [createOpen, setCreateOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<User | null>(null);
    const [viewTarget, setViewTarget] = useState<User | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
    const [restoreTarget, setRestoreTarget] = useState<User | null>(null);
    const [busy, setBusy] = useState(false);

    // ---------- load ----------
    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = tab === 'deleted' ? await getDeletedUsers() : await getAllUsers();
            if (!res) throw new Error();
            setUsers(res);
        } catch (e) {
            console.error('load users error:', e);
            setError(t.errors.loadFailed);
        } finally {
            setLoading(false);
        }
    }, [tab, t.errors.loadFailed]);

    useEffect(() => {
        load();
    }, [load]);

    useEffect(() => {
        setPage(1);
    }, [tab, search]);

    // ---------- filter + paginate ----------
    const filtered = useMemo(() => {
        if (!search.trim()) return users;
        const q = search.trim().toLowerCase();
        return users.filter(
            (u) =>
                u.name?.toLowerCase().includes(q) ||
                u.surname?.toLowerCase().includes(q) ||
                u.email?.toLowerCase().includes(q),
        );
    }, [users, search]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const paginated = useMemo(
        () =>
            filtered.slice((page - 1) * PAGE_SIZE, (page - 1) * PAGE_SIZE + PAGE_SIZE),
        [filtered, page],
    );

    // ---------- actions ----------
    const handleCreate = async (data: CreateUserData) => {
        setBusy(true);
        try {
            const res = await createUser(data);
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

    const handleUpdate = async (id: number, data: UpdateUserData) => {
        setBusy(true);
        try {
            const res = await updateUser(id, data);
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
            const res = await deleteUser(deleteTarget.id);
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

    const handleRestore = async () => {
        if (!restoreTarget) return;
        setBusy(true);
        try {
            const res = await restoreUser(restoreTarget.id);
            if (!res) throw new Error();
            setRestoreTarget(null);
            await load();
        } catch (e) {
            console.error(e);
            setError(t.errors.restoreFailed);
        } finally {
            setBusy(false);
        }
    };

    // ---------- columns ----------
    const columns: Column<User>[] = useMemo(
        () => [
            {
                key: 'avatar',
                title: t.table.avatar,
                width: '64px',
                render: (u) =>
                    u.authorProfile?.avatar_path ? (
                        <img
                            src={u.authorProfile.avatar_path}
                            alt={u.name}
                            className="users-section__avatar"
                        />
                    ) : (
                        <div className="users-section__avatar users-section__avatar--empty">
                            <UserIcon size={18} />
                        </div>
                    ),
            },
            {
                key: 'name',
                title: t.table.name,
                render: (u) =>
                    `${u.name ?? ''} ${u.surname ?? ''}`.trim() || '—',
            },
            { key: 'email', title: t.table.email },
            {
                key: 'role',
                title: t.table.role,
                render: (u) => (
                    <span className={`users-section__role users-section__role--${u.role}`}>
                        {t.roles[u.role] ?? u.role}
                    </span>
                ),
            },
            {
                key: 'country',
                title: t.table.country,
                render: (u) =>
                    u.country?.name_ru ?? u.country?.name_en ?? '—',
            },
            {
                key: 'status',
                title: t.table.status,
                render: (u) =>
                    u.is_deleted ? (
                        <span className="users-section__status users-section__status--deleted">
                            {t.status.deleted}
                        </span>
                    ) : (
                        <span className="users-section__status users-section__status--active">
                            {t.status.active}
                        </span>
                    ),
            },
            {
                key: 'registeredAt',
                title: t.table.registeredAt,
                width: '120px',
                render: (u) =>
                    u.createdAt
                        ? new Date(u.createdAt).toLocaleDateString(
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
                width: '160px',
                render: (u) => (
                    <div className="users-section__actions">
                        <button
                            type="button"
                            className="users-section__action"
                            title={t.actions.view}
                            onClick={() => setViewTarget(u)}
                        >
                            <Eye size={16} />
                        </button>

                        {!u.is_deleted && (
                            <>
                                <button
                                    type="button"
                                    className="users-section__action users-section__action--edit"
                                    title={t.actions.edit}
                                    onClick={() => setEditTarget(u)}
                                >
                                    <Pencil size={16} />
                                </button>
                                <button
                                    type="button"
                                    className="users-section__action users-section__action--delete"
                                    title={t.actions.delete}
                                    onClick={() => setDeleteTarget(u)}
                                >
                                    <Trash2 size={16} />
                                </button>
                            </>
                        )}

                        {u.is_deleted && (
                            <button
                                type="button"
                                className="users-section__action users-section__action--restore"
                                title={t.actions.restore}
                                onClick={() => setRestoreTarget(u)}
                            >
                                <RotateCcw size={16} />
                            </button>
                        )}
                    </div>
                ),
            },
        ],
        [t, language],
    );

    const tabs: { value: Tab; label: string }[] = [
        { value: 'all', label: t.tabs.all },
        { value: 'deleted', label: t.tabs.deleted },
    ];

    return (
        <div className="admin-section users-section">
            <SectionHeader
                title={t.title}
                subtitle={t.subtitle}
                actions={
                    <button
                        type="button"
                        className="users-section__create-btn"
                        onClick={() => setCreateOpen(true)}
                    >
                        <Plus size={16} />
                        {t.actions.create}
                    </button>
                }
            />

            <div className="users-section__toolbar">
                <div className="users-section__tabs">
                    {tabs.map((x) => (
                        <button
                            key={x.value}
                            type="button"
                            className={`users-section__tab ${
                                tab === x.value ? 'is-active' : ''
                            }`}
                            onClick={() => setTab(x.value)}
                        >
                            {x.label}
                        </button>
                    ))}
                </div>

                <input
                    type="text"
                    className="users-section__search"
                    placeholder={common.search}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {error && <div className="users-section__error">{error}</div>}

            {!loading && paginated.length === 0 ? (
                <EmptyState text={t.empty} icon={<UserIcon size={24} />} />
            ) : (
                <DataTable
                    columns={columns}
                    rows={paginated}
                    loading={loading}
                    emptyText={common.empty}
                    rowKey={(u) => u.id}
                />
            )}

            {!loading && totalPages > 1 && (
                <div className="users-section__pagination">
                    <button
                        type="button"
                        disabled={page <= 1}
                        onClick={() => setPage((p) => p - 1)}
                    >
                        ←
                    </button>
                    <span>
                        {page} / {totalPages}
                        <span className="users-section__total">
                            {' '}
                            ({filtered.length})
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

            {/* View */}
            {viewTarget && (
                <UserViewModal user={viewTarget} onClose={() => setViewTarget(null)} />
            )}

            {/* Create */}
            {createOpen && (
                <UserFormModal
                    mode="create"
                    busy={busy}
                    onClose={() => setCreateOpen(false)}
                    onSubmit={(data) => handleCreate(data as CreateUserData)}
                />
            )}

            {/* Edit */}
            {editTarget && (
                <UserFormModal
                    mode="edit"
                    user={editTarget}
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

            {/* Restore */}
            {restoreTarget && (
                <ConfirmModal
                    title={t.restoreModal.title}
                    text={t.restoreModal.text}
                    confirmLabel={t.restoreModal.confirm}
                    cancelLabel={common.cancel}
                    onConfirm={handleRestore}
                    onClose={() => setRestoreTarget(null)}
                />
            )}
        </div>
    );
};

export default UsersSection;