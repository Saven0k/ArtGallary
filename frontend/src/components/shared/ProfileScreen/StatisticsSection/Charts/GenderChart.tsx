import { useLanguage } from '../../../../../hooks/useLanguage';
import { statisticsTranslations } from '../lang';
import type { GenderStatsData } from '../../../../../api/stats/main.api';
import { toPercent } from './utils';

const GenderChart = ({ data }: { data: GenderStatsData }) => {
    const { language } = useLanguage();
    const t = statisticsTranslations[language];
    const total = data.male + data.female + data.unknown;
    const female = total ? (data.female / total) * 100 : 0;
    const male = total ? (data.male / total) * 100 : 0;
    const items = [
        { label: t.female, value: data.female, color: '#BC9547' },
        { label: t.male, value: data.male, color: '#D9D9D9' },
        { label: t.unknown, value: data.unknown, color: '#727272' },
    ].filter((item) => item.value > 0);
    return (
        <section className="chart-container gender-chart">
            <h3 className="chart-title">{t.audience}</h3>
            {total ? (
                <div className="gender-chart__body">
                    <div
                        className="gender-chart__donut"
                        aria-hidden="true"
                        style={{
                            background: `conic-gradient(#BC9547 0% ${female}%, #D9D9D9 ${female}% ${female + male}%, #727272 ${female + male}% 100%)`,
                        }}
                    />
                    <ul className="gender-chart__legend">
                        {items.map((item) => (
                            <li key={item.label}>
                                <span
                                    className="gender-chart__dot"
                                    style={{ background: item.color }}
                                    aria-hidden="true"
                                />
                                {item.label}
                                <strong>{toPercent(item.value, total)}%</strong>
                            </li>
                        ))}
                    </ul>
                </div>
            ) : (
                <p className="chart-empty">{t.empty}</p>
            )}
        </section>
    );
};

export default GenderChart;
