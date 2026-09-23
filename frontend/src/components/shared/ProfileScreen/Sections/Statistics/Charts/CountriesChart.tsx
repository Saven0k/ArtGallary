// src/components/shared/ProfileScreen/Charts/CountriesChart.tsx
import { useMemo } from "react";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import type { CountryStatsItem } from "../../../../../../api/stats/main.api";
import { CHART_COLORS, tooltipStyle } from "./utils";
import "./Charts.scss";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface CountriesChartProps {
    data: CountryStatsItem[];
}

const CountriesChart = ({ data }: CountriesChartProps) => {
    /** Топ-5 и перевод в проценты от общего числа просмотров */
    const items = useMemo(() => {
        const total = data.reduce((sum, item) => sum + item.count, 0);
        return data
            .slice(0, 5)
            .map((item) => ({
                country: item.countryName || `Страна ${item.countryId}`,
                percentage:
                    total > 0 ? Math.round((item.count / total) * 100) : 0,
            }));
    }, [data]);

    const chartData = useMemo(
        () => ({
            labels: items.map((i) => i.country),
            datasets: [
                {
                    label: "Зрители",
                    data: items.map((i) => i.percentage),
                    backgroundColor: items.map(
                        (_, i) => CHART_COLORS[i % CHART_COLORS.length],
                    ),
                    borderColor: "#fff",
                    borderWidth: 1,
                    borderRadius: 4,
                    barThickness: 20,
                },
            ],
        }),
        [items],
    );

    const options = useMemo(
        () => ({
            indexAxis: "y" as const,
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    ...tooltipStyle,
                    callbacks: {
                        label: (ctx: any) => `${ctx.parsed.x}%`,
                    },
                },
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: {
                        color: "#727272",
                        font: { size: 12 },
                        callback: (v: any) => `${v}%`,
                    },
                    max: 100,
                },
                y: {
                    grid: { display: false },
                    ticks: { color: "#222222", font: { size: 12 } },
                },
            },
        }),
        [],
    );

    return (
        <div className="chart-container">
            <h3 className="chart-title">Топ стран</h3>
            <div className="chart-wrapper chart-wrapper--bar">
                {items.length === 0 ? (
                    <div className="chart-empty">Нет данных</div>
                ) : (
                    <Bar data={chartData} options={options} />
                )}
            </div>
        </div>
    );
};

export default CountriesChart;