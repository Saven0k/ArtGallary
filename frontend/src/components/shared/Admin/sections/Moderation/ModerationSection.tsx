// src/components/shared/Admin/sections/Moderation/ModerationSection.tsx
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Eye,
    Check,
    X,
    Image as ImageIcon,
    User as UserIcon,
    ShieldCheck,
} from 'lucide-react';
import { useLanguage } from '../../../../../hooks/useLanguage';
import { useAuth } from '../../../../../hooks/useAuth';
import { adminTranslations } from '../../../../../pages/admin/lang';
import {
    getUnmoderatedArts,
    moderateArt,
    type Art,
} from '../../../../../api/arts/main.api';
import {
    getUnmoderatedAuthors,
    moderateAuthor,
    type AuthorProfileResponse,
} from '../../../../../api/authors/main.api';
import SectionHeader from '../../SectionHeader/SectionHeader';
import DataTable, { type Column } from '../../DataTable/DataTable';
import EmptyState from '../../EmptyState/EmptyState';
import ModerationViewModal from './ModerationViewModal';
import { moderationTranslations } from './lang';
import './ModerationSection.scss';

type Tab = 'all' | 'arts' | 'authors';

// Универсальный элемент очереди
type QueueItem =
    | { kind: 'art'; data: Art; date: string }
    | { kind: 'author'; data: AuthorProfileResponse; date: string };

const PAGE_SIZE = 10;

