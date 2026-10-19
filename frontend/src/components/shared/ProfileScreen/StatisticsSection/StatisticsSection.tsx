import { useCallback, useEffect, useMemo, useState } from "react";
import "./Charts/Charts.scss";
import { getAuthorStats, type AuthorStatsData, type StatsQuery } from "../../../../api/stats/main.api";
import ViewsChart from "./Charts/ViewsChart";
import GenderChart from "./Charts/GenderChart";
import AgeChart from "./Charts/AgeChart";
import CountriesChart from "./Charts/CountriesChart";
import { useLanguage } from '../../../../hooks/useLanguage';
import { statisticsTranslations } from './lang';

type Period = "week" | "month" | "year";

interface ProfileStatsProps {
    authorId: number;
}


const periodToFilter = (period: Period): StatsQuery => {
    const end = new Date();
    const start = new Date(end);
    if (period === "week") start.setDate(end.getDate() - 7);
    else if (period === "month") start.setDate(end.getDate() - 30);
    else start.setFullYear(end.getFullYear() - 1);

    const iso = (d: Date) => d.toISOString().split("T")[0];
    return { startDate: iso(start), endDate: iso(end) };
};

const Statistics = ({ authorId }: ProfileStatsProps) => {
    const { language } = useLanguage();
    const t = statisticsTranslations[language];
    const [stats, setStats] = useState<AuthorStatsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [period, setPeriod] = useState<Period>("month");

    const filter = useMemo(() => periodToFilter(period), [period]);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        const res = await getAuthorStats(authorId, filter, language);
        if (!res) setError(t.error);
        setStats(res);
        setLoading(false);
    }, [authorId, filter, language, t.error]);

    useEffect(() => {
        load();
    }, [load]);

    if (loading) return <div className="stats-loading">{t.loading}</div>;
    if (error) return <div className="stats-error">{error}</div>;
    if (!stats) return <div className="stats-empty">{t.empty}</div>;

    return (
        <div className="profile-stats">
            {                      }
            <div className="stats-cards">
                <div className="stats-card">
                    <span className="stats-card__label">{t.likes}</span>
                    <span className="stats-card__value">{stats.totalLikes}</span>
                </div>
                <div className="stats-card">
                    <span className="stats-card__label">{t.views}</span>
                    <span className="stats-card__value">{stats.totalViews}</span>
                </div>
                <div className="stats-card">
                    <span className="stats-card__label">{t.unique}</span>
                    <span className="stats-card__value">{stats.uniqueUsers}</span>
                </div>
                <div className="stats-card">
                    <span className="stats-card__label">
                        {t.artworksProfile}
                    </span>
                    <span className="stats-card__value">
                        {stats.artViews} / {stats.authorViews}
                    </span>
                </div>
            </div>

            {                  }
            <div className="stats-grid">
                <div className="stats-grid__wide">
                    <ViewsChart
                        data={stats.viewsTimeline}
                        period={period}
                        onPeriodChange={setPeriod}
                    />
                </div>

                <div className="stats-grid__narrow">
                    <GenderChart data={stats.viewsByGender} />
                </div>

                <div className="stats-grid__narrow">
                    <AgeChart data={stats.viewsByAge} />
                </div>

                <div className="stats-grid__narrow">
                    <CountriesChart data={stats.viewsByCountry} />
                </div>
            </div>
        </div>
    );
};

export default Statistics;
