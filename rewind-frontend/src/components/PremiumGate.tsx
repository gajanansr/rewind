import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Crown, Sparkles, Lock } from 'lucide-react';
import { useSubscriptionStore } from '../stores/subscriptionStore';

interface PremiumGateProps {
    children: ReactNode;
    feature?: string;
    showPreview?: boolean;
}

/**
 * Wraps premium features. Shows upgrade prompt for non-subscribers.
 * If showPreview is true, shows a locked overlay instead of completely hiding.
 */
export default function PremiumGate({ children, feature = 'This feature', showPreview = false }: PremiumGateProps) {
    const { isActive, isTrial, plan } = useSubscriptionStore();

    // User has active paid subscription or active trial
    const hasPremiumAccess = isActive && (plan === 'MONTHLY' || plan === 'QUARTERLY' || isTrial);

    if (hasPremiumAccess) {
        return <>{children}</>;
    }

    // Show locked preview
    if (showPreview) {
        return (
            <div className="premium-gate-preview">
                <div className="premium-gate-overlay">
                    <div className="premium-gate-content">
                        <div className="premium-gate-icon">
                            <Lock size={32} />
                        </div>
                        <h3>Premium Feature</h3>
                        <p>{feature} requires a subscription.</p>
                        <Link to="/pricing" className="btn btn-primary">
                            <Crown size={16} />
                            Upgrade to Unlock
                        </Link>
                    </div>
                </div>
                <div className="premium-gate-blur">
                    {children}
                </div>
            </div>
        );
    }

    // Show full upgrade prompt
    return (
        <div className="premium-gate">
            <div className="premium-gate-card">
                <div className="premium-gate-badge">
                    <Sparkles size={16} />
                    Premium
                </div>
                <h2>{feature}</h2>
                <p>Upgrade to unlock this feature and get full access to:</p>
                <ul className="premium-gate-features">
                    <li>🎙️ AI-powered recording analysis</li>
                    <li>📚 Structured learning paths</li>
                    <li>🔄 Spaced repetition revisions</li>
                    <li>📊 Advanced analytics</li>
                </ul>
                <Link to="/pricing" className="btn btn-primary btn-lg">
                    <Crown size={18} />
                    View Plans
                </Link>
                <p className="premium-gate-note">
                    Start with a 14-day free trial
                </p>
            </div>
        </div>
    );
}

/**
 * Hook to check premium access
 */
export function usePremiumAccess(): { hasPremium: boolean; isTrialing: boolean } {
    const { isActive, isTrial } = useSubscriptionStore();
    return {
        hasPremium: isActive,
        isTrialing: isTrial && isActive
    };
}
