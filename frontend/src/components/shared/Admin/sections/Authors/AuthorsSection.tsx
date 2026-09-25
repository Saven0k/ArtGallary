// src/components/shared/Admin/sections/Authors/AuthorsSection.tsx
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Eye,
    Check,
    X,
    Trash2,
    RotateCcw,
    Plus,
    User as UserIcon,
} from 'lucide-react';
import { useLanguage } from '../../../../../hooks/useLanguage';
import { useAuth } from '../../../../../hooks/useAuth';
import { adminTranslations } from '../../../../../pages/admin/lang';
import {
    getAuthors,
    getModeratedAuthors,
    getUnmoderatedAuthors,
    getAuthorById,
    createAuthor,
    moderateAuthor,
    deleteAuthor,
    restoreAuthor,
    type AuthorProfileResponse,
    type CreateAuthorData,
} from '../../../../../api/authors/main.api';
import SectionHeader from '../../SectionHeader/SectionHeader';
import DataTable, { type Column } from '../../DataTable/DataTable';
import ConfirmModal from '../../ConfirmModal/ConfirmModal';
import EmptyState from '../../EmptyState/EmptyState';
import AuthorFormModal from './AuthorFormModal';
import AuthorViewModal from './AuthorViewModal';
import { authorsTranslations } from './lang';
import { getAuthorStatus } from './utils';
import './AuthorsSection.scss';

type Tab = 'unmoderated' | 'moderated' | 'deleted' | 'all';
const PAGE_SIZE = 10;

