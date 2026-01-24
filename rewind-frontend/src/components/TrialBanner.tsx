import { useEffect } from 'react';
import { Clock, AlertTriangle, Sparkles } from 'lucide-react';
import { useSubscriptionStore } from '../stores/subscriptionStore';
import { Link } from 'react-router-dom';

export default function TrialBanner() {
    const { isActive, isTrial, daysRemaining, plan, fetchSubscription, isLoading } = useSubscriptionStore();

    useEffect(() => {
        fetchSubscription();
    }, [fetchSubscription]);

    // Don't show banner if loading or if user has paid subscription
    if (isLoading) return null;
    if (plan === 'MONTHLY' || plan === 'QUARTERLY') return null;

    // Trial expired
    if (!isActive && plan !== 'NONE') {
        return (
            <div className="trial-banner trial-banner--expired">
                <div className="trial-banner__content">
                    <AlertTriangle size={18} />
                    <span>
                        Your trial has expired.{' '}
                        <Link to="/pricing" className="trial-banner__link">
                            Upgrade now
                        </Link>{' '}
                        to continue using Rewind.
                    </span>
                </div>
            </div>
        );
    }

    // Active trial with days remaining
    if (isTrial && isActive) {
        const isLow = daysRemaining <= 3;
        return (
            <div className={`trial-banner ${isLow ? 'trial-banner--warning' : 'trial-banner--info'}`}>
                <div className="trial-banner__content">
                    {isLow ? <AlertTriangle size={18} /> : <Clock size={18} />}
                    <span>
                        {daysRemaining === 0
                            ? 'Last day of your trial!'
                            : `${daysRemaining} day${daysRemaining === 1 ? '' : 's'} left in your trial.`}
                    </span>
                    <Link to="/pricing" className="trial-banner__button">
                        <Sparkles size={14} />
                        Upgrade
                    </Link>
                </div>
            </div>
        );
    }

    // No subscription at all
    if (plan === 'NONE') {
        return (
            <div className="trial-banner trial-banner--expired">
                <div className="trial-banner__content">
                    <AlertTriangle size={18} />
                    <span>
                        You need a subscription to use Rewind.{' '}
                        <Link to="/pricing" className="trial-banner__link">
                            View plans
                        </Link>
                    </span>
                </div>
            </div>
        );
    }

    return null;
}
