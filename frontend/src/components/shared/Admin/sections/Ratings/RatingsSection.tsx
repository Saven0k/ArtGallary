// src/components/shared/Admin/sections/Ratings/RatingsSection.tsx
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Star, Users } from 'lucide-react';
import { useLanguage } from '../../../../../hooks/useLanguage';
import { adminTranslations } from '../../../../../pages/admin/lang';
import {
    getSiteRatings,
    type SiteRatingItem,
    type SiteRatingsResponse,
} from '../../../../../api/site/main.api';
import SectionHeader from '../../SectionHeader/SectionHeader';
import DataTable, { type Column } from '../../DataTable/DataTable';
import EmptyState from '../../EmptyState/EmptyState';
import { ratingsTranslations } from './lang';
import './RatingsSection.scss';

const PAGE_SIZE = 20;

const RatingsSection = () => {
    const { language } = useLanguage();
    const t = ratingsTranslations[language];
    const common = adminTranslations[language].common;

    const [res, setRes] = useState<SiteRatingsResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);

    // ---------- load ----------
    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        const data = await getSiteRatings(page, PAGE_SIZE);
        if (data) {
            setRes(data);
        } else {
            setError(t.errors.loadFailed);
        }
        setLoading(false);
    }, [page, t.errors.loadFailed]);

    useEffect(() => {
        load();
    }, [load]);

    // ---------- columns ----------
    const columns: Column<SiteRatingItem>[] = [
        {
            key: 'user',
            title: t.table.user,
            render: (r) =>
                r.user
                    ? `${r.user.name ?? ''} ${r.user.surname ?? ''}`.trim() || '—'
                    : '—',
        },
        {
            key: 'email',
            title: t.table.email,
            render: (r) => r.user?.email ?? '—',
        },
        {
            key: 'rating',
            title: t.table.rating,
            width: '160px',
            render: (r) => (
                <div className="ratings-section__stars">
                    {Array.from({ length: 5 }, (_, i) => (
                        <Star
                            key={i}
                            size={16}
                            className={
                                i < r.value
                                    ? 'ratings-section__star ratings-section__star--filled'
                                    : 'ratings-section__star'
                            }
                            fill={i < r.value ? 'currentColor' : 'none'}
                        />
                    ))}
                    <span className="ratings-section__value">{r.value}</span>
                </div>
            ),
        },
        {
            key: 'date',
            title: t.table.date,
            width: '140px',
            render: (r) =>
                r.created_at
                    ? new Date(r.created_at).toLocaleDateString(
                          language === 'ru'
                              ? 'ru-RU'
                              : language === 'zh'
                              ? 'zh-CN'
                              : 'en-US',
                      )
                    : '—',
        },
    ];

    const distribution = res?.distribution;
    const totalForBars = useMemo(() => {
        if (!distribution) return 0;
        return (
            distribution[1] +
            distribution[2] +
            distribution[3] +
            distribution[4] +
            distribution[5]
        );
    }, [distribution]);

    // ---------- render ----------
    if (loading && !res) {
        return (
            <div className="admin-section ratings-section">
                <SectionHeader title={t.title} subtitle={t.subtitle} />
                <div className="ratings-section__loading">{common.loading}</div>
            </div>
        );
    }

    return (
        <div className="admin-section ratings-section">
            <SectionHeader title={t.title} subtitle={t.subtitle} />

            {error && <div className="ratings-section__error">{error}</div>}

            {/* Summary */}
            {res && (
                <div className="ratings-section__summary">
                    <div className="ratings-section__summary-card">
                        <div className="ratings-section__summary-icon">
                            <Star size={20} />
                        </div>
                        <div>
                            <span className="ratings-section__summary-label">
                                {t.summary.average}
                            </span>
                            <span className="ratings-section__summary-value">
                                {res.average.toFixed(2)}
                            </span>
                        </div>
                    </div>

                    <div className="ratings-section__summary-card">
                        <div className="ratings-section__summary-icon">
                            <Users size={20} />
                        </div>
                        <div>
                            <span className="ratings-section__summary-label">
                                {t.summary.total}
                            </span>
                            <span className="ratings-section__summary-value">
                                {res.pagination.total}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Distribution */}
            {distribution && totalForBars > 0 && (
                <div className="ratings-section__distribution">
                    <h3 className="ratings-section__distribution-title">
                        {t.summary.distribution}
                    </h3>

                    {[5, 4, 3, 2, 1].map((star) => {
                        const count = distribution[star as 1 | 2 | 3 | 4 | 5];
                        const percent = Math.round((count / totalForBars) * 100);
                        return (
                            <div
                                key={star}
                                className="ratings-section__dist-row"
                            >
                                <span className="ratings-section__dist-label">
                                    {star}{' '}
                                    <Star size={12} fill="currentColor" />
                                </span>
                                <div className="ratings-section__dist-bar">
                                    <div
                                        className="ratings-section__dist-fill"
                                        style={{ width: `${percent}%` }}
                                    />
                                </div>
                                <span className="ratings-section__dist-count">
                                    {count}
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Table */}
            {!loading && res && res.data.length === 0 ? (
                <EmptyState text={t.empty} icon={<Star size={24} />} />
            ) : (
                <DataTable
                    columns={columns}
                    rows={res?.data ?? []}
                    loading={loading}
                    emptyText={common.empty}
                    rowKey={(r) => r.id}
                />
            )}

            {/* Pagination */}
            {res && !loading && res.pagination.totalPages > 1 && (
                <div className="ratings-section__pagination">
                    <button
                        type="button"
                        disabled={page <= 1}
                        onClick={() => setPage((p) => p - 1)}
                    >
                        ←
                    </button>
                    <span>
                        {page} / {res.pagination.totalPages}
                        <span className="ratings-section__total">
                            {' '}
                            ({res.pagination.total})
                        </span>
                    </span>
                    <button
                        type="button"
                        disabled={page >= res.pagination.totalPages}
                        onClick={() => setPage((p) => p + 1)}
                    >
                        →
                    </button>
                </div>
            )}
        </div>
    );
};

export default RatingsSection;