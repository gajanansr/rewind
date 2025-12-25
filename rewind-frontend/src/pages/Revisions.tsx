import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import type { RevisionScheduleResponse } from '../api/client';

export default function Revisions() {
    const [selectedRevision, setSelectedRevision] = useState<RevisionScheduleResponse | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const { data: revisions = [], isLoading } = useQuery({
        queryKey: ['revisions-today'],
        queryFn: () => api.getTodayRevisions(),
        retry: false,
    });

    // Complete revision mutation
    const completeMutation = useMutation({
        mutationFn: (scheduleId: string) => api.completeRevision(scheduleId, {
            listenedVersion: selectedRevision?.lastRecording?.version || 1,
            rerecorded: false,
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['revisions-today'] });
            queryClient.invalidateQueries({ queryKey: ['readiness'] });
            setSelectedRevision(null);
        },
    });

    const getReasonLabel = (reason: string) => {
        switch (reason) {
            case 'LOW_CONFIDENCE': return '⚠️ Low confidence';
            case 'TIME_DECAY': return '⏰ Time to revisit';
            case 'PATTERN_WEAKNESS': return '📊 Pattern weakness';
            default: return reason;
        }
    };

    const handlePlayPause = (e: React.MouseEvent, audioUrl?: string) => {
        e.stopPropagation();
        if (audioRef.current && audioUrl) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.src = audioUrl;
                audioRef.current.play();
            }
            setIsPlaying(!isPlaying);
        } else {
            setIsPlaying(!isPlaying);
        }
    };

    const handleReRecord = (e: React.MouseEvent, questionId: string) => {
        e.stopPropagation();
        navigate(`/solve/${questionId}`);
    };

    const handleMarkReviewed = (e: React.MouseEvent, scheduleId: string) => {
        e.stopPropagation();
        completeMutation.mutate(scheduleId);
    };

    return (
        <div className="page">
            <h1 className="mb-lg">Today's Revisions</h1>

            <p className="text-muted mb-lg">
                Listen to your past explanations and reinforce your understanding.
                Re-record if you can explain it better now.
            </p>

            {/* Hidden audio element for playback */}
            <audio
                ref={audioRef}
                onEnded={() => setIsPlaying(false)}
                style={{ display: 'none' }}
            />

            {isLoading ? (
                <div className="text-center text-muted">Loading revisions...</div>
            ) : revisions.length === 0 ? (
                <div className="card text-center" style={{ padding: 'var(--spacing-2xl)' }}>
                    <div style={{ fontSize: '3rem', marginBottom: 'var(--spacing-md)' }}>🎯</div>
                    <h2>No Revisions Today</h2>
                    <p className="text-muted mt-md">
                        You're all caught up! Keep solving new problems to build your revision queue.
                    </p>
                </div>
            ) : (
                <div className="flex flex-col gap-md">
                    {revisions.map((revision) => (
                        <div
                            key={revision.scheduleId}
                            className={`card ${selectedRevision?.scheduleId === revision.scheduleId ? 'selected' : ''}`}
                            style={{
                                cursor: 'pointer',
                                borderColor: selectedRevision?.scheduleId === revision.scheduleId
                                    ? 'var(--color-accent)'
                                    : undefined
                            }}
                            onClick={() => setSelectedRevision(revision)}
                        >
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3>{revision.question.title}</h3>
                                    <div className="flex gap-sm mt-sm">
                                        <span className={`badge badge-${revision.question.difficulty.toLowerCase()}`}>
                                            {revision.question.difficulty}
                                        </span>
                                        <span className="badge badge-pattern">{revision.question.pattern}</span>
                                        <span className="text-muted" style={{ fontSize: '0.875rem' }}>
                                            {getReasonLabel(revision.reason)}
                                        </span>
                                    </div>
                                </div>

                                <div className="text-right">
                                    <div className="text-muted" style={{ fontSize: '0.875rem' }}>
                                        Last practiced
                                    </div>
                                    <div style={{ fontWeight: 600 }}>
                                        {revision.daysSinceLastPractice} days ago
                                    </div>
                                </div>
                            </div>

                            {/* Expanded view when selected */}
                            {selectedRevision?.scheduleId === revision.scheduleId && (
                                <div className="mt-lg" style={{ borderTop: '1px solid var(--color-bg-tertiary)', paddingTop: 'var(--spacing-lg)' }}>
                                    <h4 className="mb-md">Listen to your explanation</h4>

                                    {/* Audio player */}
                                    {revision.lastRecording?.audioUrl ? (
                                        <div className="flex items-center gap-md mb-lg" style={{
                                            background: 'var(--color-bg-secondary)',
                                            padding: 'var(--spacing-md)',
                                            borderRadius: 'var(--radius-md)'
                                        }}>
                                            <button
                                                className="btn btn-primary btn-icon"
                                                onClick={(e) => handlePlayPause(e, revision.lastRecording?.audioUrl)}
                                            >
                                                {isPlaying ? '⏸️' : '▶️'}
                                            </button>
                                            <div className="progress-bar" style={{ flex: 1 }}>
                                                <div className="progress-bar-fill" style={{ width: isPlaying ? '30%' : '0%' }} />
                                            </div>
                                            <span className="text-muted" style={{ fontSize: '0.875rem' }}>
                                                Version {revision.lastRecording?.version}
                                            </span>
                                        </div>
                                    ) : (
                                        <p className="text-muted mb-lg">No recording available</p>
                                    )}

                                    <div className="flex gap-md">
                                        <button
                                            className="btn btn-secondary"
                                            onClick={(e) => handleReRecord(e, revision.question.id)}
                                        >
                                            Re-record Explanation
                                        </button>
                                        <button
                                            className="btn btn-primary"
                                            onClick={(e) => handleMarkReviewed(e, revision.scheduleId)}
                                            disabled={completeMutation.isPending}
                                        >
                                            {completeMutation.isPending ? 'Saving...' : 'Mark as Reviewed ✓'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

