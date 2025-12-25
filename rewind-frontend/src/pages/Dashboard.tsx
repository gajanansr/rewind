import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';

export default function Dashboard() {
    const { data: readiness, isLoading: _isLoading } = useQuery({
        queryKey: ['readiness'],
        queryFn: () => api.getReadiness(),
        retry: false, // Don't retry if not authenticated
    });

    const { data: revisions } = useQuery({
        queryKey: ['revisions-today'],
        queryFn: () => api.getTodayRevisions(),
        retry: false,
    });

    // Default values when not authenticated or data not available
    const displayData = readiness || {
        daysRemaining: 90,
        targetDays: 90,
        percentComplete: 0,
        trend: 'STABLE' as const,
        breakdown: {
            questionsSolved: 0,
            questionsTotal: 169,
            easyComplete: 0,
            mediumComplete: 0,
            hardComplete: 0,
            revisionsComplete: 0,
            weakPatterns: ['Start solving to see weak patterns'],
        },
        recentEvents: [],
    };

    return (
        <div className="page">
            <div className="grid grid-2" style={{ alignItems: 'start' }}>
                {/* Readiness Meter */}
                <div className="card readiness-meter">
                    <p className="text-muted mb-sm">MAANG Readiness</p>
                    <div className="readiness-days">
                        {displayData.daysRemaining}
                    </div>
                    <p className="readiness-label">days remaining</p>

                    <div className={`readiness-trend ${displayData.trend.toLowerCase()}`}>
                        {displayData.trend === 'IMPROVING' && '📈'}
                        {displayData.trend === 'STABLE' && '➡️'}
                        {displayData.trend === 'SLOWING' && '📉'}
                        {' '}{displayData.trend}
                    </div>

                    <div className="mt-lg">
                        <div className="progress-bar">
                            <div
                                className="progress-bar-fill"
                                style={{ width: `${displayData.percentComplete}%` }}
                            />
                        </div>
                        <p className="text-muted mt-sm" style={{ fontSize: '0.875rem' }}>
                            {displayData.breakdown.questionsSolved} / {displayData.breakdown.questionsTotal} questions
                        </p>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="flex flex-col gap-md">
                    <div className="card">
                        <h3 className="card-title mb-md">Progress by Difficulty</h3>

                        <div className="flex flex-col gap-sm">
                            <div className="flex justify-between items-center">
                                <span className="badge badge-easy">Easy</span>
                                <span>{displayData.breakdown.easyComplete} solved</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="badge badge-medium">Medium</span>
                                <span>{displayData.breakdown.mediumComplete} solved</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="badge badge-hard">Hard</span>
                                <span>{displayData.breakdown.hardComplete} solved</span>
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <h3 className="card-title mb-md">Weak Patterns</h3>
                        <div className="flex gap-sm" style={{ flexWrap: 'wrap' }}>
                            {displayData.breakdown.weakPatterns.map((pattern) => (
                                <span key={pattern} className="badge badge-pattern">
                                    {pattern}
                                </span>
                            ))}
                        </div>
                        <p className="text-muted mt-md" style={{ fontSize: '0.875rem' }}>
                            Focus on these to accelerate progress
                        </p>
                    </div>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="card mt-lg">
                <h3 className="card-title mb-md">Recent Activity</h3>
                <div className="flex flex-col gap-sm">
                    {displayData.recentEvents.map((event, i) => (
                        <div key={i} className="flex justify-between items-center" style={{
                            padding: 'var(--spacing-sm) 0',
                            borderBottom: i < displayData.recentEvents.length - 1
                                ? '1px solid var(--color-bg-tertiary)'
                                : 'none'
                        }}>
                            <span>{event.reason}</span>
                            <span style={{
                                color: event.delta < 0 ? 'var(--color-success)' : 'var(--color-error)',
                                fontWeight: 600
                            }}>
                                {event.delta < 0 ? '' : '+'}{event.delta} days
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Today's Revisions */}
            {(revisions?.length ?? 0) > 0 && (
                <div className="card mt-lg">
                    <div className="card-header">
                        <h3 className="card-title">Today's Revisions</h3>
                        <span className="badge badge-pattern">{revisions?.length} pending</span>
                    </div>
                    <p className="text-muted">
                        Listen to your past explanations and reinforce your understanding.
                    </p>
                </div>
            )}
        </div>
    );
}
