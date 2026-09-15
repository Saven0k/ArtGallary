// src/components/Likes/Likes.tsx
import { useCallback, useEffect, useState } from 'react';
import {
    getLikedArts,
    unlikeArt,
    type Art,
    type LikedArtsResponse,
} from '../../../../../api/arts/main.api';
import LikeCard from './LikeCard';
import { useLanguage } from '../../../../../hooks/useLanguage';
import { likesTranslations } from './lang';
import './Likes.css';

const PAGE_LIMIT = 12;

const Likes = () => {
    const { language } = useLanguage();
    const t = likesTranslations[language].likes;

    const [arts, setArts] = useState<Art[]>([]);
    const [pagination, setPagination] = useState<LikedArtsResponse['pagination'] | null>(null);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchLiked = useCallback(async (pageNum: number) => {
        setLoading(true);
        setError(null);
        const data = await getLikedArts(pageNum, PAGE_LIMIT, language);
        if (!data) {
            setError(t.error);
            setLoading(false);
            return;
        }
        setArts(data.arts);
        setPagination(data.pagination);
        setLoading(false);
    }, [language, t.error]);

    useEffect(() => {
        fetchLiked(page);
    }, [page, fetchLiked]);

    const handleUnlike = async (artId: number) => {
        // Оптимистично убираем из UI
        setArts(prev => prev.filter(a => a.id !== artId));

        const res = await unlikeArt(artId);
        if (!res || !res.success) {
            // Откат при ошибке
            fetchLiked(page);
        }
    };

    if (loading) {
        return (
            <section className="likes">
                <h1 className="likes__title">{t.title}</h1>
                <div className="likes__grid">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div className="like-card like-card--skeleton" key={i} />
                    ))}
                </div>
            </section>
        );
    }

    if (error) {
        return (
            <section className="likes">
                <h1 className="likes__title">{t.title}</h1>
                <p className="likes__empty">{error}</p>
            </section>
        );
    }

    if (!arts.length) {
        return (
            <section className="likes">
                <h1 className="likes__title">{t.title}</h1>
                <p className="likes__empty">{t.empty}</p>
            </section>
        );
    }

    return (
        <section className="likes">
            <h1 className="likes__title">{t.title}</h1>

            <div className="likes__grid">
                {arts.map(art => (
                    <LikeCard
                        key={art.id}
                        art={art}
                        onUnlike={() => handleUnlike(art.id)}
                        t={t}
                    />
                ))}
            </div>

            {pagination && pagination.totalPages > 1 && (
                <div className="likes__pagination">
                    <button
                        className="likes__page-btn"
                        disabled={!pagination.hasPreviousPage}
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                    >
                        {t.pagination.prev}
                    </button>
                    <span className="likes__page-info">
                        {t.pagination.pageOf
                            .replace('{page}', String(pagination.page))
                            .replace('{total}', String(pagination.totalPages))}
                    </span>
                    <button
                        className="likes__page-btn"
                        disabled={!pagination.hasNextPage}
                        onClick={() => setPage(p => p + 1)}
                    >
                        {t.pagination.next}
                    </button>
                </div>
            )}
        </section>
    );
};

export default Likes;