const AuthorsSection = () => {
    const { language } = useLanguage();
    const { user } = useAuth();
    const t = authorsTranslations[language];
    const common = adminTranslations[language].common;

    const [tab, setTab] = useState<Tab>('unmoderated');
    const [authors, setAuthors] = useState<AuthorProfileResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

    // модалки
    const [createOpen, setCreateOpen] = useState(false);
    const [viewAuthor, setViewAuthor] = useState<AuthorProfileResponse | null>(null);
    const [moderateTarget, setModerateTarget] = useState<{
        author: AuthorProfileResponse;
        approve: boolean;
    } | null>(null);
    const [moderateComment, setModerateComment] = useState('');
    const [deleteTarget, setDeleteTarget] = useState<AuthorProfileResponse | null>(null);
    const [restoreTarget, setRestoreTarget] = useState<AuthorProfileResponse | null>(null);
    const [busy, setBusy] = useState(false);

    // ---------- load ----------
    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // 'deleted' и 'all' пока через getAllAuthors + клиентский фильтр
            // (у бэка есть только moderated/unmoderated)
            let res: Awaited<ReturnType<typeof getAuthors>> = null;
            if (tab === 'moderated') {
                res = await getModeratedAuthors(page, PAGE_SIZE, language);
            } else if (tab === 'unmoderated') {
                res = await getUnmoderatedAuthors(page, PAGE_SIZE, language);
            } else {
                res = await getAuthors(page, PAGE_SIZE * 2, language);
            }

            if (!res) throw new Error();

            let list = res.data;

            if (tab === 'deleted') {
                list = list.filter((a) => a.authorProfile?.is_deleted);
            } else if (tab === 'all') {
                list = list.filter((a) => !a.authorProfile?.is_deleted);
            }

            setAuthors(list);
            setTotalPages(res.pagination.totalPages);
            setTotal(res.pagination.total);
        } catch (e) {
            console.error('load authors error:', e);
            setError(t.errors.loadFailed);
        } finally {
            setLoading(false);
        }
    }, [tab, page, language, t.errors.loadFailed]);

    useEffect(() => {
        load();
    }, [load]);

    const handleTab = (next: Tab) => {
        if (next === tab) return;
        setTab(next);
        setPage(1);
    };

    // ---------- actions ----------
    const handleModerate = async () => {
        if (!moderateTarget || !user) return;
        setBusy(true);
        try {
            const res = await moderateAuthor(moderateTarget.author.id, {
                moderate: moderateTarget.approve,
                moderator_id: user.id,
                comment: moderateComment.trim() || null,
                errors: {},
            });
            if (!res) throw new Error();
            setModerateTarget(null);
            setModerateComment('');
            await load();
        } catch (e) {
            console.error(e);
            setError(t.errors.moderateFailed);
        } finally {
            setBusy(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setBusy(true);
        try {
            const r = await deleteAuthor(deleteTarget.id);
            if (!r) throw new Error();
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
            const r = await restoreAuthor(restoreTarget.id);
            if (!r) throw new Error();
            setRestoreTarget(null);
            await load();
        } catch (e) {
            console.error(e);
            setError(t.errors.restoreFailed);
        } finally {
            setBusy(false);
        }
    };

    const handleCreate = async (data: CreateAuthorData, avatarFile: File | null) => {
        setBusy(true);
        try {
            const payload: CreateAuthorData = {
                ...data,
                avatar_path: avatarFile,
            };
            const created = await createAuthor(payload);
            if (!created) throw new Error();
            setCreateOpen(false);
            await load();
        } catch (e) {
            console.error(e);
            setError(t.errors.createFailed);
        } finally {
            setBusy(false);
        }
    };

    // ---------- columns ----------
    const columns: Column<AuthorProfileResponse>[] = useMemo(
        () => [
            {
                key: 'avatar',
                title: t.table.avatar,
                width: '64px',
                render: (a) =>
                    a.authorProfile?.avatar_path ? (
                        <img
                            src={a.authorProfile.avatar_path}
                            alt={a.name}
                            className="authors-section__avatar"
                        />
                    ) : (
                        <div className="authors-section__avatar authors-section__avatar--empty">
                            <UserIcon size={18} />
                        </div>
                    ),
            },
            {
                key: 'name',
                title: t.table.name,
                render: (a) =>
                    `${a.name ?? ''} ${a.surname ?? ''}`.trim() || '—',
            },
            { key: 'email', title: t.table.email },
            {
                key: 'profession',
                title: t.table.profession,
                render: (a) =>
                    a.authorProfile?.profession?.name ?? '—',
            },
            {
                key: 'status',
                title: t.table.status,
                render: (a) => {
                    const s = getAuthorStatus(a);
                    return (
                        <span
                            className={`authors-section__status authors-section__status--${s}`}
                        >
                            {t.status[s]}
                        </span>
                    );
                },
            },
            {
                key: 'plan',
                title: t.table.plan,
                render: (a) => a.authorProfile?.plan ?? 'free',
            },
            {
                key: 'works',
                title: t.table.works,
                align: 'right',
                width: '90px',
                render: (a) => a.authorProfile?.artsCount ?? 0,
            },
            {
                key: 'actions',
                title: t.table.actions,
                align: 'right',
                width: '200px',
                render: (a) => {
                    const s = getAuthorStatus(a);
                    return (
                        <div className="authors-section__actions">
                            <button
                                type="button"
                                className="authors-section__action"
                                title={t.actions.view}
                                onClick={() => setViewAuthor(a)}
                            >
                                <Eye size={16} />
                            </button>

                            {s !== 'moderated' && s !== 'deleted' && (
                                <button
                                    type="button"
                                    className="authors-section__action authors-section__action--approve"
                                    title={t.actions.approve}
                                    onClick={() =>
                                        setModerateTarget({ author: a, approve: true })
                                    }
                                >
                                    <Check size={16} />
                                </button>
                            )}

                            {s !== 'rejected' && s !== 'deleted' && (
                                <button
                                    type="button"
                                    className="authors-section__action authors-section__action--reject"
                                    title={t.actions.reject}
                                    onClick={() =>
                                        setModerateTarget({ author: a, approve: false })
                                    }
                                >
                                    <X size={16} />
                                </button>
                            )}

                            {s === 'deleted' ? (
                                <button
                                    type="button"
                                    className="authors-section__action authors-section__action--restore"
                                    title={t.actions.restore}
                                    onClick={() => setRestoreTarget(a)}
                                >
                                    <RotateCcw size={16} />
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    className="authors-section__action authors-section__action--delete"
                                    title={t.actions.delete}
                                    onClick={() => setDeleteTarget(a)}
                                >
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </div>
                    );
                },
            },
        ],
        [t],
    );

    const tabs: { value: Tab; label: string }[] = [
        { value: 'unmoderated', label: t.tabs.unmoderated },
        { value: 'moderated', label: t.tabs.moderated },
        { value: 'deleted', label: t.tabs.deleted },
        { value: 'all', label: t.tabs.all },
    ];

    return (
        <div className="admin-section authors-section">
            <SectionHeader
                title={t.title}
                subtitle={t.subtitle}
                actions={
                    <button
                        type="button"
                        className="authors-section__create-btn"
                        onClick={() => setCreateOpen(true)}
                    >
                        <Plus size={16} />
                        {t.actions.create}
                    </button>
                }
            />

            <div className="authors-section__tabs">
                {tabs.map((x) => (
                    <button
                        key={x.value}
                        type="button"
                        className={`authors-section__tab ${
                            tab === x.value ? 'is-active' : ''
                        }`}
                        onClick={() => handleTab(x.value)}
                    >
                        {x.label}
                    </button>
                ))}
            </div>

            {error && <div className="authors-section__error">{error}</div>}

            {!loading && authors.length === 0 ? (
                <EmptyState text={t.empty} icon={<UserIcon size={24} />} />
            ) : (
                <DataTable
                    columns={columns}
                    rows={authors}
                    loading={loading}
                    emptyText={common.empty}
                    rowKey={(a) => a.id}
                />
            )}

            {!loading && totalPages > 1 && (
                <div className="authors-section__pagination">
                    <button
                        type="button"
                        disabled={page <= 1}
                        onClick={() => setPage((p) => p - 1)}
                    >
                        ←
                    </button>
                    <span>
                        {page} / {totalPages}
                        <span className="authors-section__total"> ({total})</span>
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
            {viewAuthor && (
                <AuthorViewModal
                    author={viewAuthor}
                    onClose={() => setViewAuthor(null)}
                />
            )}

            {/* Create */}
            {createOpen && (
                <AuthorFormModal
                    busy={busy}
                    onClose={() => setCreateOpen(false)}
                    onSubmit={handleCreate}
                />
            )}

            {/* Moderate */}
            {moderateTarget && (
                <div
                    className="authors-section__modal-overlay"
                    onClick={() => !busy && setModerateTarget(null)}
                >
                    <div
                        className="authors-section__modal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3>
                            {moderateTarget.approve
                                ? t.moderateModal.approveTitle
                                : t.moderateModal.rejectTitle}
                        </h3>

                        <label className="authors-section__label">
                            {t.moderateModal.commentLabel}
                            <textarea
                                rows={3}
                                value={moderateComment}
                                onChange={(e) => setModerateComment(e.target.value)}
                                placeholder={t.moderateModal.commentPlaceholder}
                                disabled={busy}
                            />
                        </label>

                        <div className="authors-section__modal-actions">
                            <button
                                type="button"
                                className="authors-section__btn authors-section__btn--secondary"
                                onClick={() => setModerateTarget(null)}
                                disabled={busy}
                            >
                                {common.cancel}
                            </button>
                            <button
                                type="button"
                                className={`authors-section__btn ${
                                    moderateTarget.approve
                                        ? 'authors-section__btn--primary'
                                        : 'authors-section__btn--danger'
                                }`}
                                onClick={handleModerate}
                                disabled={busy}
                            >
                                {moderateTarget.approve
                                    ? t.moderateModal.confirmApprove
                                    : t.moderateModal.confirmReject}
                            </button>
                        </div>
                    </div>
                </div>
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

export default AuthorsSection;