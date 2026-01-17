import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
    id: string;
    email: string;
    name?: string;
    createdAt?: string;
}

interface AuthState {
    user: User | null;
    accessToken: string | null;
    isAuthenticated: boolean;
    isHydrated: boolean; // Track hydration state

    // Actions
    setAuth: (user: User, token: string) => void;
    logout: () => void;
    signOut: () => void; // Alias for logout
    checkAuth: () => boolean;
    setHydrated: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            accessToken: null,
            isAuthenticated: false,
            isHydrated: false,

            setAuth: (user, token) => {
                localStorage.setItem('access_token', token);
                set({ user, accessToken: token, isAuthenticated: true });
            },

            logout: () => {
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                localStorage.removeItem('auth-storage');
                set({ user: null, accessToken: null, isAuthenticated: false });
            },

            signOut: () => get().logout(),

            checkAuth: () => {
                const token = localStorage.getItem('access_token');
                if (token && !get().isAuthenticated) {
                    // Token exists but state not set - try to restore
                    // In real app, would validate token with server
                    set({ accessToken: token, isAuthenticated: true });
                }
                return !!token;
            },

            setHydrated: () => set({ isHydrated: true }),
        }),
        {
            name: 'rewind-auth',
            partialize: (state) => ({
                user: state.user,
                accessToken: state.accessToken,
                isAuthenticated: state.isAuthenticated
            }),
            onRehydrateStorage: () => (state) => {
                // Called when storage is rehydrated
                state?.setHydrated();
            },
        }
    )
);
