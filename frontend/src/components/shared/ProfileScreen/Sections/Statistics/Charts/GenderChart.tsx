// src/components/shared/ProfileScreen/Charts/GenderChart.tsx
import { useMemo } from "react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";
import type { GenderStatsData } from "../../../../../../api/stats/main.api";
import { CHART_COLORS, legendStyle, toPercent, tooltipStyle } from "./utils";
import "./Charts.scss";

ChartJS.register(ArcElement, Tooltip, Legend);

interface GenderChartProps {
    data: GenderStatsData;
}

const GenderChart = ({ data }: GenderChartProps) => {
    const total = data.male + data.female + data.unknown;

    const items = useMemo(() => {
        return [
            { name: "Женщины", value: toPercent(data.female, total) },
            { name: "Мужчины", value: toPercent(data.male, total) },
            { name: "Неизвестно", value: toPercent(data.unknown, total) },
        ].filter((item) => item.value > 0);
    }, [data, total]);

    const chartData = useMemo(
        () => ({
            labels: items.map((i) => i.name),
            datasets: [
                {
                    data: items.map((i) => i.value),
                    backgroundColor: CHART_COLORS.slice(0, items.length),
                    borderColor: "#fff",
                    borderWidth: 2,
                },
            ],
        }),
        [items],
    );

    const options = useMemo(
        () => ({
            responsive: true,
            maintainAspectRatio: false,
            cutout: "60%",
            plugins: {
                legend: legendStyle,
                tooltip: {
                    ...tooltipStyle,
                    callbacks: {
                        label: (ctx: any) => `${ctx.parsed}%`,
                    },
                },
            },
        }),
        [],
    );

    return (
        <div className="chart-container">
            <h3 className="chart-title">Кто смотрит ваши работы</h3>
            <div className="chart-wrapper chart-wrapper--donut">
                {items.length === 0 ? (
                    <div className="chart-empty">Нет данных</div>
                ) : (
                    <Doughnut data={chartData} options={options} />
                )}
            </div>
        </div>
    );
};

export default GenderChart;