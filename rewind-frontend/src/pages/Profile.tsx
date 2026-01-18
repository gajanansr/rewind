import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { api } from '../api/client';
import { startOfDay, differenceInDays } from 'date-fns';
import { Coffee, AlertTriangle } from 'lucide-react';

export default function Profile() {
    const { user, signOut } = useAuthStore();
    const navigate = useNavigate();

    // Reset Modal State
    const [showResetModal, setShowResetModal] = useState(false);
    const [resetConfirmation, setResetConfirmation] = useState('');
    const [isResetting, setIsResetting] = useState(false);

    const handleSignOut = () => {
        signOut();
        navigate('/login');
    };

    const handleHardReset = async () => {
        if (resetConfirmation !== 'please-hard-reset') return;

        try {
            setIsResetting(true);
            await api.resetProgress();
            window.location.reload(); // Reload to clear all state/cache
        } catch (error) {
            console.error('Failed to reset progress:', error);
            alert('Failed to reset progress. Please try again.');
        } finally {
            setIsResetting(false);
            setShowResetModal(false);
        }
    };

    // Calculate account age
    const joinDate = user?.createdAt ? new Date(user.createdAt) : new Date();
    const daysActive = differenceInDays(startOfDay(new Date()), startOfDay(joinDate));

    return (
        <div className="page" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h1 className="mb-xl">Profile & Settings</h1>

            {/* Profile Card */}
            <div className="card mb-lg">
                <div className="flex items-center gap-lg mb-lg">
                    <div
                        className="profile-avatar-lg"
                        style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, var(--color-accent), #8b5cf6)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '2rem',
                            fontWeight: 'bold',
                            color: 'white'
                        }}
                    >
                        {user?.email?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h2 className="text-xl font-bold mb-xs">{user?.email?.split('@')[0]}</h2>
                        <p className="text-muted">{user?.email}</p>
                    </div>
                </div>

                <div className="grid grid-2 gap-md">
                    <div className="bg-tertiary rounded-md" style={{ background: 'var(--color-bg-tertiary)', borderRadius: 'var(--radius-md)', padding: 'var(--spacing-md)' }}>
                        <div className="text-muted text-sm mb-xs">Member Since</div>
                        <div className="font-medium">{joinDate.toLocaleDateString()}</div>
                    </div>
                    <div className="bg-tertiary rounded-md" style={{ background: 'var(--color-bg-tertiary)', borderRadius: 'var(--radius-md)', padding: 'var(--spacing-md)' }}>
                        <div className="text-muted text-sm mb-xs">Days Active</div>
                        <div className="font-medium">{daysActive} days</div>
                    </div>
                </div>
            </div>

            {/* Support Developer Section */}
            <div className="card mb-lg" style={{ borderColor: 'var(--color-accent-soft)' }}>
                <div className="flex items-start gap-md">
                    <div><Coffee size={24} /></div>
                    <div className="flex-1">
                        <h3 className="font-bold mb-sm">Support the Developer</h3>
                        <p className="text-muted mb-md profile-support-text">
                            Rewind is a labor of love. If you find it valuable, consider buying me a coffee!
                        </p>
                        <a
                            href="https://www.buymeacoffee.com/gajanansr"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn"
                            style={{
                                background: '#5F7FFF',
                                color: '#ffffff',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 'var(--spacing-sm)',
                                fontFamily: 'Cookie, cursive',
                                fontSize: '1.1rem'
                            }}
                        >
                            <Coffee size={18} /> Buy me a coffee
                        </a>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="card mb-xl">
                <h3 className="font-bold mb-md">Account Actions</h3>

                <div className="flex flex-col gap-md">
                    <div className="flex justify-between items-center profile-action-row" style={{ borderBottom: '1px solid var(--color-border)', padding: 'var(--spacing-md)' }}>
                        <div>
                            <div className="font-medium">Sign Out</div>
                            <div className="text-sm text-muted">Log out of your account</div>
                        </div>
                        <button onClick={handleSignOut} className="btn btn-secondary">
                            Sign Out
                        </button>
                    </div>

                    {/* Danger Zone */}
                    <div className="flex justify-between items-center profile-action-row" style={{ background: 'rgba(239, 68, 68, 0.05)', borderRadius: 'var(--radius-md)', padding: 'var(--spacing-md)' }}>
                        <div>
                            <div className="font-medium" style={{ color: 'var(--color-error)' }}>Hard Reset</div>
                            <div className="text-sm text-muted">
                                Delete all progress. <strong style={{ color: 'var(--color-error)' }}>Irreversible.</strong>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowResetModal(true)}
                            className="btn"
                            style={{
                                background: 'transparent',
                                border: '1px solid var(--color-error)',
                                color: 'var(--color-error)'
                            }}
                        >
                            Reset
                        </button>
                    </div>
                </div>
            </div>

            {/* Reset Confirmation Modal */}
            {showResetModal && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.8)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                        backdropFilter: 'blur(4px)'
                    }}
                    onClick={() => setShowResetModal(false)}
                >
                    <div
                        className="card"
                        style={{ maxWidth: '400px', width: '90%' }}
                        onClick={e => e.stopPropagation()}
                    >
                        <h3 className="text-xl font-bold mb-md text-error" style={{ color: 'var(--color-error)', display: 'flex', alignItems: 'center', gap: '8px' }}><AlertTriangle size={20} /> Hard Reset</h3>
                        <p className="mb-md">
                            Are you absolutely sure? This will permanently delete:
                        </p>
                        <ul className="mb-lg pl-lg text-muted" style={{ listStyleType: 'disc' }}>
                            <li>All solved questions history</li>
                            <li>Your readiness score and streaks</li>
                            <li>All accumulated code solutions</li>
                            <li>All voice recordings</li>
                        </ul>

                        <div className="mb-lg">
                            <label className="text-sm font-bold mb-xs block">Type "please-hard-reset" to confirm:</label>
                            <input
                                type="text"
                                className="input"
                                value={resetConfirmation}
                                onChange={e => setResetConfirmation(e.target.value)}
                                placeholder="please-hard-reset"
                                autoFocus
                            />
                        </div>

                        <div className="flex justify-end gap-md">
                            <button
                                className="btn btn-ghost"
                                onClick={() => setShowResetModal(false)}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn"
                                disabled={resetConfirmation !== 'please-hard-reset' || isResetting}
                                onClick={handleHardReset}
                                style={{
                                    background: 'var(--color-error)',
                                    color: 'white',
                                    opacity: resetConfirmation === 'please-hard-reset' ? 1 : 0.5,
                                    cursor: resetConfirmation === 'please-hard-reset' ? 'pointer' : 'not-allowed'
                                }}
                            >
                                {isResetting ? 'Resetting...' : 'Confirm Hard Reset'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
