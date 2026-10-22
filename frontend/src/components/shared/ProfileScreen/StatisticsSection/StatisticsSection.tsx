import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    getMyAuthorStats,
    type AuthorStatsData,
} from '../../../../api/stats/main.api';
import { useLanguage } from '../../../../hooks/useLanguage';
import ViewsChart from './Charts/ViewsChart';
import GenderChart from './Charts/GenderChart';
import AgeChart from './Charts/AgeChart';
import CountriesChart from './Charts/CountriesChart';
import { statisticsTranslations } from './lang';
import { periodToFilter, type Period } from './Charts/utils';
import likesIcon from './icons/likes.svg';
import viewsIcon from './icons/views.svg';
import followersIcon from './icons/followers.svg';
import './Charts/Charts.scss';

const PERIODS: Period[] = ['week', 'month', 'year'];

const Statistics = () => {
    const { language } = useLanguage();
    const t = statisticsTranslations[language];
    const [stats, setStats] = useState<AuthorStatsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [period, setPeriod] = useState<Period>('month');
    const [attempt, setAttempt] = useState(0);

    useEffect(() => {
        const controller = new AbortController();
        setLoading(true);
        setError(false);
        setStats(null);
        void getMyAuthorStats(
            periodToFilter(period),
            language,
            controller.signal,
        ).then((data) => {
            if (controller.signal.aborted) return;
            setStats(data);
            setError(!data);
            setLoading(false);
        });
        return () => controller.abort();
    }, [period, language, attempt]);

    const number = (value: number) => value.toLocaleString(language);
    const metrics = stats
        ? [
              {
                  key: 'likes' as const,
                  label: t.likes,
                  value: stats.totalLikes,
                  icon: likesIcon,
              },
              {
                  key: 'views' as const,
                  label: t.views,
                  value: stats.totalViews,
                  icon: viewsIcon,
              },
              {
                  key: 'followers' as const,
                  label: t.followers,
                  value: stats.newFollowers,
                  icon: followersIcon,
              },
          ]
        : [];

    return (
        <section
            className="author-statistics"
            aria-labelledby="author-statistics-title"
            aria-busy={loading}
        >
            <header className="author-statistics__header">
                <h2 id="author-statistics-title">{t.title}</h2>
                <div
                    className="chart-period-buttons"
                    role="group"
                    aria-label={t.period}
                >
                    {PERIODS.map((item) => (
                        <button
                            key={item}
                            type="button"
                            className={`chart-period-btn ${period === item ? 'active' : ''}`}
                            aria-pressed={period === item}
                            onClick={() => setPeriod(item)}
                        >
                            {t[item]}
                        </button>
                    ))}
                </div>
            </header>
            <p className="author-statistics__note">{t.comparison}</p>
            {loading ? (
                <p className="stats-loading" role="status">
                    {t.loading}
                </p>
            ) : error || !stats ? (
                <div className="stats-error" role="alert">
                    <p>{t.error}</p>
                    <button
                        type="button"
                        onClick={() => setAttempt((value) => value + 1)}
                    >
                        {t.retry}
                    </button>
                </div>
            ) : (
                <>
                    <div className="author-statistics__summary">
                        <div className="stats-cards">
                            {metrics.map((metric) => {
                                const change = stats.changes[metric.key];
                                return (
                                    <article
                                        className="stats-card"
                                        key={metric.key}
                                    >
                                        <img
                                            src={metric.icon}
                                            alt=""
                                            className="stats-card__icon"
                                        />
                                        <div className="stats-card__content">
                                            <span className="stats-card__value">
                                                {number(metric.value)}
                                            </span>
                                            <h3 className="stats-card__label">
                                                {metric.label}
                                            </h3>
                                            <span
                                                title={
                                                    change === null
                                                        ? t.noComparison
                                                        : t.comparison
                                                }
                                                className={`stats-card__change ${change !== null && change < 0 ? 'stats-card__change--negative' : ''}`}
                                            >
                                                {change === null
                                                    ? '—'
                                                    : `${change > 0 ? '+' : ''}${number(change)}%`}
                                            </span>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                        <GenderChart data={stats.viewsByGender} />
                    </div>
                    <ViewsChart data={stats.viewsTimeline} />
                    <div className="author-statistics__details">
                        <div className="author-statistics__audience">
                            <AgeChart data={stats.viewsByAge} />
                            <CountriesChart
                                data={stats.viewsByCountry}
                                total={stats.artViews}
                            />
                        </div>
                        <section
                            className="chart-container popular-arts"
                            aria-labelledby="popular-arts-title"
                        >
                            <h3 className="chart-title" id="popular-arts-title">
                                {t.popular}
                            </h3>
                            {stats.popularArts.length ? (
                                <div className="popular-arts__grid">
                                    {stats.popularArts.map((art) => (
                                        <Link
                                            key={art.id}
                                            to={`/arts/${art.id}`}
                                            className="popular-art"
                                        >
                                            {art.image_path ? (
                                                <img
                                                    className="popular-art__image"
                                                    src={art.image_path}
                                                    alt={art.title}
                                                    loading="lazy"
                                                />
                                            ) : (
                                                <div className="popular-art__placeholder">
                                                    {t.noImage}
                                                </div>
                                            )}
                                            <h4>{art.title}</h4>
                                            <div className="popular-art__counts">
                                                <span>
                                                    <img
                                                        src={likesIcon}
                                                        alt=""
                                                    />
                                                    <span className="visually-hidden">
                                                        {t.likes}:{' '}
                                                    </span>
                                                    {number(art.likes)}
                                                </span>
                                                <span>
                                                    <img
                                                        src={viewsIcon}
                                                        alt=""
                                                    />
                                                    <span className="visually-hidden">
                                                        {t.views}:{' '}
                                                    </span>
                                                    {number(art.views)}
                                                </span>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <p className="chart-empty">{t.emptyArts}</p>
                            )}
                            <p className="author-statistics__note">
                                {t.ranking}
                            </p>
                        </section>
                    </div>
                    <p className="author-statistics__note">{t.audienceNote}</p>
                </>
            )}
        </section>
    );
};

export default Statistics;
