// src/components/shared/ProfileScreen/Sections/Notifications/Notifications.tsx
import { useEffect, useState, type JSX } from 'react';
import { Heart, UserPlus, BadgeCheck, Palette, Bell, Trash2 } from 'lucide-react';
import {
    getNotifications,
    markAllNotificationsAsRead,
    markNotificationAsRead,
    deleteNotification,
    deleteAllNotifications,
    type NotificationItem,
    type NotificationType,
} from '../../../../../api/notification/main.api';
import { useLanguage } from '../../../../../hooks/useLanguage';
import { useNavigate } from 'react-router-dom';
import { notificationsTranslations } from './lang';
import NotificationCard from '../../NotificationCard/NotificationCard';
import './Notifications.scss';

interface NotificationsProps {
    id: number;
    role: string;
}

const ICONS: Record<NotificationType, JSX.Element> = {
    art_like: <Heart size={22} />,
    author_like: <BadgeCheck size={22} />,
    new_follower: <UserPlus size={22} />,
    new_art: <Palette size={22} />,
};

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

const Notifications = ({ id, role }: NotificationsProps) => {
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

    // Загрузка первой страницы
    useEffect(() => {
        let alive = true;
        (async () => {
            setLoading(true);
            const res = await getNotifications(1, 20);
            if (!alive) return;
            if (res) {
                setItems(res.data);
                setUnreadCount(res.unread_count);
                setPage(1);
                setHasNextPage(res.pagination.hasNextPage);
            }
            setLoading(false);
        })();
        return () => {
            alive = false;
        };
    }, []);

    const handleLoadMore = async () => {
        if (loadingMore || !hasNextPage) return;
        setLoadingMore(true);
        const next = page + 1;
        const res = await getNotifications(next, 20);
        if (res) {
            setItems((prev) => [...prev, ...res.data]);
            setUnreadCount(res.unread_count);
            setPage(next);
            setHasNextPage(res.pagination.hasNextPage);
        }
        setLoadingMore(false);
    };

    const handleCardClick = async (n: NotificationItem) => {
        if (n.status === 'unread') {
            const r = await markNotificationAsRead(n.id);
            if (r) {
                setItems((prev) =>
                    prev.map((it) =>
                        it.id === n.id ? { ...it, status: 'read' } : it,
                    ),
                );
                setUnreadCount((c) => Math.max(0, c - 1));
            }
        }
        if (n.link) navigate(n.link);
    };

    const handleDeleteOne = async (n: NotificationItem) => {
        const r = await deleteNotification(n.id);
        if (r) {
            setItems((prev) => prev.filter((it) => it.id !== n.id));
            if (n.status === 'unread') {
                setUnreadCount((c) => Math.max(0, c - 1));
            }
        }
    };

    const handleMarkAllRead = async () => {
        const r = await markAllNotificationsAsRead();
        if (r) {
            setItems((prev) => prev.map((it) => ({ ...it, status: 'read' })));
            setUnreadCount(0);
        }
    };

    const handleDeleteAll = async () => {
        const r = await deleteAllNotifications();
        if (r) {
            setItems([]);
            setUnreadCount(0);
            setHasNextPage(false);
        }
        setConfirmDeleteAll(false);
    };

    if (loading) {
        return (
            <section className="notifications">
                <div className="notifications__loading">{t.loading}</div>
            </section>
        );
    }

    return (
        <section className="notifications">
            <header className="notifications__header">
                <div className="notifications__header-row">
                    <h2 className="notifications__title">
                        {t.title}
                        {unreadCount > 0 && (
                            <span className="notifications__badge">{unreadCount}</span>
                        )}
                    </h2>

                    <div className="notifications__actions">
                        {unreadCount > 0 && (
                            <button
                                type="button"
                                className="notifications__mark-all"
                                onClick={handleMarkAllRead}
                            >
                                {t.markAllRead}
                            </button>
                        )}

                        {items.length > 0 && (
                            <button
                                type="button"
                                className="notifications__delete-all"
                                onClick={() => setConfirmDeleteAll(true)}
                            >
                                {t.deleteAll}
                                <Trash2 size={14} />
                            </button>
                        )}
                    </div>
                </div>
            </header>

            {items.length === 0 ? (
                <div className="notifications__empty">
                    <Bell size={32} />
                    <p>{t.empty}</p>
                </div>
            ) : (
                <div className="notifications__list">
                    {items.map((n) => (
                        <NotificationCard
                            key={n.id}
                            icon={ICONS[n.type] ?? <Bell size={22} />}
                            title={
                                t.types[
                                    n.type === 'art_like'
                                        ? 'artLike'
                                        : n.type === 'author_like'
                                        ? 'authorLike'
                                        : n.type === 'new_follower'
                                        ? 'newFollower'
                                        : 'newArt'
                                ]
                            }
                            description={n.message}
                            time={formatTime(n.created_at, language)}
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
                            disabled={loadingMore}
                        >
                            {loadingMore ? t.loading : t.loadMore}
                        </button>
                    )}
                </div>
            )}

            {confirmDeleteAll && (
                <div
                    className="notifications__confirm-overlay"
                    onClick={() => setConfirmDeleteAll(false)}
                >
                    <div
                        className="notifications__confirm"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <p>{t.deleteAllConfirm}</p>
                        <div className="notifications__confirm-actions">
                            <button
                                type="button"
                                className="notifications__confirm-btn notifications__confirm-btn--secondary"
                                onClick={() => setConfirmDeleteAll(false)}
                            >
                                {t.cancel}
                            </button>
                            <button
                                type="button"
                                className="notifications__confirm-btn notifications__confirm-btn--danger"
                                onClick={handleDeleteAll}
                            >
                                {t.yesDeleteAll}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
};

export default Notifications;