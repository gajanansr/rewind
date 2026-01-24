import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '../api/client';

interface SubscriptionState {
    // Subscription data
    isActive: boolean;
    plan: 'TRIAL' | 'MONTHLY' | 'QUARTERLY' | 'NONE';
    daysRemaining: number;
    expiresAt: string | null;
    startsAt: string | null;
    isTrial: boolean;

    // Loading state
    isLoading: boolean;
    error: string | null;
    lastFetched: number | null;

    // Actions
    fetchSubscription: () => Promise<void>;
    clearSubscription: () => void;
    setSubscription: (data: Partial<SubscriptionState>) => void;
}

export const useSubscriptionStore = create<SubscriptionState>()(
    persist(
        (set, get) => ({
            // Initial state
            isActive: false,
            plan: 'NONE',
            daysRemaining: 0,
            expiresAt: null,
            startsAt: null,
            isTrial: false,
            isLoading: false,
            error: null,
            lastFetched: null,

            // Fetch subscription status from API
            fetchSubscription: async () => {
                // Don't fetch if we fetched within last 60 seconds
                const now = Date.now();
                const lastFetched = get().lastFetched;
                if (lastFetched && now - lastFetched < 60000) {
                    return;
                }

                set({ isLoading: true, error: null });

                try {
                    const response = await api.getSubscriptionStatus();
                    set({
                        isActive: response.active,
                        plan: response.plan as SubscriptionState['plan'],
                        daysRemaining: response.daysRemaining,
                        expiresAt: response.expiresAt,
                        startsAt: response.startsAt,
                        isTrial: response.isTrial,
                        isLoading: false,
                        lastFetched: now,
                    });
                } catch (error) {
                    set({
                        isLoading: false,
                        error: error instanceof Error ? error.message : 'Failed to fetch subscription',
                    });
                }
            },

            // Clear subscription (on logout)
            clearSubscription: () => {
                set({
                    isActive: false,
                    plan: 'NONE',
                    daysRemaining: 0,
                    expiresAt: null,
                    startsAt: null,
                    isTrial: false,
                    isLoading: false,
                    error: null,
                    lastFetched: null,
                });
            },

            // Manual set (after payment success)
            setSubscription: (data) => {
                set({ ...data, lastFetched: Date.now() });
            },
        }),
        {
            name: 'rewind-subscription',
            partialize: (state) => ({
                isActive: state.isActive,
                plan: state.plan,
                daysRemaining: state.daysRemaining,
                expiresAt: state.expiresAt,
                isTrial: state.isTrial,
            }),
        }
    )
);

// Helper hooks
export const useIsSubscribed = () => useSubscriptionStore((s) => s.isActive);
export const useIsTrialUser = () => useSubscriptionStore((s) => s.isTrial && s.isActive);
export const useDaysRemaining = () => useSubscriptionStore((s) => s.daysRemaining);
export const useSubscriptionPlan = () => useSubscriptionStore((s) => s.plan);
