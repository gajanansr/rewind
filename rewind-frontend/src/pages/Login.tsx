import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { supabase } from '../lib/supabase';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [mode, setMode] = useState<'signin' | 'signup'>('signin');
    const [message, setMessage] = useState('');

    const setAuth = useAuthStore((state) => state.setAuth);
    const navigate = useNavigate();

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
            <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
                <div className="text-center mb-lg">
                    <h1 style={{
                        fontSize: '2rem',
                        background: 'linear-gradient(135deg, var(--color-accent), #8b5cf6)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text'
                    }}>
                        🔄 Rewind
                    </h1>
                    <p className="text-muted mt-sm">
                        Train your thinking for technical interviews
                    </p>
                </div>

                {error && (
                    <div style={{
                        padding: 'var(--spacing-md)',
                        background: 'rgba(239, 68, 68, 0.15)',
                        borderRadius: 'var(--radius-md)',
                        color: 'var(--color-error)',
                        marginBottom: 'var(--spacing-md)'
                    }}>
                        {error}
                    </div>
                )}

                {message && (
                    <div style={{
                        padding: 'var(--spacing-md)',
                        background: 'rgba(34, 197, 94, 0.15)',
                        borderRadius: 'var(--radius-md)',
                        color: 'var(--color-success)',
                        marginBottom: 'var(--spacing-md)'
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
                            fontSize: '0.875rem'
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

                    <div className="mb-lg">
                        <label style={{
                            display: 'block',
                            marginBottom: 'var(--spacing-xs)',
                            color: 'var(--color-text-secondary)',
                            fontSize: '0.875rem'
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

                    <button
                        type="submit"
                        className="btn btn-primary btn-lg"
                        style={{ width: '100%' }}
                        disabled={isLoading}
                    >
                        {isLoading ? (mode === 'signup' ? 'Creating account...' : 'Signing in...') : (mode === 'signup' ? 'Create Account' : 'Sign In')}
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
                                    textDecoration: 'underline'
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
                                    textDecoration: 'underline'
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

