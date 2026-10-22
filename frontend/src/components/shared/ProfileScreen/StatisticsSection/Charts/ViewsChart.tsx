import { useLanguage } from '../../../../../hooks/useLanguage';
import { statisticsTranslations } from '../lang';
import type { TooltipItem } from 'chart.js';

import { useMemo } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import type { TimelineItem } from '../../../../../api/stats/main.api';
import { formatShortDate, tooltipStyle } from './utils';
import './Charts.scss';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler,
);

interface ViewsChartProps {
    data: TimelineItem[];
}

const ViewsChart = ({ data }: ViewsChartProps) => {
    const { language } = useLanguage();
    const t = statisticsTranslations[language];
    const chartData = useMemo(
        () => ({
            labels: data.map((item) => formatShortDate(item.date, language)),
            datasets: [
                {
                    label: t.views,
                    data: data.map((item) => item.count),
                    borderColor: '#BC9547',
                    backgroundColor: 'rgba(188, 149, 71, 0.16)',
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#BC9547',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: data.length === 1 ? 3 : 0,
                    pointHoverRadius: 6,
                },
            ],
        }),
        [data, language, t.views],
    );

    const options = useMemo(
        () => ({
            responsive: true,
            maintainAspectRatio: false,
            animation: false as const,
            plugins: {
                legend: { display: false },
                tooltip: {
                    ...tooltipStyle,
                    callbacks: {
                        label: (ctx: TooltipItem<'line'>) =>
                            t.viewsCount.replace(
                                '{count}',
                                String(ctx.parsed.y),
                            ),
                    },
                },
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: {
                        color: '#727272',
                        font: { size: 11 },
                        maxTicksLimit: 6,
                        maxRotation: 0,
                    },
                },
                y: {
                    grid: { color: '#E5E5E5' },
                    ticks: {
                        color: '#727272',
                        font: { size: 11 },
                        precision: 0,
                        maxTicksLimit: 5,
                    },
                    beginAtZero: true,
                },
            },
        }),
        [t.viewsCount],
    );

    return (
        <section className="chart-container views-chart">
            <div className="chart-header">
                <h3 className="chart-title">{t.views}</h3>
            </div>

            <div className="chart-wrapper chart-wrapper--line">
                {data.length === 0 ? (
                    <div className="chart-empty">{t.empty}</div>
                ) : (
                    <Line
                        data={chartData}
                        options={options}
                        role="img"
                        aria-label={t.views}
                    />
                )}
            </div>
        </section>
    );
};

export default ViewsChart;
