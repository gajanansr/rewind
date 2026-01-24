import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { TrendingUp, TrendingDown, ArrowRight, Flame, Crown } from 'lucide-react';
import { useSubscriptionStore } from '../stores/subscriptionStore';
import ActivityHeatmap from '../components/ActivityHeatmap';
import TrialBanner from '../components/TrialBanner';

// Question distribution in the 169-question set
const TOTAL_QUESTIONS = 169;
const EASY_TOTAL = 46;
const MEDIUM_TOTAL = 92;
const HARD_TOTAL = 31;

// Day reduction per question solved
const EASY_DAY_REDUCTION = 0.28;
const MEDIUM_DAY_REDUCTION = 0.56;
const HARD_DAY_REDUCTION = 0.83;

// Total days that can be reduced (should sum to ~90)
const TOTAL_POSSIBLE_REDUCTION =
    (EASY_TOTAL * EASY_DAY_REDUCTION) +
    (MEDIUM_TOTAL * MEDIUM_DAY_REDUCTION) +
    (HARD_TOTAL * HARD_DAY_REDUCTION);

export default function Dashboard() {
    const { isActive, isTrial } = useSubscriptionStore();
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

    const { data: activity = {} } = useQuery({
        queryKey: ['activity'],
        queryFn: () => api.getActivity(),
        retry: false,
        staleTime: 1000 * 60 * 10, // Cache for 10 minutes
    });

    // Default values when not authenticated or data not available
    const defaultDisplayData = {
        daysRemaining: 90,
        targetDays: 90,
        percentComplete: 0,
        trend: 'STABLE' as const,
        breakdown: {
            questionsSolved: 0,
            questionsTotal: TOTAL_QUESTIONS,
            easyComplete: 0,
            mediumComplete: 0,
            hardComplete: 0,
            revisionsComplete: 0,
            weakPatterns: ['Start solving to see weak patterns'] as string[],
        },
        recentEvents: [] as any[],
        registrationDate: undefined as string | undefined
    };

    const displayData = readiness || defaultDisplayData;

    // Calculate weighted progress based on day reductions
    const easyDaysReduced = displayData.breakdown.easyComplete * EASY_DAY_REDUCTION;
    const mediumDaysReduced = displayData.breakdown.mediumComplete * MEDIUM_DAY_REDUCTION;
    const hardDaysReduced = displayData.breakdown.hardComplete * HARD_DAY_REDUCTION;
    const totalDaysReduced = easyDaysReduced + mediumDaysReduced + hardDaysReduced;
    const weightedProgress = Math.min(100, (totalDaysReduced / TOTAL_POSSIBLE_REDUCTION) * 100);

    // Calculate target date
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + displayData.daysRemaining);
    const formattedDate = targetDate.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    });

    // Speed message based on trend
    const getSpeedMessage = () => {
        switch (displayData.trend) {
            case 'IMPROVING':
                return { text: 'GOD SPEED! Keep it up!', icon: Flame, color: 'var(--color-success)' };
            case 'STABLE':
                return { text: 'Steady Player. Try to solve 1+ daily!', color: 'var(--color-warning)' };
            case 'SLOWING':
                return { text: 'Slowing down? Gave up on dreams?', color: 'var(--color-error)' };
            default:
                return { text: '', icon: null, color: 'inherit' };
        }
    };

    const speedMessage = getSpeedMessage();

    return (
        <div className="page">
            <TrialBanner />
            <div className="grid grid-2" style={{ alignItems: 'start' }}>
                {/* Readiness Meter */}
                <div className="card readiness-meter">
                    <p className="text-muted mb-sm">FAANG Ready By</p>
                    <div className="target-date">
                        {formattedDate}
                    </div>
                    <p className="days-remaining">
                        {displayData.daysRemaining} days remaining
                    </p>

                    {isActive && !isTrial && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            marginTop: '8px',
                            marginBottom: '8px',
                            padding: '4px 12px',
                            background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(255, 165, 0, 0.1) 100%)',
                            borderRadius: '20px',
                            border: '1px solid rgba(255, 215, 0, 0.3)',
                            color: '#FFD700',
                            fontSize: '0.8rem',
                            fontWeight: 600
                        }}>
                            <Crown size={14} fill="#FFD700" /> Premium Member
                        </div>
                    )}

                    <div className={`readiness-trend ${displayData.trend.toLowerCase()}`}>
                        {displayData.trend === 'IMPROVING' && <TrendingUp size={18} />}
                        {displayData.trend === 'STABLE' && <ArrowRight size={18} />}
                        {displayData.trend === 'SLOWING' && <TrendingDown size={18} />}
                        {' '}{displayData.trend}
                    </div>

                    <p className="speed-message" style={{ color: speedMessage.color, display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
                        {speedMessage.icon && <speedMessage.icon size={16} />}
                        {speedMessage.text}
                    </p>

                    <div className="mt-lg">
                        <div className="progress-bar">
                            <div
                                className="progress-bar-fill"
                                style={{ width: `${weightedProgress.toFixed(1)}%` }}
                            />
                        </div>
                        <p className="text-muted mt-sm" style={{ fontSize: '0.875rem' }}>
                            {weightedProgress.toFixed(1)}% complete (weighted by difficulty)
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

            {/* Activity Heatmap */}
            <div className="card mt-lg">
                <h3 className="card-title mb-md">Activity</h3>
                <ActivityHeatmap
                    data={activity}
                    startDate={displayData.registrationDate}
                />
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
                            <span className="activity-reason">{event.reason}</span>
                            <span style={{
                                color: event.delta < 0 ? 'var(--color-success)' : 'var(--color-error)',
                                fontWeight: 600,
                                whiteSpace: 'nowrap'
                            }}>
                                {event.delta < 0 ? '' : '+'}{Number(event.delta).toFixed(2)} days
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
