import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { supabase } from '../lib/supabase';

const TARGET_DAY_OPTIONS = [30, 60, 90, 120];

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [targetDays, setTargetDays] = useState(90);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [mode, setMode] = useState<'signin' | 'signup'>('signin');
    const [message, setMessage] = useState('');

    const setAuth = useAuthStore((state) => state.setAuth);
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const isHydrated = useAuthStore((state) => state.isHydrated);
    const navigate = useNavigate();

    // Redirect already authenticated users to dashboard
    useEffect(() => {
        if (isHydrated && isAuthenticated) {
            navigate('/', { replace: true });
        }
    }, [isHydrated, isAuthenticated, navigate]);

    // Show loading while hydrating to prevent flash
    if (!isHydrated) {
        return (
            <div className="page" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="text-muted">Loading...</div>
            </div>
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setMessage('');

        try {
            if (mode === 'signup') {
                // Sign up with email and password
                const { data, error: signUpError } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            target_days: targetDays,
                        }
                    }
                });

                if (signUpError) throw signUpError;

                if (data.user && !data.session) {
                    // Email confirmation required
                    setMessage('Check your email to confirm your account!');
                    return;
                }

                if (data.session && data.user) {
                    setAuth(
                        {
                            id: data.user.id,
                            email: data.user.email || email,
                            name: data.user.email?.split('@')[0],
                        },
                        data.session.access_token
                    );
                    navigate('/');
                }
            } else {
                // Sign in with email and password
                const { data, error: signInError } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });

                if (signInError) throw signInError;

                if (data.session && data.user) {
                    setAuth(
                        {
                            id: data.user.id,
                            email: data.user.email || email,
                            name: data.user.email?.split('@')[0],
                        },
                        data.session.access_token
                    );
                    navigate('/');
                }
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Authentication failed';
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="page" style={{
            minHeight: '80vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        }}>
            <div className="card" style={{ width: '100%', maxWidth: '420px' }}>
                <div className="text-center mb-lg">
                    <h1 style={{
                        fontSize: '2rem',
                        fontWeight: 700,
                        color: 'var(--color-text-primary)',
                    }}>
                        Rewind
                    </h1>
                    <p className="text-muted mt-sm">
                        Train your thinking for FAANG interviews
                    </p>
                </div>

                {error && (
                    <div style={{
                        padding: 'var(--spacing-md)',
                        background: 'rgba(239, 68, 68, 0.15)',
                        borderRadius: 'var(--radius-md)',
                        color: 'var(--color-error)',
                        marginBottom: 'var(--spacing-md)',
                        fontSize: '0.875rem'
                    }}>
                        {error}
                    </div>
                )}

                {message && (
                    <div style={{
                        padding: 'var(--spacing-md)',
                        background: 'rgba(16, 185, 129, 0.15)',
                        borderRadius: 'var(--radius-md)',
                        color: 'var(--color-success)',
                        marginBottom: 'var(--spacing-md)',
                        fontSize: '0.875rem'
                    }}>
                        {message}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="mb-md">
                        <label style={{
                            display: 'block',
                            marginBottom: 'var(--spacing-xs)',
                            color: 'var(--color-text-secondary)',
                            fontSize: '0.875rem',
                            fontWeight: 500
                        }}>
                            Email
                        </label>
                        <input
                            type="email"
                            className="input"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            required
                        />
                    </div>

                    <div className="mb-md">
                        <label style={{
                            display: 'block',
                            marginBottom: 'var(--spacing-xs)',
                            color: 'var(--color-text-secondary)',
                            fontSize: '0.875rem',
                            fontWeight: 500
                        }}>
                            Password
                        </label>
                        <input
                            type="password"
                            className="input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            minLength={6}
                        />
                    </div>

                    {/* Target Days - Only show during signup */}
                    {mode === 'signup' && (
                        <div className="mb-lg">
                            <label style={{
                                display: 'block',
                                marginBottom: 'var(--spacing-sm)',
                                color: 'var(--color-text-secondary)',
                                fontSize: '0.875rem',
                                fontWeight: 500
                            }}>
                                How many days to prepare?
                            </label>
                            <div className="target-days-selector">
                                {TARGET_DAY_OPTIONS.map((days) => (
                                    <button
                                        key={days}
                                        type="button"
                                        className={`target-day-btn ${targetDays === days ? 'active' : ''}`}
                                        onClick={() => setTargetDays(days)}
                                    >
                                        {days}
                                    </button>
                                ))}
                            </div>
                            <p className="text-muted" style={{ fontSize: '0.75rem', marginTop: 'var(--spacing-xs)' }}>
                                Target: Clear all 169 questions in {targetDays} days
                            </p>
                        </div>
                    )}

                    <button
                        type="submit"
                        className="btn btn-primary btn-lg"
                        style={{ width: '100%' }}
                        disabled={isLoading}
                    >
                        {isLoading ? (mode === 'signup' ? 'Creating account...' : 'Signing in...') : (mode === 'signup' ? 'Start Your Journey' : 'Sign In')}
                    </button>
                </form>

                <p className="text-center text-muted mt-lg" style={{ fontSize: '0.875rem' }}>
                    {mode === 'signin' ? (
                        <>
                            Don't have an account?{' '}
                            <button
                                type="button"
                                onClick={() => { setMode('signup'); setError(''); setMessage(''); }}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--color-accent)',
                                    cursor: 'pointer',
                                    fontWeight: 500
                                }}
                            >
                                Sign up
                            </button>
                        </>
                    ) : (
                        <>
                            Already have an account?{' '}
                            <button
                                type="button"
                                onClick={() => { setMode('signin'); setError(''); setMessage(''); }}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--color-accent)',
                                    cursor: 'pointer',
                                    fontWeight: 500
                                }}
                            >
                                Sign in
                            </button>
                        </>
                    )}
                </p>
            </div>
        </div>
    );
}
