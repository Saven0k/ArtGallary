
import { useCallback, useEffect, useState } from 'react';
import { Star, Users, TrendingUp } from 'lucide-react';
import { useLanguage } from '../../../../../hooks/useLanguage';
import { adminTranslations } from '../../../../../pages/admin/lang';
import { getSiteStats, type SiteStatsData } from '../../../../../api/site/main.api';
import SectionHeader from '../../SectionHeader/SectionHeader';
import EmptyState from '../../EmptyState/EmptyState';
import { ratingsTranslations } from './lang';
import './RatingsSection.scss';

const RatingsSection = () => {
    const { language } = useLanguage();
    const t = ratingsTranslations[language];
    const common = adminTranslations[language].common;

    const [stats, setStats] = useState<SiteStatsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        const data = await getSiteStats();
        if (data) {
            setStats(data);
        } else {
            setError(t.errors.loadFailed);
        }
        setLoading(false);
    }, [t.errors.loadFailed]);

    useEffect(() => {
        load();
    }, [load]);


    if (loading) {
        return (
            <div className="admin-section ratings-section">
                <SectionHeader title={t.title} subtitle={t.subtitle} />
                <div className="ratings-section__loading">{common.loading}</div>
            </div>
        );
    }


    if (error) {
        return (
            <div className="admin-section ratings-section">
                <SectionHeader title={t.title} subtitle={t.subtitle} />
                <div className="ratings-section__error">{error}</div>
            </div>
        );
    }


    if (!stats || stats.ratingsCount === 0) {
        return (
            <div className="admin-section ratings-section">
                <SectionHeader title={t.title} subtitle={t.subtitle} />
                <EmptyState text={t.empty} icon={<Star size={24} />} />
            </div>
        );
    }


    const average = stats.averageRating;
    const roundedStars = Math.round(average);

    return (
        <div className="admin-section ratings-section">
            <SectionHeader title={t.title} subtitle={t.subtitle} />

            <div className="ratings-section__cards">
                {                    }
                <div className="ratings-section__card">
                    <div className="ratings-section__card-icon">
                        <Star size={22} />
                    </div>
                    <div className="ratings-section__card-body">
                        <span className="ratings-section__card-label">
                            {t.summary.average}
                        </span>
                        <span className="ratings-section__card-value">
                            {average.toFixed(2)}
                            <span className="ratings-section__card-suffix">
                                / 5
                            </span>
                        </span>

                        <div className="ratings-section__stars">
                            {Array.from({ length: 5 }, (_, i) => (
                                <Star
                                    key={i}
                                    size={16}
                                    className={
                                        i < roundedStars
                                            ? 'ratings-section__star ratings-section__star--filled'
                                            : 'ratings-section__star'
                                    }
                                    fill={i < roundedStars ? 'currentColor' : 'none'}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {                  }
                <div className="ratings-section__card">
                    <div className="ratings-section__card-icon">
                        <Users size={22} />
                    </div>
                    <div className="ratings-section__card-body">
                        <span className="ratings-section__card-label">
                            {t.summary.total}
                        </span>
                        <span className="ratings-section__card-value">
                            {stats.ratingsCount}
                        </span>
                    </div>
                </div>

                {                                               }
                <div className="ratings-section__card">
                    <div className="ratings-section__card-icon">
                        <TrendingUp size={22} />
                    </div>
                    <div className="ratings-section__card-body">
                        <span className="ratings-section__card-label">
                            {t.summary.uniqueUsers}
                        </span>
                        <span className="ratings-section__card-value">
                            {stats.uniqueUsers}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RatingsSection;