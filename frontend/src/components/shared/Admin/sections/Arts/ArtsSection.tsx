// src/components/shared/Admin/sections/Arts/ArtsSection.tsx
import { useCallback, useEffect, useState } from 'react';
import { Eye, Check, X, Trash2, Image as ImageIcon } from 'lucide-react';
import { useLanguage } from '../../../../../hooks/useLanguage';
import { useAuth } from '../../../../../hooks/useAuth';
import { adminTranslations } from '../../../../../pages/admin/lang';
import {
    getAllArts,
    getModeratedArts,
    getUnmoderatedArts,
    deleteArt,
    moderateArt,
    type Art,
} from '../../../../../api/arts/main.api';
import SectionHeader from '../../SectionHeader/SectionHeader';
import DataTable, { type Column } from '../../DataTable/DataTable';
import ConfirmModal from '../../ConfirmModal/ConfirmModal';
import EmptyState from '../../EmptyState/EmptyState';
import { artsTranslations } from './lang';
import { getModerationStatus, type ModerationStatus } from './utils';
import './ArtsSection.scss';

type Tab = 'all' | 'moderated' | 'unmoderated';

const PAGE_SIZE = 10;

const ArtsSection = () => {
    const { language } = useLanguage();
    const { user } = useAuth();
    const t = artsTranslations[language];
    const common = adminTranslations[language].common;

    const [tab, setTab] = useState<Tab>('unmoderated');
    const [arts, setArts] = useState<Art[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

    // модалки
    const [viewArt, setViewArt] = useState<Art | null>(null);
    const [moderateTarget, setModerateTarget] = useState<{
        art: Art;
        approve: boolean;
    } | null>(null);
    const [moderateComment, setModerateComment] = useState('');
    const [deleteTarget, setDeleteTarget] = useState<Art | null>(null);
    const [busy, setBusy] = useState(false);

    // загрузка
    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const fetcher =
                tab === 'moderated'
                    ? getModeratedArts
                    : tab === 'unmoderated'
                    ? getUnmoderatedArts
                    : getAllArts;

            const res = await fetcher(page, PAGE_SIZE, language);
            if (!res) throw new Error();

            setArts(res.arts);
            setTotalPages(res.pagination.totalPages);
            setTotal(res.pagination.total);
        } catch (e) {
            console.error('load arts error:', e);
            setError(t.errors.loadFailed);
        } finally {
            setLoading(false);
        }
    }, [tab, page, language, t.errors.loadFailed]);

    useEffect(() => {
        load();
    }, [load]);

    // смена таба — сброс страницы
    const handleTab = (next: Tab) => {
        if (next === tab) return;
        setTab(next);
        setPage(1);
    };

    // ---------- moderate ----------
    const handleModerate = async () => {
        if (!moderateTarget || !user) return;
        setBusy(true);
        try {
            const res = await moderateArt(moderateTarget.art.id, {
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
            console.error('moderate error:', e);
            setError(t.errors.moderateFailed);
        } finally {
            setBusy(false);
        }
    };

    // ---------- delete ----------
    const handleDelete = async () => {
        if (!deleteTarget) return;
        setBusy(true);
        try {
            const ok = await deleteArt(deleteTarget.id);
            if (!ok) throw new Error();
            setDeleteTarget(null);
            await load();
        } catch (e) {
            console.error('delete error:', e);
            setError(t.errors.deleteFailed);
        } finally {
            setBusy(false);
        }
    };

    // ---------- columns ----------
    const statusLabel = (s: ModerationStatus) => t.status[s];

    const columns: Column<Art>[] = [
        {
            key: 'image',
            title: t.table.image,
            width: '72px',
            render: (a) =>
                a.image_path ? (
                    <img
                        src={a.image_path}
                        alt={a.title}
                        className="arts-section__thumb"
                    />
                ) : (
                    <div className="arts-section__thumb arts-section__thumb--empty">
                        <ImageIcon size={18} />
                    </div>
                ),
        },
        {
            key: 'title',
            title: t.table.title,
            render: (a) => (
                <div className="arts-section__title-cell">
                    <span className="arts-section__title-text">{a.title}</span>
                    {a.is_adult && <span className="arts-section__adult">18+</span>}
                </div>
            ),
        },
        {
            key: 'author',
            title: t.table.author,
            render: (a) =>
                a.author?.user
                    ? `${a.author.user.name ?? ''} ${a.author.user.surname ?? ''}`.trim()
                    : '—',
        },
        {
            key: 'status',
            title: t.table.status,
            render: (a) => {
                const status = getModerationStatus(a);
                return (
                    <span
                        className={`arts-section__status arts-section__status--${status}`}
                    >
                        {statusLabel(status)}
                    </span>
                );
            },
        },
        {
            key: 'views',
            title: t.table.views,
            align: 'right',
            width: '90px',
            render: (a) => a.views ?? 0,
        },
        {
            key: 'likes',
            title: t.table.likes,
            align: 'right',
            width: '90px',
            render: (a) => a.likes ?? 0,
        },
        {
            key: 'date',
            title: t.table.date,
            width: '120px',
            render: (a) =>
                a.date_published
                    ? new Date(a.date_published).toLocaleDateString(
                          language === 'ru' ? 'ru-RU' : language === 'zh' ? 'zh-CN' : 'en-US',
                      )
                    : '—',
        },
        {
            key: 'actions',
            title: t.table.actions,
            align: 'right',
            width: '180px',
            render: (a) => {
                const status = getModerationStatus(a);
                return (
                    <div className="arts-section__actions">
                        <button
                            type="button"
                            className="arts-section__action"
                            title={t.actions.view}
                            onClick={() => setViewArt(a)}
                        >
                            <Eye size={16} />
                        </button>

                        {status !== 'moderated' && (
                            <button
                                type="button"
                                className="arts-section__action arts-section__action--approve"
                                title={t.actions.approve}
                                onClick={() =>
                                    setModerateTarget({ art: a, approve: true })
                                }
                            >
                                <Check size={16} />
                            </button>
                        )}

                        {status !== 'rejected' && (
                            <button
                                type="button"
                                className="arts-section__action arts-section__action--reject"
                                title={t.actions.reject}
                                onClick={() =>
                                    setModerateTarget({ art: a, approve: false })
                                }
                            >
                                <X size={16} />
                            </button>
                        )}

                        <button
                            type="button"
                            className="arts-section__action arts-section__action--delete"
                            title={t.actions.delete}
                            onClick={() => setDeleteTarget(a)}
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                );
            },
        },
    ];

    // ---------- tabs ----------
    const tabs: { value: Tab; label: string }[] = [
        { value: 'unmoderated', label: t.tabs.unmoderated },
        { value: 'moderated', label: t.tabs.moderated },
        { value: 'all', label: t.tabs.all },
    ];

    return (
        <div className="admin-section arts-section">
            <SectionHeader title={t.title} subtitle={t.subtitle} />

            {/* Tabs */}
            <div className="arts-section__tabs">
                {tabs.map((tabItem) => (
                    <button
                        key={tabItem.value}
                        type="button"
                        className={`arts-section__tab ${
                            tab === tabItem.value ? 'is-active' : ''
                        }`}
                        onClick={() => handleTab(tabItem.value)}
                    >
                        {tabItem.label}
                    </button>
                ))}
            </div>

            {error && <div className="arts-section__error">{error}</div>}

            {/* Table / Empty */}
            {!loading && arts.length === 0 ? (
                <EmptyState text={t.empty} icon={<ImageIcon size={24} />} />
            ) : (
                <DataTable
                    columns={columns}
                    rows={arts}
                    loading={loading}
                    emptyText={common.empty}
                    rowKey={(a) => a.id}
                />
            )}

            {/* Pagination */}
            {!loading && totalPages > 1 && (
                <div className="arts-section__pagination">
                    <button
                        type="button"
                        disabled={page <= 1}
                        onClick={() => setPage((p) => p - 1)}
                    >
                        ←
                    </button>
                    <span>
                        {page} / {totalPages}
                        <span className="arts-section__total"> ({total})</span>
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
            {viewArt && (
                <div
                    className="arts-section__modal-overlay"
                    onClick={() => setViewArt(null)}
                >
                    <div
                        className="arts-section__modal arts-section__modal--view"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <header className="arts-section__modal-header">
                            <h3>{viewArt.title}</h3>
                            <button
                                type="button"
                                onClick={() => setViewArt(null)}
                            >
                                <X size={20} />
                            </button>
                        </header>

                        <div className="arts-section__view-body">
                            {viewArt.image_path && (
                                <img
                                    src={viewArt.image_path}
                                    alt={viewArt.title}
                                    className="arts-section__view-image"
                                />
                            )}

                            <dl className="arts-section__view-list">
                                <div>
                                    <dt>{t.viewModal.author}</dt>
                                    <dd>
                                        {viewArt.author?.user
                                            ? `${viewArt.author.user.name ?? ''} ${viewArt.author.user.surname ?? ''}`.trim()
                                            : '—'}
                                    </dd>
                                </div>
                                <div>
                                    <dt>{t.viewModal.cost}</dt>
                                    <dd>
                                        {viewArt.cost != null
                                            ? `${viewArt.cost} ${viewArt.currency ?? ''}`.trim()
                                            : t.viewModal.notSpecified}
                                    </dd>
                                </div>
                                <div>
                                    <dt>{t.viewModal.genre}</dt>
                                    <dd>
                                        {viewArt.genre?.title ??
                                            t.viewModal.notSpecified}
                                    </dd>
                                </div>
                                <div>
                                    <dt>{t.viewModal.style}</dt>
                                    <dd>
                                        {viewArt.style?.name ??
                                            t.viewModal.notSpecified}
                                    </dd>
                                </div>
                                <div>
                                    <dt>{t.viewModal.country}</dt>
                                    <dd>
                                        {viewArt.country?.name_ru ??
                                            viewArt.country?.name_en ??
                                            t.viewModal.notSpecified}
                                    </dd>
                                </div>
                                <div>
                                    <dt>{t.viewModal.city}</dt>
                                    <dd>
                                        {viewArt.city?.name_ru ??
                                            viewArt.city?.name_en ??
                                            t.viewModal.notSpecified}
                                    </dd>
                                </div>
                                <div>
                                    <dt>{t.viewModal.published}</dt>
                                    <dd>
                                        {viewArt.date_published
                                            ? new Date(
                                                  viewArt.date_published,
                                              ).toLocaleDateString()
                                            : t.viewModal.notSpecified}
                                    </dd>
                                </div>
                                {viewArt.tags && viewArt.tags.length > 0 && (
                                    <div>
                                        <dt>{t.viewModal.tags}</dt>
                                        <dd>
                                            {viewArt.tags
                                                .map((tag) => tag.name)
                                                .join(', ')}
                                        </dd>
                                    </div>
                                )}
                            </dl>

                            {viewArt.description && (
                                <div className="arts-section__view-desc">
                                    <h4>{t.viewModal.description}</h4>
                                    <p>{viewArt.description}</p>
                                </div>
                            )}
                        </div>

                        <div className="arts-section__modal-actions">
                            <button
                                type="button"
                                className="arts-section__btn arts-section__btn--secondary"
                                onClick={() => setViewArt(null)}
                            >
                                {t.viewModal.close}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Moderate modal */}
            {moderateTarget && (
                <div
                    className="arts-section__modal-overlay"
                    onClick={() => !busy && setModerateTarget(null)}
                >
                    <div
                        className="arts-section__modal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3>
                            {moderateTarget.approve
                                ? t.moderateModal.approveTitle
                                : t.moderateModal.rejectTitle}
                        </h3>

                        <label className="arts-section__label">
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

                        <div className="arts-section__modal-actions">
                            <button
                                type="button"
                                className="arts-section__btn arts-section__btn--secondary"
                                onClick={() => setModerateTarget(null)}
                                disabled={busy}
                            >
                                {common.cancel}
                            </button>
                            <button
                                type="button"
                                className={`arts-section__btn ${
                                    moderateTarget.approve
                                        ? 'arts-section__btn--primary'
                                        : 'arts-section__btn--danger'
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

            {/* Delete confirm */}
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

export default ArtsSection;