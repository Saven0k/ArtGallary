// src/pages/Profile/components/ProfileContent/AdminSiteStats/AdminSiteStats.tsx
import { useEffect, useState } from 'react';
import { Eye, Users, Calendar, Star } from 'lucide-react';
import { getSiteStats, type SiteStatsData } from '../../../../api/site/main.api';
import './AdminSiteStats.scss';
import { useLanguage } from '../../../../hooks/useLanguage';
import { adminSiteStatsTranslations } from './lang';

const AdminSiteStats = () => {
    const { language } = useLanguage();
    const t = adminSiteStatsTranslations[language];

    const [stats, setStats] = useState<SiteStatsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let alive = true;
        (async () => {
            const res = await getSiteStats();
            if (alive) {
                setStats(res);
                setLoading(false);
            }
        })();
        return () => {
            alive = false;
        };
    }, []);

    if (loading) {
        return <section className="admin-site-stats admin-site-stats--loading">{t.loading}</section>;
    }

    if (!stats) {
        return <section className="admin-site-stats admin-site-stats--error">{t.error}</section>;
    }

    const cards = [
        { icon: <Eye size={20} />, label: t.total, value: stats.totalVisits },
        { icon: <Calendar size={20} />, label: t.today, value: stats.todayVisits },
        { icon: <Calendar size={20} />, label: t.week, value: stats.weekVisits },
        { icon: <Users size={20} />, label: t.unique, value: stats.uniqueUsers },
        {
            icon: <Star size={20} />,
            label: t.rating,
            value: stats.ratingsCount > 0 ? `${stats.averageRating} / 5` : '—',
        },
    ];

    return (
        <section className="admin-site-stats">
            <header className="admin-site-stats__header">
                <h2 className="admin-site-stats__title">{t.title}</h2>
                <p className="admin-site-stats__subtitle">{t.subtitle}</p>
            </header>

            <div className="admin-site-stats__grid">
                {cards.map((c, i) => (
                    <div className="admin-site-stats__card" key={i}>
                        <div className="admin-site-stats__card-icon">{c.icon}</div>
                        <div className="admin-site-stats__card-body">
                            <span className="admin-site-stats__card-label">{c.label}</span>
                            <span className="admin-site-stats__card-value">{c.value}</span>
                        </div>
                    </div>
                ))}
            </div>

            {stats.topPaths.length > 0 && (
                <div className="admin-site-stats__top">
                    <h3 className="admin-site-stats__top-title">{t.topPaths}</h3>
                    <ul className="admin-site-stats__top-list">
                        {stats.topPaths.map((p) => (
                            <li key={p.path} className="admin-site-stats__top-item">
                                <span className="admin-site-stats__top-path">{p.path}</span>
                                <span className="admin-site-stats__top-count">{p.count}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </section>
    );
};

export default AdminSiteStats;