// src/components/shared/ProfileScreen/Charts/CountriesChart.tsx
import { useEffect, useState } from "react";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";
import { Bar } from "react-chartjs-2";
import { getViewersTopCountries } from "../../../../../../api/stats/main.api";
import "./Charts.scss";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface CountriesChartProps {
    authorId: number;
}

const COLORS = ["#BC9547", "#ECDCBD", "#E5E5E5", "#C99F9F", "#DEEFD1"];

const CountriesChart = ({ authorId }: CountriesChartProps) => {
    const [data, setData] = useState<{ country: string; percentage: number }[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const result = await getViewersTopCountries(authorId);
            if (result) {
                setData(result);
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
        labels: data.map((item) => item.country),
        datasets: [
            {
                label: "Зрители",
                data: data.map((item) => item.percentage),
                backgroundColor: data.map((_, index) => COLORS[index % COLORS.length]),
                borderColor: "#fff",
                borderWidth: 1,
                borderRadius: 4,
                barThickness: 20,
            },
        ],
    };

    const options = {
        indexAxis: "y" as const,
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false,
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
                        return `${context.parsed.x}%`;
                    },
                },
            },
        },
        scales: {
            x: {
                grid: {
                    display: false,
                },
                ticks: {
                    color: "#727272",
                    font: {
                        size: 12,
                    },
                    callback: function(value: any) {
                        return `${value}%`;
                    },
                },
                max: 100,
            },
            y: {
                grid: {
                    display: false,
                },
                ticks: {
                    color: "#222222",
                    font: {
                        size: 12,
                    },
                },
            },
        },
    };

    return (
        <div className="chart-container">
            <h3 className="chart-title">Топ стран</h3>
            <div className="chart-wrapper">
                <Bar data={chartData} options={options} />
            </div>
        </div>
    );
};

export default CountriesChart;