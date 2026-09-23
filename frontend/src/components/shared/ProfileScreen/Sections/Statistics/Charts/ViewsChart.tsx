// src/components/shared/ProfileScreen/Charts/ViewsChart.tsx
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
import type { TimelineItem } from "../../../../../../api/stats/main.api";
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

const PERIODS: { value: Period; label: string }[] = [
    { value: "week", label: "Неделя" },
    { value: "month", label: "Месяц" },
    { value: "year", label: "Год" },
];

const ViewsChart = ({ data, period, onPeriodChange }: ViewsChartProps) => {
    const chartData = useMemo(
        () => ({
            labels: data.map((item) => formatShortDate(item.date)),
            datasets: [
                {
                    label: "Просмотры",
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
        [data],
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
                        label: (ctx: any) => `${ctx.parsed.y} просмотров`,
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
        [],
    );

    return (
        <div className="chart-container">
            <div className="chart-header">
                <h3 className="chart-title">Просмотры</h3>
                <div className="chart-period-buttons">
                    {PERIODS.map((p) => (
                        <button
                            key={p.value}
                            className={`chart-period-btn ${
                                period === p.value ? "active" : ""
                            }`}
                            onClick={() => onPeriodChange(p.value)}
                            type="button"
                        >
                            {p.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="chart-wrapper chart-wrapper--line">
                {data.length === 0 ? (
                    <div className="chart-empty">Нет данных</div>
                ) : (
                    <Line data={chartData} options={options} />
                )}
            </div>
        </div>
    );
};

export default ViewsChart;