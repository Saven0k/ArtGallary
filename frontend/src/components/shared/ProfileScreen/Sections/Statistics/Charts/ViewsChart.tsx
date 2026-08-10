// src/components/shared/ProfileScreen/Charts/ViewsChart.tsx
import { useEffect, useState } from "react";
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
import { getViewsTimeline, type ViewsTimelineData } from "../../../../../../api/stats/main.api";
import "./Charts.scss";

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

interface ViewsChartProps {
    authorId: number;
}

const ViewsChart = ({ authorId }: ViewsChartProps) => {
    const [data, setData] = useState<ViewsTimelineData[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const result = await getViewsTimeline(authorId, period);
            if (result) {
                setData(result);
            }
            setLoading(false);
        };
        fetchData();
    }, [authorId, period]);

    if (loading) {
        return <div className="chart-loading">Загрузка...</div>;
    }

    if (data.length === 0) {
        return <div className="chart-empty">Нет данных</div>;
    }

    const chartData = {
        labels: data.map((item) => {
            const d = new Date(item.date);
            return `${d.getDate()} ${d.toLocaleString('ru', { month: 'short' })}`;
        }),
        datasets: [
            {
                label: "Просмотры",
                data: data.map((item) => item.views),
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
    };

    const options = {
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
                        return `${context.parsed.y} просмотров`;
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
                },
            },
            y: {
                grid: {
                    color: "#E5E5E5",
                    drawBorder: false,
                },
                ticks: {
                    color: "#727272",
                    font: {
                        size: 12,
                    },
                    stepSize: 50,
                },
                beginAtZero: true,
            },
        },
    };

    return (
        <div className="chart-container">
            <div className="chart-header">
                <h3 className="chart-title">Просмотры</h3>
                <div className="chart-period-buttons">
                    <button
                        className={`chart-period-btn ${period === 'week' ? 'active' : ''}`}
                        onClick={() => setPeriod('week')}
                    >
                        Неделя
                    </button>
                    <button
                        className={`chart-period-btn ${period === 'month' ? 'active' : ''}`}
                        onClick={() => setPeriod('month')}
                    >
                        Месяц
                    </button>
                    <button
                        className={`chart-period-btn ${period === 'year' ? 'active' : ''}`}
                        onClick={() => setPeriod('year')}
                    >
                        Год
                    </button>
                </div>
            </div>

            <div className="chart-wrapper">
                <Line data={chartData} options={options} />
            </div>
        </div>
    );
};

export default ViewsChart;