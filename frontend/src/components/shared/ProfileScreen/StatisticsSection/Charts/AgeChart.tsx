import { useLanguage } from '../../../../../hooks/useLanguage';
import { statisticsTranslations } from '../lang';
import type { AgeStatsData } from '../../../../../api/stats/main.api';
import { toPercent } from './utils';

const ORDER: (keyof AgeStatsData)[] = [
    '<18',
    '18-24',
    '25-34',
    '35-44',
    '45-54',
    '55+',
    'unknown',
];

const AgeChart = ({ data }: { data: AgeStatsData }) => {
    const { language } = useLanguage();
    const t = statisticsTranslations[language];
    const total = ORDER.reduce((sum, key) => sum + data[key], 0);
    const items = ORDER.filter(
        (key) => !['<18', 'unknown'].includes(key) || data[key] > 0,
    );
    return (
        <section className="chart-container">
            <h3 className="chart-title">{t.age}</h3>
            {total ? (
                <ul className="stats-bars">
                    {items.map((key) => {
                        const label =
                            key === 'unknown'
                                ? t.unknown
                                : key === '<18'
                                  ? t.under18
                                  : key;
                        const value = toPercent(data[key], total);
                        return (
                            <li key={key}>
                                <span className="stats-bars__label">
                                    {label}
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

export default AgeChart;
