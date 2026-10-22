import { useEffect, useRef, useState, type JSX } from 'react';
import { Heart, UserRound, BadgeCheck, Palette, Bell } from 'lucide-react';
import {
    getNotifications,
    markAllNotificationsAsRead,
    markNotificationAsRead,
    deleteNotification,
    deleteAllNotifications,
    type NotificationItem,
    type NotificationType,
} from '../../../../api/notification/main.api';
import { useLanguage } from '../../../../hooks/useLanguage';
import { useNavigate } from 'react-router-dom';
import { notificationsTranslations } from './lang';
import NotificationCard from './NotificationCard/NotificationCard';
import './NotificationSection.scss';

const ICONS: Record<NotificationType, JSX.Element> = {
    art_like: <Heart size={40} fill="currentColor" strokeWidth={0} />,
    author_like: <BadgeCheck size={40} strokeWidth={1.5} />,
    new_follower: <UserRound size={40} strokeWidth={1.5} />,
    new_art: <Palette size={40} strokeWidth={1.5} />,
};

const TYPE_LABELS = {
    art_like: 'artLike',
    author_like: 'authorLike',
    new_follower: 'newFollower',
    new_art: 'newArt',
} as const;

const formatTime = (iso: string, lang: string) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const locale = lang === 'ru' ? 'ru-RU' : lang === 'zh' ? 'zh-CN' : 'en-US';
    return d.toLocaleString(locale, {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    });
};

