// src/components/Follows/Follows.tsx
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    getUserFollowing,
    type Following,
    type PaginatedResponse,
} from '../../../../../api/authors/main.api';
import { useLanguage } from '../../../../../hooks/useLanguage';
import { followsTranslations } from './lang';
import './Follows.css';

const PAGE_LIMIT = 20;

const Follows = () => {
    const navigate = useNavigate();
    const { language } = useLanguage();
    const t = followsTranslations[language].follows;

    const [items, setItems] = useState<Following[]>([]);
    const [pagination, setPagination] = useState<PaginatedResponse<Following>['pagination'] | null>(null);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchFollowing = useCallback(async (pageNum: number) => {
        setLoading(true);
        setError(null);
        const data = await getUserFollowing(pageNum, PAGE_LIMIT);
        if (!data) {
            setError(t.error);
            setLoading(false);
            return;
        }
        setItems(data.data);
        setPagination(data.pagination);
        setLoading(false);
    }, [t.error]);

    useEffect(() => {
        fetchFollowing(page);
    }, [page, fetchFollowing]);

    const handleGoToProfile = (authorId: number) => {
        navigate(`/authors/${authorId}`);
    };

    if (loading) {
        return (
            <section className="follows">
                <h1 className="follows__title">{t.title}</h1>
                <ul className="follows__list">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <li className="follows__item follows__item--skeleton" key={i}>
                            <div className="follows__avatar-skeleton" />
                            <div className="follows__info">
                                <div className="follows__line follows__line--lg" />
                                <div className="follows__line follows__line--sm" />
                            </div>
                            <div className="follows__btn-skeleton" />
                        </li>
                    ))}
                </ul>
            </section>
        );
    }

    if (error) {
        return (
            <section className="follows">
                <h1 className="follows__title">{t.title}</h1>
                <p className="follows__empty">{error}</p>
            </section>
        );
    }

    if (!items.length) {
        return (
            <section className="follows">
                <h1 className="follows__title">{t.title}</h1>
                <p className="follows__empty">{t.empty}</p>
            </section>
        );
    }

    return (
        <section className="follows">
            <h1 className="follows__title">{t.title}</h1>

            <ul className="follows__list">
                {items.map((item) => {
                    const fullName = `${item.author_name} ${item.author_surname}`.trim();
                    const avatarSrc = item.avatar_path || t.defaultAvatar;
                    const subtitle = item.description || t.defaultSubtitle;

                    return (
                        <li className="follows__item" key={item.author_id}>
                            <img
                                src={avatarSrc}
                                alt={fullName}
                                className="follows__avatar"
                                loading="lazy"
                            />

                            <div className="follows__info">
                                <h3 className="follows__name">{fullName}</h3>
                                <p className="follows__subtitle">
                                    <span className="follows__leaf" aria-hidden="true">🌿</span>
                                    {subtitle}
                                </p>
                            </div>

                            <button
                                type="button"
                                className="follows__btn"
                                onClick={() => handleGoToProfile(item.author_id)}
                            >
                                {t.goToProfile}
                            </button>
                        </li>
                    );
                })}
            </ul>

            {pagination && pagination.totalPages > 1 && (
                <div className="follows__pagination">
                    <button
                        className="follows__page-btn"
                        disabled={!pagination.hasPreviousPage}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                        {t.pagination.prev}
                    </button>
                    <span className="follows__page-info">
                        {t.pagination.pageOf
                            .replace('{page}', String(pagination.page))
                            .replace('{total}', String(pagination.totalPages))}
                    </span>
                    <button
                        className="follows__page-btn"
                        disabled={!pagination.hasNextPage}
                        onClick={() => setPage((p) => p + 1)}
                    >
                        {t.pagination.next}
                    </button>
                </div>
            )}
        </section>
    );
};

export default Follows;