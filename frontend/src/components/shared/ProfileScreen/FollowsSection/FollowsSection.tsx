import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getUserFollowing, unfollowAuthor, type Following, type PaginatedResponse } from '../../../../api/authors/main.api';
import { followsTranslations } from './lang';
import { useLanguage } from '../../../../hooks/useLanguage';
import '../ProfileCommerce.scss';
import './FollowsSection.scss';

const PAGE_LIMIT = 20;

const Follows = () => {
    const { language } = useLanguage();
    const t = followsTranslations[language].follows;
    const [items, setItems] = useState<Following[]>([]);
    const [pagination, setPagination] = useState<PaginatedResponse<Following>['pagination'] | null>(null);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [actionError, setActionError] = useState(false);
    const [pending, setPending] = useState<number | null>(null);
    const [attempt, setAttempt] = useState(0);
    const [brokenAvatars, setBrokenAvatars] = useState<number[]>([]);

    useEffect(() => {
        const controller = new AbortController();
        setLoading(true);
        setError(false);
        setActionError(false);
        void getUserFollowing(page, PAGE_LIMIT, controller.signal).then((result) => {
            if (controller.signal.aborted) return;
            setItems(result?.data ?? []);
            setPagination(result?.pagination ?? null);
            setBrokenAvatars([]);
            setError(!result);
            setLoading(false);
        });
        return () => controller.abort();
    }, [page, language, attempt]);

    const handleUnfollow = async (id: number) => {
        if (pending !== null) return;
        setPending(id);
        setActionError(false);
        const result = await unfollowAuthor(id);
        if (result?.success && !result.is_following) {
            const lastPage = Math.max(1, Math.ceil(((pagination?.total ?? items.length) - 1) / PAGE_LIMIT));
            setPage((value) => Math.min(value, lastPage));
            setAttempt((value) => value + 1);
        } else setActionError(true);
        setPending(null);
    };

    return (
        <section className="profile-commerce follows" aria-labelledby="follows-title" aria-busy={loading}>
            <h2 className="profile-commerce__title" id="follows-title">
                {t.title}
            </h2>
            {actionError && (
                <p className="profile-commerce__error" role="alert">
                    {t.unfollowError}
                </p>
            )}
            {loading ? (
                <p className="profile-commerce__state" role="status">
                    {t.loading}
                </p>
            ) : error ? (
                <div className="profile-commerce__state" role="alert">
                    <p>{t.error}</p>
                    <button type="button" className="profile-commerce__retry" onClick={() => setAttempt((value) => value + 1)}>
                        {t.retry}
                    </button>
                </div>
            ) : !items.length ? (
                <p className="profile-commerce__state">{t.empty}</p>
            ) : (
                <>
                    <ul className="follows__list">
                        {items.map((item) => {
                            const name = [item.author_name, item.author_surname].filter(Boolean).join(' ') || t.unknownAuthor;
                            return (
                                <li className="follows__item" key={item.author_id}>
                                    <Link
                                        to={`/authors/${item.author_id}`}
                                        className="follows__avatar"
                                        aria-label={`${t.goToProfile}: ${name}`}
                                    >
                                        {item.avatar_path && !brokenAvatars.includes(item.author_id) ? (
                                            <img
                                                src={item.avatar_path}
                                                alt=""
                                                loading="lazy"
                                                onError={() => setBrokenAvatars((ids) => [...ids, item.author_id])}
                                            />
                                        ) : (
                                            <span aria-hidden="true">
                                                {[item.author_name, item.author_surname]
                                                    .filter(Boolean)
                                                    .map((part) => part[0])
                                                    .join('')
                                                    .slice(0, 2) || '?'}
                                            </span>
                                        )}
                                    </Link>
                                    <div className="follows__info">
                                        <h3 className="follows__name">{name}</h3>
                                        <p className="follows__subtitle">
                                            {item.profession?.name || item.description || t.defaultSubtitle}
                                        </p>
                                    </div>
                                    <div className="follows__actions">
                                        <Link to={`/authors/${item.author_id}`} className="follows__btn">
                                            {t.goToProfile}
                                        </Link>
                                        <button
                                            type="button"
                                            className="follows__unfollow"
                                            disabled={pending !== null}
                                            onClick={() => handleUnfollow(item.author_id)}
                                        >
                                            {pending === item.author_id ? t.unfollowing : t.unfollow}
                                        </button>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                    {pagination && pagination.totalPages > 1 && (
                        <nav className="follows__pagination" aria-label={t.pagination.label}>
                            <button
                                type="button"
                                className="follows__page-btn"
                                disabled={!pagination.hasPreviousPage || pending !== null}
                                onClick={() => setPage((value) => Math.max(1, value - 1))}
                            >
                                {t.pagination.prev}
                            </button>
                            <span>
                                {t.pagination.pageOf
                                    .replace('{page}', String(pagination.page))
                                    .replace('{total}', String(pagination.totalPages))}
                            </span>
                            <button
                                type="button"
                                className="follows__page-btn"
                                disabled={!pagination.hasNextPage || pending !== null}
                                onClick={() => setPage((value) => value + 1)}
                            >
                                {t.pagination.next}
                            </button>
                        </nav>
                    )}
                </>
            )}
        </section>
    );
};

export default Follows;