const Notifications = () => {
    const { language } = useLanguage();
    const t = notificationsTranslations[language];
    const navigate = useNavigate();

    const [items, setItems] = useState<NotificationItem[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [page, setPage] = useState(1);
    const [hasNextPage, setHasNextPage] = useState(false);
    const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
    const [loadError, setLoadError] = useState(false);
    const [actionError, setActionError] = useState(false);
    const [pending, setPending] = useState(false);
    const [attempt, setAttempt] = useState(0);
    const version = useRef(0);
    const confirmRef = useRef<HTMLDialogElement>(null);

    useEffect(() => {
        let alive = true;
        version.current++;
        (async () => {
            setLoading(true);
            setLoadingMore(false);
            setLoadError(false);
            setActionError(false);
            const res = await getNotifications(1, 20);
            if (!alive) return;
            if (res) {
                setItems(res.data);
                setUnreadCount(res.unread_count);
                setPage(1);
                setHasNextPage(res.pagination.hasNextPage);
            } else {
                setLoadError(true);
            }
            setLoading(false);
        })();
        return () => {
            alive = false;
        };
    }, [language, attempt]);

    useEffect(() => {
        if (confirmDeleteAll) confirmRef.current?.showModal();
    }, [confirmDeleteAll]);

    const runAction = async (
        action: () => Promise<{ success: boolean } | null>,
        success: () => void,
    ) => {
        if (pending) return;
        setPending(true);
        setActionError(false);
        const result = await action();
        if (result?.success) {
            success();
            if (typeof window !== 'undefined')
                window.dispatchEvent(
                    new Event('gallery:notifications-updated'),
                );
        } else setActionError(true);
        setPending(false);
    };

    const handleLoadMore = async () => {
        if (loadingMore || pending || !hasNextPage) return;
        const requestVersion = version.current;
        setActionError(false);
        setLoadingMore(true);
        const next = page + 1;
        const res = await getNotifications(next, 20);
        if (requestVersion !== version.current) return;
        if (res) {
            setItems((prev) => [
                ...prev,
                ...res.data.filter(
                    (item) => !prev.some((existing) => existing.id === item.id),
                ),
            ]);
            setUnreadCount(res.unread_count);
            setPage(next);
            setHasNextPage(res.pagination.hasNextPage);
        } else setActionError(true);
        setLoadingMore(false);
    };

    const handleCardClick = async (n: NotificationItem) => {
        if (pending || loadingMore) return;
        if (n.status === 'unread') {
            await runAction(
                () => markNotificationAsRead(n.id),
                () => {
                    setItems((prev) =>
                        prev.map((it) =>
                            it.id === n.id ? { ...it, status: 'read' } : it,
                        ),
                    );
                    setUnreadCount((c) => Math.max(0, c - 1));
                },
            );
        }
        if (n.link) navigate(n.link);
    };

    const handleDeleteOne = async (n: NotificationItem) => {
        await runAction(
            () => deleteNotification(n.id),
            () => {
                setItems((prev) => prev.filter((it) => it.id !== n.id));
                if (n.status === 'unread') {
                    setUnreadCount((c) => Math.max(0, c - 1));
                }
            },
        );
    };

    const handleMarkAllRead = async () => {
        await runAction(markAllNotificationsAsRead, () => {
            setItems((prev) => prev.map((it) => ({ ...it, status: 'read' })));
            setUnreadCount(0);
        });
    };

    const handleDeleteAll = async () => {
        await runAction(deleteAllNotifications, () => {
            setItems([]);
            setUnreadCount(0);
            setHasNextPage(false);
            setPage(1);
            setConfirmDeleteAll(false);
        });
    };

    return (
        <section
            className="notifications"
            aria-labelledby="notifications-title"
            aria-busy={loading}
        >
            <header className="notifications__header">
                <div className="notifications__header-row">
                    <h2
                        className="notifications__title"
                        id="notifications-title"
                    >
                        {t.title}
                        {!loading && !loadError && unreadCount > 0 && (
                            <span className="notifications__badge">
                                {unreadCount}
                            </span>
                        )}
                    </h2>

                    <div className="notifications__actions">
                        {!loading && !loadError && unreadCount > 0 && (
                            <button
                                type="button"
                                className="notifications__mark-all"
                                onClick={handleMarkAllRead}
                                disabled={pending || loadingMore}
                            >
                                {t.markAllRead}
                            </button>
                        )}

                        {!loading && !loadError && items.length > 0 && (
                            <button
                                type="button"
                                className="notifications__delete-all"
                                onClick={() => {
                                    setActionError(false);
                                    setConfirmDeleteAll(true);
                                }}
                                disabled={pending || loadingMore}
                            >
                                {t.deleteAll}
                            </button>
                        )}
                    </div>
                </div>
            </header>

            {actionError && !confirmDeleteAll && (
                <p className="notifications__error" role="alert">
                    {t.actionError}
                </p>
            )}
            {loading ? (
                <div className="notifications__loading" role="status">
                    {t.loading}
                </div>
            ) : loadError ? (
                <div className="notifications__empty" role="alert">
                    <p>{t.error}</p>
                    <button
                        type="button"
                        className="notifications__more"
                        onClick={() => setAttempt((value) => value + 1)}
                    >
                        {t.retry}
                    </button>
                </div>
            ) : items.length === 0 ? (
                <div className="notifications__empty">
                    <Bell size={32} />
                    <p>{t.empty}</p>
                </div>
            ) : (
                <div className="notifications__list">
                    {items.map((n) => (
                        <NotificationCard
                            key={n.id}
                            icon={
                                ICONS[n.type] ?? (
                                    <Bell size={40} strokeWidth={1.5} />
                                )
                            }
                            title={
                                TYPE_LABELS[n.type]
                                    ? t.types[TYPE_LABELS[n.type]]
                                    : t.fallbackUnknown
                            }
                            description={n.message}
                            time={formatTime(n.created_at, language)}
                            dateTime={n.created_at}
                            disabled={pending || loadingMore}
                            unread={n.status === 'unread'}
                            onClick={() => handleCardClick(n)}
                            onDelete={() => handleDeleteOne(n)}
                        />
                    ))}

                    {hasNextPage && (
                        <button
                            type="button"
                            className="notifications__more"
                            onClick={handleLoadMore}
                            disabled={loadingMore || pending}
                        >
                            {loadingMore ? t.loading : t.loadMore}
                        </button>
                    )}
                </div>
            )}

            {confirmDeleteAll && (
                <dialog
                    ref={confirmRef}
                    className="notifications__confirm"
                    aria-labelledby="notifications-confirm-title"
                    onCancel={(event) => {
                        if (pending) event.preventDefault();
                        else setConfirmDeleteAll(false);
                    }}
                >
                    <h3 id="notifications-confirm-title">{t.deleteAll}</h3>
                    <p>{t.deleteAllConfirm}</p>
                    {actionError && (
                        <p className="notifications__error" role="alert">
                            {t.actionError}
                        </p>
                    )}
                    <div className="notifications__confirm-actions">
                        <button
                            type="button"
                            className="notifications__confirm-btn notifications__confirm-btn--secondary"
                            onClick={() => setConfirmDeleteAll(false)}
                            disabled={pending}
                        >
                            {t.cancel}
                        </button>
                        <button
                            type="button"
                            className="notifications__confirm-btn notifications__confirm-btn--danger"
                            onClick={handleDeleteAll}
                            disabled={pending}
                        >
                            {t.yesDeleteAll}
                        </button>
                    </div>
                </dialog>
            )}
        </section>
    );
};

export default Notifications;
