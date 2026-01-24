import { useEffect } from 'react';
import { Clock, AlertTriangle, Sparkles, Crown } from 'lucide-react';
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

    // Trial expired - still allow usage but encourage upgrade
    if (!isActive && plan !== 'NONE') {
        return (
            <div className="trial-banner trial-banner--expired">
                <div className="trial-banner__content">
                    <Crown size={18} />
                    <span>
                        Your trial has ended.{' '}
                        <Link to="/pricing" className="trial-banner__link">
                            Upgrade to unlock
                        </Link>{' '}
                        AI feedback & learning features.
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

    // No subscription at all - freemium user
    if (plan === 'NONE') {
        return (
            <div className="trial-banner trial-banner--promo">
                <div className="trial-banner__content">
                    <Crown size={18} />
                    <span>
                        Unlock AI feedback & learning features.{' '}
                        <Link to="/pricing" className="trial-banner__link">
                            Start 14-day free trial
                        </Link>
                    </span>
                </div>
            </div>
        );
    }

    return null;
}
