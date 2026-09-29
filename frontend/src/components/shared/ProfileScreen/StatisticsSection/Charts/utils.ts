

export const CHART_COLORS = [
    "#BC9547",
    "#ECDCBD",
    "#5E5E5E",
    "#C99F9F",
    "#DEEFD1",
];

export const AGE_RANGE_LABELS: Record<string, string> = {
    "18-25": "18-24",
    "26-35": "25-34",
    "36-50": "35-44",
    "50+": "55+",
};


export const toPercent = (value: number, total: number): number =>
    total > 0 ? Math.round((value / total) * 100) : 0;


export const formatShortDate = (iso: string): string => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return `${d.getDate()} ${d.toLocaleString("ru", { month: "short" })}`;
};


export const tooltipStyle = {
    backgroundColor: "#fff",
    titleColor: "#222222",
    bodyColor: "#727272",
    borderColor: "#E5E5E5",
    borderWidth: 1,
    cornerRadius: 8,
    padding: 12,
} as const;

export const legendStyle = {
    position: "bottom" as const,
    labels: {
        usePointStyle: true,
        pointStyle: "circle" as const,
        padding: 20,
        font: { size: 13 },
        color: "#222222",
    },
};