import { useLanguage } from '../../../../../hooks/useLanguage';
import { statisticsTranslations } from '../lang';
import type { CountryStatsItem } from '../../../../../api/stats/main.api';
import { toPercent } from './utils';

const CountriesChart = ({
    data,
    total,
}: {
    data: CountryStatsItem[];
    total: number;
}) => {
    const { language } = useLanguage();
    const t = statisticsTranslations[language];
    const known = data.reduce((sum, item) => sum + item.count, 0);
    const items = data
        .slice(0, 4)
        .map((item) => ({
            label: item.countryName || t.unknown,
            count: item.count,
        }));
    const other = data.slice(4).reduce((sum, item) => sum + item.count, 0);
    if (other) items.push({ label: t.other, count: other });
    if (total > known) items.push({ label: t.unknown, count: total - known });
    return (
        <section className="chart-container">
            <h3 className="chart-title">{t.countries}</h3>
            {total ? (
                <ul className="stats-bars stats-bars--countries">
                    {items.map((item, index) => {
                        const value = toPercent(item.count, total);
                        return (
                            <li key={index}>
                                <span className="stats-bars__label">
                                    {item.label}
                                </span>
                                <div
                                    className="stats-bars__track"
                                    aria-hidden="true"
                                >
                                    <span style={{ width: `${value}%` }} />
                                </div>
                                <strong>{value}%</strong>
                            </li>
                        );
                    })}
                </ul>
            ) : (
                <p className="chart-empty">{t.empty}</p>
            )}
        </section>
    );
};

export default CountriesChart;
