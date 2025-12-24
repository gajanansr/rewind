import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const setAuth = useAuthStore((state) => state.setAuth);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            // In production, this would call Supabase Auth
            // For now, simulate login with mock token
            // TODO: Integrate with Supabase Auth

            const mockUser = {
                id: 'demo-user-id',
                email,
                name: email.split('@')[0],
            };

            const mockToken = 'demo-jwt-token';

            setAuth(mockUser, mockToken);
            navigate('/');
        } catch (err) {
            setError('Login failed. Please try again.');
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
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary btn-lg"
                        style={{ width: '100%' }}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <p className="text-center text-muted mt-lg" style={{ fontSize: '0.875rem' }}>
                    Demo mode: Enter any email/password to continue
                </p>
            </div>
        </div>
    );
}