const ModerationSection = () => {
    const { language } = useLanguage();
    const { user } = useAuth();
    const t = moderationTranslations[language];
    const common = adminTranslations[language].common;

    const [tab, setTab] = useState<Tab>('all');
    const [arts, setArts] = useState<Art[]>([]);
    const [authors, setAuthors] = useState<AuthorProfileResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    const [page, setPage] = useState(1);

    // модалки
    const [viewItem, setViewItem] = useState<QueueItem | null>(null);
    const [moderateTarget, setModerateTarget] = useState<{
        item: QueueItem;
        approve: boolean;
    } | null>(null);
    const [moderateComment, setModerateComment] = useState('');

    // ---------- load ----------
    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // грузим оба списка сразу — потом фильтруем по вкладке
            const [artsRes, authorsRes] = await Promise.all([
                getUnmoderatedArts(1, 100, language),
                getUnmoderatedAuthors(1, 100, language),
            ]);

            setArts(artsRes?.arts ?? []);
            setAuthors(authorsRes?.data ?? []);
        } catch (e) {
            console.error('load moderation error:', e);
            setError(t.errors.loadFailed);
        } finally {
            setLoading(false);
        }
    }, [language, t.errors.loadFailed]);

    useEffect(() => {
        load();
    }, [load]);

    useEffect(() => {
        setPage(1);
    }, [tab]);

    // ---------- queue ----------
    const queue: QueueItem[] = useMemo(() => {
        const artItems: QueueItem[] = arts.map((a) => ({
            kind: 'art',
            data: a,
            date: a.date_published ?? '',
        }));

        const authorItems: QueueItem[] = authors.map((a) => ({
            kind: 'author',
            data: a,
            date: a.authorProfile?.createdAt ?? '',
        }));

        if (tab === 'arts') return artItems;
        if (tab === 'authors') return authorItems;

        // всё — объединяем и сортируем по дате (свежие сверху)
        return [...artItems, ...authorItems].sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        );
    }, [arts, authors, tab]);

    const totalPages = Math.max(1, Math.ceil(queue.length / PAGE_SIZE));
    const paginated = useMemo(
        () =>
            queue.slice((page - 1) * PAGE_SIZE, (page - 1) * PAGE_SIZE + PAGE_SIZE),
        [queue, page],
    );

    // ---------- actions ----------
    const handleModerate = async () => {
        if (!moderateTarget || !user) return;
        setBusy(true);
        try {
            const { item, approve } = moderateTarget;

            if (item.kind === 'art') {
                const res = await moderateArt(item.data.id, {
                    moderate: approve,
                    moderator_id: user.id,
                    comment: moderateComment.trim() || null,
                    errors: {},
                });
                if (!res) throw new Error();
            } else {
                const res = await moderateAuthor(item.data.id, {
                    moderate: approve,
                    moderator_id: user.id,
                    comment: moderateComment.trim() || null,
                    errors: {},
                });
                if (!res) throw new Error();
            }

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

    // ---------- columns ----------
    const columns: Column<QueueItem>[] = [
        {
            key: 'type',
            title: t.table.type,
            width: '120px',
            render: (item) => (
                <span
                    className={`moderation-section__type moderation-section__type--${item.kind}`}
                >
                    {item.kind === 'art' ? t.type.art : t.type.author}
                </span>
            ),
        },
        {
            key: 'preview',
            title: t.table.preview,
            width: '72px',
            render: (item) => {
                const src =
                    item.kind === 'art'
                        ? item.data.image_path
                        : item.data.authorProfile?.avatar_path;

                return src ? (
                    <img
                        src={src}
                        alt=""
                        className="moderation-section__thumb"
                    />
                ) : (
                    <div className="moderation-section__thumb moderation-section__thumb--empty">
                        {item.kind === 'art' ? (
                            <ImageIcon size={18} />
                        ) : (
                            <UserIcon size={18} />
                        )}
                    </div>
                );
            },
        },
        {
            key: 'title',
            title: t.table.title,
            render: (item) =>
                item.kind === 'art'
                    ? item.data.title
                    : `${item.data.name ?? ''} ${item.data.surname ?? ''}`.trim(),
        },
        {
            key: 'author',
            title: t.table.author,
            render: (item) => {
                if (item.kind === 'art') {
                    const u = item.data.author?.user;
                    return u
                        ? `${u.name ?? ''} ${u.surname ?? ''}`.trim() || '—'
                        : '—';
                }
                return item.data.authorProfile?.profession?.name ?? '—';
            },
        },
        {
            key: 'date',
            title: t.table.date,
            width: '140px',
            render: (item) =>
                item.date
                    ? new Date(item.date).toLocaleDateString(
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
            width: '180px',
            render: (item) => (
                <div className="moderation-section__actions">
                    <button
                        type="button"
                        className="moderation-section__action"
                        title={t.actions.view}
                        onClick={() => setViewItem(item)}
                    >
                        <Eye size={16} />
                    </button>
                    <button
                        type="button"
                        className="moderation-section__action moderation-section__action--approve"
                        title={t.actions.approve}
                        onClick={() =>
                            setModerateTarget({ item, approve: true })
                        }
                    >
                        <Check size={16} />
                    </button>
                    <button
                        type="button"
                        className="moderation-section__action moderation-section__action--reject"
                        title={t.actions.reject}
                        onClick={() =>
                            setModerateTarget({ item, approve: false })
                        }
                    >
                        <X size={16} />
                    </button>
                </div>
            ),
        },
    ];

    // ---------- tabs ----------
    const tabs: { value: Tab; label: string; count: number }[] = [
        { value: 'all', label: t.tabs.all, count: arts.length + authors.length },
        { value: 'arts', label: t.tabs.arts, count: arts.length },
        { value: 'authors', label: t.tabs.authors, count: authors.length },
    ];

    const emptyText =
        tab === 'arts'
            ? t.empty.arts
            : tab === 'authors'
            ? t.empty.authors
            : t.empty.all;

    return (
        <div className="admin-section moderation-section">
            <SectionHeader title={t.title} subtitle={t.subtitle} />

            {/* Summary */}
            <div className="moderation-section__summary">
                <div className="moderation-section__summary-card">
                    <div className="moderation-section__summary-icon">
                        <ImageIcon size={20} />
                    </div>
                    <div>
                        <span className="moderation-section__summary-label">
                            {t.summary.arts}
                        </span>
                        <span className="moderation-section__summary-value">
                            {arts.length}
                        </span>
                    </div>
                </div>

                <div className="moderation-section__summary-card">
                    <div className="moderation-section__summary-icon">
                        <UserIcon size={20} />
                    </div>
                    <div>
                        <span className="moderation-section__summary-label">
                            {t.summary.authors}
                        </span>
                        <span className="moderation-section__summary-value">
                            {authors.length}
                        </span>
                    </div>
                </div>

                <div className="moderation-section__summary-card">
                    <div className="moderation-section__summary-icon">
                        <ShieldCheck size={20} />
                    </div>
                    <div>
                        <span className="moderation-section__summary-label">
                            {t.summary.total}
                        </span>
                        <span className="moderation-section__summary-value">
                            {arts.length + authors.length}
                        </span>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="moderation-section__tabs">
                {tabs.map((tabItem) => (
                    <button
                        key={tabItem.value}
                        type="button"
                        className={`moderation-section__tab ${
                            tab === tabItem.value ? 'is-active' : ''
                        }`}
                        onClick={() => setTab(tabItem.value)}
                    >
                        {tabItem.label}
                        {tabItem.count > 0 && (
                            <span className="moderation-section__tab-count">
                                {tabItem.count}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {error && <div className="moderation-section__error">{error}</div>}

            {/* Table / Empty */}
            {!loading && queue.length === 0 ? (
                <EmptyState
                    text={emptyText}
                    icon={<ShieldCheck size={24} />}
                />
            ) : (
                <DataTable
                    columns={columns}
                    rows={paginated}
                    loading={loading}
                    emptyText={common.empty}
                    rowKey={(item) =>
                        `${item.kind}-${
                            item.kind === 'art'
                                ? item.data.id
                                : item.data.id
                        }`
                    }
                />
            )}

            {/* Pagination */}
            {!loading && totalPages > 1 && (
                <div className="moderation-section__pagination">
                    <button
                        type="button"
                        disabled={page <= 1}
                        onClick={() => setPage((p) => p - 1)}
                    >
                        ←
                    </button>
                    <span>
                        {page} / {totalPages}
                        <span className="moderation-section__total">
                            {' '}
                            ({queue.length})
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

            {/* View modal */}
            {viewItem && (
                <ModerationViewModal
                    item={viewItem}
                    onClose={() => setViewItem(null)}
                />
            )}

            {/* Moderate modal */}
            {moderateTarget && (
                <div
                    className="moderation-section__modal-overlay"
                    onClick={() => !busy && setModerateTarget(null)}
                >
                    <div
                        className="moderation-section__modal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3>
                            {moderateTarget.approve
                                ? t.moderateModal.approveTitle
                                : t.moderateModal.rejectTitle}
                        </h3>

                        <label className="moderation-section__label">
                            {t.moderateModal.commentLabel}
                            <textarea
                                rows={3}
                                value={moderateComment}
                                onChange={(e) =>
                                    setModerateComment(e.target.value)
                                }
                                placeholder={t.moderateModal.commentPlaceholder}
                                disabled={busy}
                            />
                        </label>

                        <div className="moderation-section__modal-actions">
                            <button
                                type="button"
                                className="moderation-section__btn moderation-section__btn--secondary"
                                onClick={() => setModerateTarget(null)}
                                disabled={busy}
                            >
                                {common.cancel}
                            </button>
                            <button
                                type="button"
                                className={`moderation-section__btn ${
                                    moderateTarget.approve
                                        ? 'moderation-section__btn--primary'
                                        : 'moderation-section__btn--danger'
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
        </div>
    );
};

export default ModerationSection;