import { useMemo, useRef, useEffect } from 'react';

interface ActivityHeatmapProps {
    data: Record<string, number>;
    startDate?: string; // ISO date string
}

export default function ActivityHeatmap({ data, startDate }: ActivityHeatmapProps) {
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Scroll to end on load
    useEffect(() => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollLeft = scrollContainerRef.current.scrollWidth;
        }
    }, [data, startDate]); // Re-scroll when data/date changes

    const { months, totalSolved, activeDays } = useMemo(() => {
        const today = new Date();
        // Start from registration date or default to 3 months ago if missing (though it shouldn't happen with new backend)
        const start = startDate ? new Date(startDate) : new Date(today.getFullYear(), today.getMonth() - 2, 1);

        // End date is today + 3 full months
        const end = new Date(today.getFullYear(), today.getMonth() + 5, 0); // End of 3rd month from now

        const monthBlocks: {
            name: string;
            year: number;
            monthIndex: number; // 0-11
            days: { date: string; count: number; day: number }[];
            firstDayOfWeek: number;
        }[] = [];

        // Iterate month by month
        const currentIterator = new Date(start.getFullYear(), start.getMonth(), 1);

        while (currentIterator <= end) {
            const year = currentIterator.getFullYear();
            const monthIndex = currentIterator.getMonth();
            const monthName = currentIterator.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });

            const firstDayOfMonth = new Date(year, monthIndex, 1);
            const lastDayOfMonth = new Date(year, monthIndex + 1, 0);

            const days: { date: string; count: number; day: number }[] = [];

            for (let d = 1; d <= lastDayOfMonth.getDate(); d++) {
                const date = new Date(year, monthIndex, d);
                // Adjust to local date string to match keys (assuming keys are YYYY-MM-DD local)
                // Use a robust way to get YYYY-MM-DD
                const offset = date.getTimezoneOffset();
                const localDate = new Date(date.getTime() - (offset * 60 * 1000));
                const dateStr = localDate.toISOString().split('T')[0];

                days.push({
                    date: dateStr,
                    count: data[dateStr] || 0,
                    day: d,
                });
            }

            monthBlocks.push({
                name: monthName,
                year,
                monthIndex,
                days,
                firstDayOfWeek: firstDayOfMonth.getDay()
            });

            // Move to next month
            currentIterator.setMonth(currentIterator.getMonth() + 1);
        }

        // Calculate stats (total across all visible history)
        let totalSolved = 0;
        const uniqueActiveDays = new Set<string>();

        Object.entries(data).forEach(([date, count]) => {
            if (count > 0) {
                totalSolved += count;
                uniqueActiveDays.add(date);
            }
        });

        return { months: monthBlocks, totalSolved, activeDays: uniqueActiveDays.size };
    }, [data, startDate]);

    // Get color intensity based on count
    const getColorClass = (count: number) => {
        if (count === 0) return 'level-0';
        if (count === 1) return 'level-1';
        if (count === 2) return 'level-2';
        if (count <= 4) return 'level-3';
        return 'level-4';
    };

    const isToday = (dateStr: string) => {
        const today = new Date();
        const offset = today.getTimezoneOffset();
        const localToday = new Date(today.getTime() - (offset * 60 * 1000));
        return dateStr === localToday.toISOString().split('T')[0];
    };

    return (
        <div className="activity-heatmap">
            <div className="heatmap-header">
                <span className="heatmap-stats">
                    <strong>{totalSolved}</strong> questions • <strong>{activeDays}</strong> active days
                </span>
            </div>

            <div
                className="heatmap-scroll-container"
                ref={scrollContainerRef}
            >
                <div className="heatmap-months-row">
                    {months.map((month) => (
                        <div key={`${month.year}-${month.monthIndex}`} className="heatmap-month-block">
                            <span className="heatmap-month-label">{month.name}</span>
                            <div className="heatmap-month-grid" style={{
                                // Add offset for first day of week
                                gridTemplateColumns: 'repeat(7, 1fr)',
                                // Create empty cells for start of month
                            }}>
                                {Array.from({ length: month.firstDayOfWeek }).map((_, i) => (
                                    <div key={`empty-${i}`} className="heatmap-day empty" />
                                ))}
                                {month.days.map((day) => (
                                    <div
                                        key={day.day}
                                        className={`heatmap-day ${getColorClass(day.count)} ${isToday(day.date) ? 'today' : ''}`}
                                        title={`${day.date}: ${day.count} questions`}
                                    >
                                        <span className="day-number">{day.day}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="heatmap-legend">
                <span className="text-muted">Less</span>
                <div className="heatmap-cell level-0" />
                <div className="heatmap-cell level-1" />
                <div className="heatmap-cell level-2" />
                <div className="heatmap-cell level-3" />
                <div className="heatmap-cell level-4" />
                <span className="text-muted">More</span>
            </div>
        </div>
    );
}
