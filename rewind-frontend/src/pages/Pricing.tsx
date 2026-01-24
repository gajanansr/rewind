import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api } from '../api/client';
import { useSubscriptionStore } from '../stores/subscriptionStore';
import { Check, X, Crown, Sparkles, Loader2, AlertCircle } from 'lucide-react';

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
    const [paymentError, setPaymentError] = useState<string | null>(null);
    const { isActive, plan: currentPlan, fetchSubscription } = useSubscriptionStore();

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
                color: '#8b5cf6',
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

    const handleSubscribe = (planId: 'MONTHLY' | 'QUARTERLY') => {
        setPaymentError(null);
        createOrderMutation.mutate(planId);
    };

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

    const plans = [
        {
            id: 'FREE',
            name: 'Free',
            price: '₹0',
            period: 'Forever',
            features: [
                { name: '169 Questions', included: true },
                { name: 'Dashboard Tracking', included: true },
                { name: 'Submit Solutions', included: true },
                { name: 'Voice Recording', included: false },
                { name: 'AI Feedback', included: false },
                { name: 'Learn Patterns', included: false },
                { name: 'Advanced Analytics', included: false },
            ]
        },
        {
            id: 'MONTHLY',
            name: 'Monthly',
            price: '₹149',
            period: '30 Days',
            features: [
                { name: '169 Questions', included: true },
                { name: 'Dashboard Tracking', included: true },
                { name: 'Submit Solutions', included: true },
                { name: 'Voice Recording', included: true },
                { name: 'AI Feedback', included: true },
                { name: 'Learn Patterns', included: true },
                { name: 'Advanced Analytics', included: true },
            ]
        },
        {
            id: 'QUARTERLY',
            name: 'Quarterly',
            price: '₹299',
            period: '90 Days',
            savings: 'Save ₹148',
            popular: true,
            features: [
                { name: '169 Questions', included: true },
                { name: 'Dashboard Tracking', included: true },
                { name: 'Submit Solutions', included: true },
                { name: 'Voice Recording', included: true },
                { name: 'AI Feedback', included: true },
                { name: 'Learn Patterns', included: true },
                { name: 'Advanced Analytics', included: true },
            ]
        }
    ];

    return (
        <div className="page">
            <div className="pricing-container">
                <div className="pricing-header">
                    <h1>Choose Your Plan</h1>
                    <p>Unlock the full power of AI-driven learning.</p>
                </div>

                {paymentError && (
                    <div className="pricing-error mb-lg">
                        <AlertCircle size={18} />
                        {paymentError}
                    </div>
                )}

                <div className="pricing-grid">
                    {plans.map((plan) => (
                        <div key={plan.id} className={`pricing-card ${plan.popular ? 'popular' : ''}`}>
                            {plan.popular && (
                                <div className="pricing-badge">
                                    <Sparkles size={14} />
                                    Best Value
                                </div>
                            )}

                            <div className="pricing-card-header">
                                <h3>{plan.name}</h3>
                                <div className="pricing-price-box">
                                    <span className="price">{plan.price}</span>
                                    <span className="period">/ {plan.period}</span>
                                </div>
                                {plan.savings && <span className="savings-tag">{plan.savings}</span>}
                            </div>

                            <div className="pricing-features-list">
                                {plan.features.map((feature, idx) => (
                                    <div key={idx} className={`feature-item ${feature.included ? '' : 'disabled'}`}>
                                        {feature.included ? <Check size={18} className="icon-check" /> : <X size={18} className="icon-x" />}
                                        <span>{feature.name}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="pricing-action">
                                {plan.id === 'FREE' ? (
                                    <button className="btn btn-secondary btn-full" disabled>
                                        {(currentPlan === 'NONE' || !isActive) ? 'Current Plan' : 'Free Forever'}
                                    </button>
                                ) : (
                                    <button
                                        className={`btn btn-full ${plan.popular ? 'btn-primary' : 'btn-outline'}`}
                                        onClick={() => handleSubscribe(plan.id as 'MONTHLY' | 'QUARTERLY')}
                                        disabled={isProcessing || (isActive && currentPlan === plan.id)}
                                    >
                                        {isProcessing ? (
                                            <Loader2 className="animate-spin" size={18} />
                                        ) : (
                                            isActive && currentPlan === plan.id ? 'Current Plan' : 'Upgrade'
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                <p className="pricing-note text-center mt-xl text-muted">
                    Secure payment powered by Razorpay. 14-day money-back guarantee.
                </p>
            </div>
        </div>
    );
}
