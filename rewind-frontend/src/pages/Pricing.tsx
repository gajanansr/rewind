import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '../api/client';
import type { PaymentPlan } from '../api/client';
import { useSubscriptionStore } from '../stores/subscriptionStore';
import { Check, Sparkles, Loader2, Crown, AlertCircle } from 'lucide-react';

declare global {
    interface Window {
        Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
    }
}

interface RazorpayOptions {
    key: string;
    amount: number;
    currency: string;
    name: string;
    description: string;
    order_id: string;
    handler: (response: RazorpayResponse) => void;
    prefill: {
        email: string;
    };
    theme: {
        color: string;
    };
    modal?: {
        ondismiss?: () => void;
    };
}

interface RazorpayInstance {
    open: () => void;
    on: (event: string, handler: () => void) => void;
}

interface RazorpayResponse {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
}

export default function Pricing() {
    const [selectedPlan, setSelectedPlan] = useState<'MONTHLY' | 'QUARTERLY'>('QUARTERLY');
    const [paymentError, setPaymentError] = useState<string | null>(null);
    const { isActive, plan: currentPlan, daysRemaining, fetchSubscription } = useSubscriptionStore();

    // Fetch plans
    const { data: plansData, isLoading: plansLoading } = useQuery({
        queryKey: ['payment-plans'],
        queryFn: () => api.getPaymentPlans(),
    });

    // Create order mutation
    const createOrderMutation = useMutation({
        mutationFn: (plan: 'MONTHLY' | 'QUARTERLY') => api.createPaymentOrder(plan),
        onSuccess: (data) => {
            openRazorpay(data);
        },
        onError: (error: Error) => {
            setPaymentError(error.message);
        },
    });

    // Verify payment mutation
    const verifyPaymentMutation = useMutation({
        mutationFn: (payment: { orderId: string; paymentId: string; signature: string }) =>
            api.verifyPayment(payment.orderId, payment.paymentId, payment.signature),
        onSuccess: () => {
            fetchSubscription();
        },
        onError: (error: Error) => {
            setPaymentError(error.message);
        },
    });

    const openRazorpay = (orderData: {
        orderId: string;
        amount: number;
        currency: string;
        keyId: string;
        email: string;
        plan: string;
    }) => {
        const options: RazorpayOptions = {
            key: orderData.keyId,
            amount: orderData.amount,
            currency: orderData.currency,
            name: 'Rewind',
            description: `${orderData.plan} Subscription`,
            order_id: orderData.orderId,
            handler: (response: RazorpayResponse) => {
                verifyPaymentMutation.mutate({
                    orderId: response.razorpay_order_id,
                    paymentId: response.razorpay_payment_id,
                    signature: response.razorpay_signature,
                });
            },
            prefill: {
                email: orderData.email,
            },
            theme: {
                color: '#6366f1',
            },
            modal: {
                ondismiss: () => {
                    setPaymentError('Payment was cancelled');
                },
            },
        };

        const razorpay = new window.Razorpay(options);
        razorpay.open();
    };

    const handleSubscribe = () => {
        setPaymentError(null);
        createOrderMutation.mutate(selectedPlan);
    };

    const plans = plansData?.plans || [];
    const isProcessing = createOrderMutation.isPending || verifyPaymentMutation.isPending;

    // Show success state
    if (verifyPaymentMutation.isSuccess) {
        return (
            <div className="page">
                <div className="pricing-success">
                    <div className="pricing-success-icon">
                        <Crown size={48} />
                    </div>
                    <h1>Welcome to Rewind Pro!</h1>
                    <p>Your subscription is now active. Enjoy unlimited access to all features.</p>
                    <a href="/" className="btn btn-primary">
                        Go to Dashboard
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="page">
            <div className="pricing-container">
                <div className="pricing-header">
                    <h1>Simple, Transparent Pricing</h1>
                    <p>Choose the plan that works for you. Cancel anytime.</p>
                </div>

                {/* Current subscription status */}
                {isActive && (currentPlan === 'TRIAL' || currentPlan === 'MONTHLY' || currentPlan === 'QUARTERLY') && (
                    <div className="pricing-current">
                        <Crown size={18} />
                        <span>
                            {currentPlan === 'TRIAL'
                                ? `Trial: ${daysRemaining} days remaining`
                                : `${currentPlan} plan: ${daysRemaining} days remaining`}
                        </span>
                    </div>
                )}

                {plansLoading ? (
                    <div className="pricing-loading">
                        <Loader2 className="animate-spin" size={32} />
                    </div>
                ) : (
                    <div className="pricing-plans">
                        {plans.map((plan: PaymentPlan) => {
                            const isSelected = selectedPlan === plan.id;
                            const isCurrentPlan = currentPlan === plan.id;

                            return (
                                <div
                                    key={plan.id}
                                    className={`pricing-card ${isSelected ? 'selected' : ''} ${plan.popular ? 'popular' : ''}`}
                                    onClick={() => !isCurrentPlan && setSelectedPlan(plan.id as 'MONTHLY' | 'QUARTERLY')}
                                >
                                    {plan.popular && (
                                        <div className="pricing-badge">
                                            <Sparkles size={14} />
                                            Most Popular
                                        </div>
                                    )}

                                    <h3>{plan.name}</h3>
                                    <div className="pricing-price">
                                        <span className="pricing-currency">₹</span>
                                        <span className="pricing-amount">{plan.price}</span>
                                        <span className="pricing-period">/{plan.duration}</span>
                                    </div>

                                    {plan.savings && (
                                        <div className="pricing-savings">{plan.savings}</div>
                                    )}

                                    <p className="pricing-description">{plan.description}</p>

                                    <ul className="pricing-features">
                                        <li><Check size={16} /> Unlimited questions</li>
                                        <li><Check size={16} /> AI-powered feedback</li>
                                        <li><Check size={16} /> Spaced repetition</li>
                                        <li><Check size={16} /> Progress tracking</li>
                                        <li><Check size={16} /> Voice explanations</li>
                                    </ul>

                                    {isCurrentPlan ? (
                                        <div className="pricing-current-badge">Current Plan</div>
                                    ) : (
                                        <div className={`pricing-radio ${isSelected ? 'checked' : ''}`} />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {paymentError && (
                    <div className="pricing-error">
                        <AlertCircle size={18} />
                        {paymentError}
                    </div>
                )}

                <button
                    className="btn btn-primary pricing-cta"
                    onClick={handleSubscribe}
                    disabled={isProcessing || (currentPlan !== 'TRIAL' && currentPlan !== 'NONE')}
                >
                    {isProcessing ? (
                        <>
                            <Loader2 className="animate-spin" size={18} />
                            Processing...
                        </>
                    ) : (
                        <>
                            <Crown size={18} />
                            Subscribe to {selectedPlan === 'MONTHLY' ? 'Monthly' : 'Quarterly'}
                        </>
                    )}
                </button>

                <p className="pricing-note">
                    Secure payment powered by Razorpay. Cancel anytime from your profile.
                </p>
            </div>
        </div>
    );
}
