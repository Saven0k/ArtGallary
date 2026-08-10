// src/components/shared/ProfileScreen/Charts/AgeChart.tsx
import { useEffect, useState } from "react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";
import { getViewersAgeStats } from "../../../../../../api/stats/main.api";
import "./Charts.scss";

ChartJS.register(ArcElement, Tooltip, Legend);

interface AgeChartProps {
    authorId: number;
}

const COLORS = ["#BC9547", "#ECDCBD", "#DEEFD1", "#C99F9F", "#E5E5E5"];

const AgeChart = ({ authorId }: AgeChartProps) => {
    const [data, setData] = useState<{ name: string; value: number }[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const result = await getViewersAgeStats(authorId);
            if (result) {
                const formatted = result.map((item) => ({
                    name: item.range,
                    value: item.percentage,
                }));
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
            <h3 className="chart-title">Возраст аудитории</h3>
            <div className="chart-wrapper">
                <Doughnut data={chartData} options={options} />
            </div>
        </div>
    );
};

export default AgeChart;