import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';

interface DailyProgress {
    date: string;
    count: number;
}

interface PatternProgress {
    name: string;
    category: string;
    completed: number;
    total: number;
    percentComplete: number;
}

interface StreakData {
    currentStreak: number;
    longestStreak: number;
    totalCompleted: number;
    lastActive: string | null;
}

export default function Analytics() {
    const { data: weeklyProgress = [], isLoading: weeklyLoading } = useQuery<DailyProgress[]>({
        queryKey: ['analytics', 'weekly'],
        queryFn: () => api.request('/analytics/weekly-progress?days=30'),
        retry: false,
    });

    const { data: patternProgress = [], isLoading: patternLoading } = useQuery<PatternProgress[]>({
        queryKey: ['analytics', 'patterns'],
        queryFn: () => api.request('/analytics/pattern-progress'),
        retry: false,
    });

    const { data: streak, isLoading: streakLoading } = useQuery<StreakData>({
        queryKey: ['analytics', 'streak'],
        queryFn: () => api.request('/analytics/streak'),
        retry: false,
    });

    const isLoading = weeklyLoading || patternLoading || streakLoading;

    // Calculate max for chart scaling
    const maxCount = Math.max(...weeklyProgress.map(d => d.count), 1);

    return (
        <div className="page">
            <h1 className="mb-lg">Progress Analytics</h1>

            {isLoading ? (
                <div className="text-center text-muted">Loading analytics...</div>
            ) : (
                <>
                    {/* Streak Cards */}
                    <div className="grid grid-3 gap-md mb-lg">
                        <div className="card text-center">
                            <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--color-accent)' }}>
                                🔥 {streak?.currentStreak || 0}
                            </div>
                            <p className="text-muted">Current Streak</p>
                        </div>
                        <div className="card text-center">
                            <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--color-success)' }}>
                                🏆 {streak?.longestStreak || 0}
                            </div>
                            <p className="text-muted">Longest Streak</p>
                        </div>
                        <div className="card text-center">
                            <div style={{ fontSize: '2.5rem', fontWeight: 700 }}>
                                ✅ {streak?.totalCompleted || 0}
                            </div>
                            <p className="text-muted">Total Solved</p>
                        </div>
                    </div>

                    {/* Weekly Progress Chart */}
                    <div className="card mb-lg">
                        <h3 className="card-title mb-md">Last 30 Days</h3>
                        <div style={{
                            display: 'flex',
                            alignItems: 'flex-end',
                            gap: '2px',
                            height: '120px',
                            padding: 'var(--spacing-sm) 0'
                        }}>
                            {weeklyProgress.map((day, i) => (
                                <div
                                    key={i}
                                    title={`${day.date}: ${day.count} questions`}
                                    style={{
                                        flex: 1,
                                        height: `${Math.max((day.count / maxCount) * 100, 4)}%`,
                                        background: day.count > 0
                                            ? 'var(--color-accent)'
                                            : 'var(--color-bg-tertiary)',
                                        borderRadius: '2px',
                                        minHeight: '4px',
                                        cursor: 'pointer',
                                        transition: 'opacity 0.2s',
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                                    onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                                />
                            ))}
                        </div>
                        <div className="flex justify-between text-muted" style={{ fontSize: '0.75rem' }}>
                            <span>30 days ago</span>
                            <span>Today</span>
                        </div>
                    </div>

                    {/* Pattern Progress */}
                    <div className="card">
                        <h3 className="card-title mb-md">Pattern Mastery</h3>
                        <p className="text-muted mb-md" style={{ fontSize: '0.875rem' }}>
                            Sorted by completion rate (weakest patterns first)
                        </p>
                        <div className="flex flex-col gap-sm">
                            {patternProgress.slice(0, 10).map((pattern) => (
                                <div key={pattern.name}>
                                    <div className="flex justify-between items-center mb-xs">
                                        <span style={{ fontWeight: 500 }}>{pattern.name}</span>
                                        <span className="text-muted" style={{ fontSize: '0.875rem' }}>
                                            {pattern.completed}/{pattern.total}
                                        </span>
                                    </div>
                                    <div className="progress-bar">
                                        <div
                                            className="progress-bar-fill"
                                            style={{
                                                width: `${pattern.percentComplete}%`,
                                                background: pattern.percentComplete < 30
                                                    ? 'var(--color-error)'
                                                    : pattern.percentComplete < 70
                                                        ? 'var(--color-warning)'
                                                        : 'var(--color-success)'
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        {patternProgress.length > 10 && (
                            <p className="text-muted mt-md text-center" style={{ fontSize: '0.875rem' }}>
                                Showing top 10 weakest patterns
                            </p>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
