// Statistics.tsx
import { Eye, Heart, Palette, Users } from "lucide-react";
import { profileTranslations } from "../../lang";
import StatCard from "../../StatCard/StatCard";
import "./Statistics.scss";
import { useLanguage } from "../../../../../hooks/useLanguage";

interface StatisticsProps {
    id: number;
    role: string;
}

const Statistics = ({ id, role }: StatisticsProps) => {
    const { language } = useLanguage();
    const t = profileTranslations[language].statistics;
    const c = t.cards;

    // Используем id и role для получения данных
    console.log("Statistics for user:", id, role);

    const stats = [
        { icon: <Eye size={22} />, value: "2 845", label: c.views },
        { icon: <Heart size={22} />, value: "527", label: c.likes },
        { icon: <Users size={22} />, value: "143", label: c.followers },
        { icon: <Palette size={22} />, value: "28", label: c.works },
    ];

    return (
        <section className="statistics">
            <header className="statistics__header">
                <h2 className="statistics__title">{t.title}</h2>
                <p className="statistics__subtitle">{t.subtitle}</p>
            </header>

            <div className="statistics__cards">
                {stats.map((stat, index) => (
                    <StatCard key={index} {...stat} />
                ))}
            </div>

            <div className="statistics__grid">
                <div className="statistics__chart">
                    <h3>{t.charts.views}</h3>
                    <div className="statistics__chart-placeholder">{t.placeholder}</div>
                </div>

                <div className="statistics__chart">
                    <h3>{t.charts.traffic}</h3>
                    <div className="statistics__pie-placeholder">○</div>
                </div>
            </div>

            <div className="statistics__bottom">
                <div className="statistics__table">
                    <h3>{t.charts.popular}</h3>
                    <ul>
                        <li><span>Лилии</span><strong>842 просмотра</strong></li>
                        <li><span>Закат</span><strong>731 просмотр</strong></li>
                        <li><span>Весна</span><strong>615 просмотров</strong></li>
                    </ul>
                </div>

                <div className="statistics__table">
                    <h3>{t.charts.countries}</h3>
                    <ul>
                        <li><span>🇷🇺 Россия</span><strong>67%</strong></li>
                        <li><span>🇨🇳 Китай</span><strong>18%</strong></li>
                        <li><span>🇩🇪 Германия</span><strong>15%</strong></li>
                    </ul>
                </div>
            </div>
        </section>
    );
};

export default Statistics;