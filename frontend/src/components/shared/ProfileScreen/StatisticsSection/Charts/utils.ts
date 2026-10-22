export type Period = 'week' | 'month' | 'year';

export const periodToFilter = (period: Period, now = new Date()) => {
    const end = new Date(now);
    const start = new Date(now);
    start.setUTCDate(
        start.getUTCDate() - ({ week: 7, month: 30, year: 365 }[period] - 1),
    );
    return {
        startDate: start.toISOString().slice(0, 10),
        endDate: end.toISOString().slice(0, 10),
    };
};

export const toPercent = (value: number, total: number): number =>
    total > 0 ? Math.round((value / total) * 100) : 0;

export const formatShortDate = (iso: string, language: string): string => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString(language, { day: 'numeric', month: 'short' });
};

export const tooltipStyle = {
    backgroundColor: '#fff',
    titleColor: '#222222',
    bodyColor: '#727272',
    borderColor: '#E5E5E5',
    borderWidth: 1,
    cornerRadius: 8,
    padding: 12,
} as const;
