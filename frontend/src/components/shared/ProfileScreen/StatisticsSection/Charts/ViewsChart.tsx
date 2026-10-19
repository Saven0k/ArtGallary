import { useLanguage } from '../../../../../hooks/useLanguage';
import { statisticsTranslations } from '../lang';
import type { TooltipItem } from "chart.js";

import { useMemo } from "react";
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
} from "chart.js";
import { Line } from "react-chartjs-2";
import type { TimelineItem } from "../../../../../api/stats/main.api";
import { formatShortDate, tooltipStyle } from "./utils";
import "./Charts.scss";

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

type Period = "week" | "month" | "year";

interface ViewsChartProps {
    data: TimelineItem[];
    period: Period;
    onPeriodChange: (p: Period) => void;
}

const PERIODS: Period[] = ["week", "month", "year"];

const ViewsChart = ({ data, period, onPeriodChange }: ViewsChartProps) => {
    const { language } = useLanguage();
    const t = statisticsTranslations[language];
    const chartData = useMemo(
        () => ({
            labels: data.map((item) => formatShortDate(item.date, language)),
            datasets: [
                {
                    label: t.views,
                    data: data.map((item) => item.count),
                    borderColor: "#BC9547",
                    backgroundColor: "rgba(188, 149, 71, 0.1)",
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: "#BC9547",
                    pointBorderColor: "#fff",
                    pointBorderWidth: 2,
                    pointRadius: 4,
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
            plugins: {
                legend: { display: false },
                tooltip: {
                    ...tooltipStyle,
                    callbacks: {
                        label: (ctx: TooltipItem<"line">) => t.viewsCount.replace("{count}", String(ctx.parsed.y)),
                    },
                },
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { color: "#727272", font: { size: 12 } },
                },
                y: {
                    grid: { color: "#E5E5E5" },
                    ticks: { color: "#727272", font: { size: 12 } },
                    beginAtZero: true,
                },
            },
        }),
        [t.viewsCount],
    );

    return (
        <div className="chart-container">
            <div className="chart-header">
                <h3 className="chart-title">{t.views}</h3>
                <div className="chart-period-buttons">
                    {PERIODS.map((p) => (
                        <button
                            key={p}
                            className={`chart-period-btn ${
                                period === p ? "active" : ""
                            }`}
                            onClick={() => onPeriodChange(p)}
                            type="button"
                        >
                            {t[p]}
                        </button>
                    ))}
                </div>
            </div>

            <div className="chart-wrapper chart-wrapper--line">
                {data.length === 0 ? (
                    <div className="chart-empty">{t.empty}</div>
                ) : (
                    <Line data={chartData} options={options} />
                )}
            </div>
        </div>
    );
};

export default ViewsChart;