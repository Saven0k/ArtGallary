// src/components/shared/ProfileScreen/Charts/AgeChart.tsx
import { useMemo } from "react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";
import type { AgeStatsData } from "../../../../../../api/stats/main.api";
import {
    AGE_RANGE_LABELS,
    CHART_COLORS,
    legendStyle,
    toPercent,
    tooltipStyle,
} from "./utils";
import "./Charts.scss";

ChartJS.register(ArcElement, Tooltip, Legend);

interface AgeChartProps {
    data: AgeStatsData;
}

const ORDER: (keyof AgeStatsData)[] = ["18-25", "26-35", "36-50", "50+"];

const AgeChart = ({ data }: AgeChartProps) => {
    const total = ORDER.reduce((sum, key) => sum + data[key], 0);

    const items = useMemo(
        () =>
            ORDER.map((key) => ({
                name: AGE_RANGE_LABELS[key as string] ?? key,
                value: toPercent(data[key], total),
            })).filter((i) => i.value > 0),
        [data, total],
    );

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
            <h3 className="chart-title">Возраст аудитории</h3>
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

export default AgeChart;