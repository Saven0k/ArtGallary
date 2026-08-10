// src/components/shared/ProfileScreen/Charts/GenderChart.tsx
import { useEffect, useState } from "react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";
import { getViewersGenderStats } from "../../../../../../api/stats/main.api";
import "./Charts.scss";

ChartJS.register(ArcElement, Tooltip, Legend);

interface GenderChartProps {
    authorId: number;
}

const COLORS = ["#BC9547", "#ECDCBD", "#E5E5E5"];

const GenderChart = ({ authorId }: GenderChartProps) => {
    const [data, setData] = useState<{ name: string; value: number }[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const result = await getViewersGenderStats(authorId);
            if (result) {
                const total = result.male + result.female + result.unknown;
                const formatted = [
                    { name: "Женщины", value: total > 0 ? Math.round((result.female / total) * 100) : 0 },
                    { name: "Мужчины", value: total > 0 ? Math.round((result.male / total) * 100) : 0 },
                    { name: "Неизвестно", value: total > 0 ? Math.round((result.unknown / total) * 100) : 0 },
                ].filter((item) => item.value > 0);
                setData(formatted);
            }
            setLoading(false);
        };
        fetchData();
    }, [authorId]);

    if (loading) {
        return <div className="chart-loading">Загрузка...</div>;
    }

    if (data.length === 0) {
        return <div className="chart-empty">Нет данных</div>;
    }

    const chartData = {
        labels: data.map((item) => item.name),
        datasets: [
            {
                data: data.map((item) => item.value),
                backgroundColor: COLORS.slice(0, data.length),
                borderColor: "#fff",
                borderWidth: 2,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: "bottom" as const,
                labels: {
                    usePointStyle: true,
                    pointStyle: "circle",
                    padding: 20,
                    font: {
                        size: 13,
                    },
                    color: "#222222",
                },
            },
            tooltip: {
                backgroundColor: "#fff",
                titleColor: "#222222",
                bodyColor: "#727272",
                borderColor: "#E5E5E5",
                borderWidth: 1,
                cornerRadius: 8,
                padding: 12,
                callbacks: {
                    label: function(context: any) {
                        return `${context.parsed}%`;
                    },
                },
            },
        },
        cutout: "60%",
    };

    return (
        <div className="chart-container">
            <h3 className="chart-title">Кто смотрит ваши работы</h3>
            <div className="chart-wrapper">
                <Doughnut data={chartData} options={options} />
            </div>
        </div>
    );
};

export default GenderChart;