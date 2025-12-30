import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { useAudioRecorder } from '../hooks/useAudioRecorder';

type Step = 'history' | 'start' | 'solve' | 'code' | 'record' | 'done';

export default function Solve() {
    const { questionId } = useParams<{ questionId: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [step, setStep] = useState<Step>('start');
    const [code, setCode] = useState('');
    const [language, setLanguage] = useState('python');
    const [leetcodeLink, setLeetcodeLink] = useState('');
    const [confidenceScore, setConfidenceScore] = useState<number>(3);
    const [userQuestionId, setUserQuestionId] = useState<string | null>(null);
    const [_recordingId, setRecordingId] = useState<string | null>(null);
    const [aiFeedback, setAiFeedback] = useState<Array<{ type: string; message: string }>>([]);
    const [error, setError] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const recorder = useAudioRecorder();

    // Fetch question data from API
    const { data: question, isLoading: questionLoading } = useQuery({
        queryKey: ['question', questionId],
        queryFn: () => api.getQuestion(questionId!),
        enabled: !!questionId,
    });

    // Fetch question history (previous solutions, recordings)
    const { data: history, isLoading: historyLoading } = useQuery({
        queryKey: ['question-history', questionId],
        queryFn: () => api.getQuestionHistory(questionId!),
        enabled: !!questionId,
        retry: false, // Don't retry if user hasn't started this question
    });

    // Determine if this question was already solved
    const hasPreviousSolve = history?.userQuestion?.status === 'DONE';
    const latestSolution = history?.solutions?.[0];
    const latestRecording = history?.recordings?.[0];

    // Start question mutation
    const startMutation = useMutation({
        mutationFn: () => api.startQuestion(questionId!),
        onSuccess: (data) => {
            setUserQuestionId(data.id);
            setStep('solve');
            window.open(question?.leetcodeUrl, '_blank');
        },
        onError: (err) => {
            setError(err instanceof Error ? err.message : 'Failed to start question');
        },
    });

    // Submit solution mutation
    const submitSolutionMutation = useMutation({
        mutationFn: () => api.submitSolution({
            userQuestionId: userQuestionId!,
            code,
            language,
            leetcodeSubmissionLink: leetcodeLink || undefined,
        }),
        onSuccess: () => {
            setStep('record');
        },
        onError: (err) => {
            setError(err instanceof Error ? err.message : 'Failed to submit solution');
        },
    });

    // Save recording mutation
    const saveRecordingMutation = useMutation({
        mutationFn: async () => {
            if (!userQuestionId) throw new Error('User Question ID is missing');

            // If we have a blob (new recording), upload it
            if (recorder.audioBlob) {
                // 1. Get upload URL
                const { uploadUrl } = await api.getUploadUrl({
                    userQuestionId,
                    contentType: 'audio/webm',
                    durationSeconds: recorder.duration,
                });

                // 2. Upload file
                await api.uploadFile(uploadUrl, recorder.audioBlob, 'audio/webm');

                // 3. Construct public URL (assuming public bucket 'audio')
                // uploadUrl is like .../object/audio/...
                // publicUrl is like .../object/public/audio/...
                const publicUrl = uploadUrl.replace('/object/audio/', '/object/public/audio/');

                // 4. Save metadata
                return api.saveRecording({
                    userQuestionId,
                    audioUrl: publicUrl,
                    durationSeconds: recorder.duration,
                    confidenceScore,
                });
            } else {
                // Fallback for logic without recording (shouldn't happen in this step but safe to keep)
                return api.saveRecording({
                    userQuestionId,
                    audioUrl: '',
                    durationSeconds: recorder.duration,
                    confidenceScore,
                });
            }
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['user-questions'] });
            queryClient.invalidateQueries({ queryKey: ['status-map'] }); // Force refresh of questions list status
            queryClient.invalidateQueries({ queryKey: ['readiness'] });
            queryClient.invalidateQueries({ queryKey: ['question-history', questionId] });
            setRecordingId(data.recordingId);
            // Trigger AI analysis
            if (data.recordingId) {
                analyzeMutation.mutate(data.recordingId);
            }
            setStep('done');
        },
        onError: (err) => {
            setError(err instanceof Error ? err.message : 'Failed to save recording');
        },
    });

    // Analyze recording for AI feedback
    const analyzeMutation = useMutation({
        mutationFn: (recId: string) => api.request<{ feedback: Array<{ type: string; message: string }> }>(
            `/recordings/${recId}/analyze`,
            { method: 'POST' }
        ),
        onSuccess: (data) => {
            console.log('AI Feedback received:', data);
            setAiFeedback(data.feedback || []);
        },
        onError: (err) => {
            console.error('AI analysis failed:', err);
            setAiFeedback([{
                type: 'HINT',
                message: 'AI analysis is currently unavailable. The API key may not be configured on the server.'
            }]);
        },
    });

    // Loading state
    if (questionLoading || historyLoading || !question) {
        return (
            <div className="page text-center" style={{ paddingTop: 'var(--spacing-2xl)' }}>
                <div className="text-muted">Loading question...</div>
            </div>
        );
    }

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleStartSolving = () => {
        setError(null);
        startMutation.mutate();
    };

    const handleSolveAgain = () => {
        setCode('');
        setLanguage('python');
        setLeetcodeLink('');
        setAiFeedback([]);
        handleStartSolving();
    };

    const handleSubmitCode = () => {
        setError(null);
        if (userQuestionId) {
            submitSolutionMutation.mutate();
        } else {
            setStep('record');
        }
    };

    const handleSaveRecording = () => {
        setError(null);
        if (userQuestionId && recorder.audioUrl) {
            saveRecordingMutation.mutate();
        } else {
            setStep('done');
        }
    };

    const handlePlayAudio = (audioUrl: string) => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
                setIsPlaying(false);
            } else {
                audioRef.current.src = audioUrl;
                audioRef.current.play();
                setIsPlaying(true);
            }
        }
    };

    const isLoading = startMutation.isPending || submitSolutionMutation.isPending || saveRecordingMutation.isPending;

    return (
        <div className="page">
            {/* Hidden audio element */}
            <audio ref={audioRef} onEnded={() => setIsPlaying(false)} style={{ display: 'none' }} />

            {/* Error Display */}
            {error && (
                <div className="card mb-lg" style={{
                    background: 'rgba(239, 68, 68, 0.15)',
                    borderColor: 'var(--color-error)',
                }}>
                    <p style={{ color: 'var(--color-error)', margin: 0 }}>{error}</p>
                </div>
            )}

            {/* Question Header */}
            <div className="card mb-lg">
                <div className="flex justify-between items-center">
                    <div>
                        <h1>{question.title}</h1>
                        <div className="flex gap-sm mt-sm">
                            <span className={`badge badge-${question.difficulty.toLowerCase()}`}>
                                {question.difficulty}
                            </span>
                            <span className="badge badge-pattern">{question.pattern.name}</span>
                            {hasPreviousSolve && (
                                <span className="badge" style={{ background: 'rgba(34, 197, 94, 0.2)', color: 'var(--color-success)' }}>
                                    ✓ Solved
                                </span>
                            )}
                        </div>
                    </div>
                    <a
                        href={question.leetcodeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-primary"
                    >
                        Open in LeetCode ↗
                    </a>
                </div>
            </div>

            {/* Previous Solution (if exists) */}
            {hasPreviousSolve && step === 'start' && (
                <div className="mb-lg">
                    {/* Previous Code */}
                    {latestSolution && (
                        <div className="card mb-md">
                            <div className="flex justify-between items-center mb-md">
                                <h3>📝 Your Previous Solution</h3>
                                <span className="badge">{latestSolution.language}</span>
                            </div>
                            <div style={{
                                background: '#1a1a2e',
                                borderRadius: 'var(--radius-lg)',
                                padding: 'var(--spacing-md)',
                                overflow: 'auto',
                                maxHeight: '300px',
                            }}>
                                <pre style={{
                                    margin: 0,
                                    color: '#e4e4e7',
                                    fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
                                    fontSize: '13px',
                                    lineHeight: 1.6,
                                    whiteSpace: 'pre-wrap',
                                }}>
                                    {latestSolution.code}
                                </pre>
                            </div>
                            <p className="text-muted mt-sm" style={{ fontSize: '0.75rem' }}>
                                Submitted on {new Date(latestSolution.createdAt).toLocaleDateString()}
                            </p>
                        </div>
                    )}

                    {/* Previous Recording */}
                    {latestRecording && (
                        <div className="card mb-md">
                            <h3 className="mb-md">🎙️ Your Previous Explanation</h3>
                            <div className="flex gap-md items-center">
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => handlePlayAudio(latestRecording.audioUrl)}
                                >
                                    {isPlaying ? '⏸️ Pause' : '▶️ Play'}
                                </button>
                                <span className="text-muted">
                                    {formatTime(latestRecording.durationSeconds)} • Version {latestRecording.version}
                                </span>
                            </div>
                            {latestRecording.transcript && (
                                <div className="mt-md" style={{
                                    background: 'var(--color-bg-tertiary)',
                                    borderRadius: 'var(--radius-md)',
                                    padding: 'var(--spacing-md)',
                                }}>
                                    <p className="text-muted" style={{ fontSize: '0.875rem', margin: 0 }}>
                                        <strong>Transcript:</strong> {latestRecording.transcript}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* AI Feedback from previous analysis */}
                    {history?.userQuestion?.id && (
                        <AIFeedbackSection userQuestionId={history.userQuestion.id} />
                    )}

                    {/* Actions */}
                    <div className="card text-center" style={{ padding: 'var(--spacing-xl)' }}>
                        <h3 className="mb-md">Ready to improve?</h3>
                        <p className="text-muted mb-lg">
                            Solve again to reinforce your understanding and improve your explanation.
                        </p>
                        <button
                            className="btn btn-primary btn-lg"
                            onClick={handleSolveAgain}
                            disabled={isLoading}
                        >
                            🔄 Solve Again
                        </button>
                    </div>
                </div>
            )}

            {/* Step: Start (First time) */}
            {!hasPreviousSolve && step === 'start' && (
                <div className="card text-center" style={{ padding: 'var(--spacing-2xl)' }}>
                    <h2 className="mb-md">Ready to solve?</h2>
                    <p className="text-muted mb-lg">
                        Click the button below to start the timer and begin solving on LeetCode.
                    </p>
                    <button
                        className="btn btn-primary btn-lg"
                        onClick={handleStartSolving}
                        disabled={isLoading}
                    >
                        {startMutation.isPending ? 'Starting...' : 'Start Solving'}
                    </button>
                </div>
            )}

            {/* Step: Solving */}
            {step === 'solve' && (
                <div className="card text-center" style={{ padding: 'var(--spacing-2xl)' }}>
                    <h2 className="mb-md">Solving...</h2>
                    <p className="text-muted mb-lg">
                        Solve the problem on LeetCode. When you're done, paste your solution below.
                    </p>
                    <button
                        className="btn btn-primary btn-lg"
                        onClick={() => setStep('code')}
                    >
                        I've Solved It
                    </button>
                </div>
            )}

            {/* Step: Paste Code */}
            {step === 'code' && (
                <div className="card">
                    <h2 className="mb-md">Paste Your Solution</h2>

                    <div className="mb-md">
                        <label className="text-muted" style={{ display: 'block', marginBottom: 'var(--spacing-xs)' }}>
                            Language
                        </label>
                        <select
                            className="input"
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                            style={{ maxWidth: '200px' }}
                        >
                            <option value="python">Python</option>
                            <option value="javascript">JavaScript</option>
                            <option value="typescript">TypeScript</option>
                            <option value="java">Java</option>
                            <option value="cpp">C++</option>
                            <option value="go">Go</option>
                        </select>
                    </div>

                    <div className="mb-md">
                        <label className="text-muted" style={{ display: 'block', marginBottom: 'var(--spacing-xs)' }}>
                            Solution Code
                        </label>
                        <div style={{
                            position: 'relative',
                            background: '#1a1a2e',
                            borderRadius: 'var(--radius-lg)',
                            border: '1px solid var(--color-bg-tertiary)',
                            overflow: 'hidden',
                        }}>
                            {/* Language badge */}
                            <div style={{
                                position: 'absolute',
                                top: '8px',
                                right: '12px',
                                background: 'rgba(59, 130, 246, 0.2)',
                                color: 'var(--color-accent)',
                                padding: '2px 10px',
                                borderRadius: 'var(--radius-sm)',
                                fontSize: '0.75rem',
                                fontWeight: 500,
                                textTransform: 'uppercase',
                                zIndex: 1,
                            }}>
                                {language}
                            </div>

                            {/* Code editor */}
                            <textarea
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                placeholder="// Paste your solution code here..."
                                spellCheck={false}
                                style={{
                                    width: '100%',
                                    minHeight: '300px',
                                    padding: '16px 60px 16px 16px',
                                    background: 'transparent',
                                    border: 'none',
                                    outline: 'none',
                                    color: '#e4e4e7',
                                    fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
                                    fontSize: '14px',
                                    lineHeight: '1.6',
                                    resize: 'vertical',
                                    tabSize: 4,
                                }}
                            />

                            {/* Line count indicator */}
                            <div style={{
                                position: 'absolute',
                                bottom: '8px',
                                left: '12px',
                                color: 'var(--color-text-muted)',
                                fontSize: '0.75rem',
                            }}>
                                {code.split('\n').length} lines
                            </div>
                        </div>
                    </div>

                    <div className="mb-lg">
                        <label className="text-muted" style={{ display: 'block', marginBottom: 'var(--spacing-xs)' }}>
                            LeetCode Submission Link (optional)
                        </label>
                        <input
                            type="url"
                            className="input"
                            value={leetcodeLink}
                            onChange={(e) => setLeetcodeLink(e.target.value)}
                            placeholder="https://leetcode.com/submissions/detail/..."
                        />
                    </div>

                    <button
                        className="btn btn-primary btn-lg"
                        onClick={handleSubmitCode}
                        disabled={isLoading || !code.trim()}
                    >
                        {submitSolutionMutation.isPending ? 'Saving...' : 'Next: Record Explanation'}
                    </button>
                </div>
            )}

            {/* Step: Record */}
            {step === 'record' && (
                <div className="card text-center" style={{ padding: 'var(--spacing-2xl)' }}>
                    <h2 className="mb-md">Record Your Explanation</h2>
                    <p className="text-muted mb-lg">
                        Explain your solution out loud. Walk through your thought process,
                        the approach you took, and why it works.
                    </p>

                    {!recorder.isRecording && !recorder.audioUrl && (
                        <button
                            className="btn btn-primary btn-lg"
                            onClick={recorder.startRecording}
                        >
                            🎙️ Start Recording
                        </button>
                    )}

                    {recorder.isRecording && (
                        <div>
                            <div style={{
                                fontSize: '3rem',
                                fontFamily: 'var(--font-mono)',
                                marginBottom: 'var(--spacing-md)',
                                color: 'var(--color-error)',
                            }}>
                                ⏺️ {formatTime(recorder.duration)}
                            </div>
                            <button
                                className="btn btn-secondary btn-lg"
                                onClick={recorder.stopRecording}
                            >
                                ⏹️ Stop Recording
                            </button>
                        </div>
                    )}

                    {recorder.audioUrl && !recorder.isRecording && (
                        <div>
                            <div style={{ marginBottom: 'var(--spacing-md)' }}>
                                <audio
                                    controls
                                    src={recorder.audioUrl}
                                    style={{ maxWidth: '100%' }}
                                />
                            </div>
                            <p className="text-muted mb-md">
                                Duration: {formatTime(recorder.duration)}
                            </p>

                            <div className="flex gap-md justify-center mb-lg">
                                <button
                                    className="btn btn-ghost"
                                    onClick={recorder.startRecording}
                                >
                                    Re-record
                                </button>
                            </div>

                            {/* Confidence Score */}
                            <div className="mb-md">
                                <label className="text-muted mb-sm" style={{ display: 'block' }}>
                                    How confident are you in your explanation?
                                </label>
                                <div className="flex gap-sm justify-center">
                                    {[1, 2, 3, 4, 5].map((score) => (
                                        <button
                                            key={score}
                                            className={`btn ${confidenceScore === score ? 'btn-primary' : 'btn-secondary'}`}
                                            onClick={() => setConfidenceScore(score)}
                                            style={{ width: '50px' }}
                                        >
                                            {score}
                                        </button>
                                    ))}
                                </div>
                                <p className="text-muted mt-sm" style={{ fontSize: '0.75rem' }}>
                                    1 = Not confident, 5 = Very confident
                                </p>
                            </div>

                            <button
                                className="btn btn-primary btn-lg mt-md"
                                onClick={handleSaveRecording}
                                disabled={isLoading}
                            >
                                {saveRecordingMutation.isPending ? 'Saving...' : 'Save & Complete'}
                            </button>
                        </div>
                    )}

                    {recorder.error && (
                        <p style={{ color: 'var(--color-error)' }}>{recorder.error}</p>
                    )}
                </div>
            )}

            {/* Step: Done */}
            {step === 'done' && (
                <div className="card text-center" style={{ padding: 'var(--spacing-2xl)' }}>
                    <div style={{ fontSize: '4rem', marginBottom: 'var(--spacing-md)' }}>🎉</div>
                    <h2 className="mb-md">Question Complete!</h2>
                    <p className="text-muted mb-lg">
                        Great job! Your solution and explanation have been saved.
                        You'll be reminded to review this in a few days.
                    </p>

                    {/* AI Feedback Section */}
                    {analyzeMutation.isPending && (
                        <div className="text-muted mb-lg">
                            <span>🤖 Analyzing your solution...</span>
                        </div>
                    )}

                    {aiFeedback.length > 0 && (
                        <div className="mb-lg" style={{ textAlign: 'left' }}>
                            <h3 className="mb-md" style={{ textAlign: 'center' }}>🤖 AI Feedback</h3>
                            <div className="flex flex-col gap-md">
                                {aiFeedback.map((fb, i) => (
                                    <div key={i} className="card" style={{
                                        background: fb.type === 'HINT'
                                            ? 'rgba(59, 130, 246, 0.1)'
                                            : fb.type === 'REFLECTION_QUESTION'
                                                ? 'rgba(139, 92, 246, 0.1)'
                                                : 'rgba(34, 197, 94, 0.1)',
                                        border: 'none',
                                        padding: 'var(--spacing-md)',
                                    }}>
                                        <div className="flex gap-sm items-center mb-sm">
                                            <span style={{ fontSize: '1.25rem' }}>
                                                {fb.type === 'HINT' && '💡'}
                                                {fb.type === 'REFLECTION_QUESTION' && '🤔'}
                                                {fb.type === 'COMMUNICATION_TIP' && '💬'}
                                            </span>
                                            <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                                                {fb.type === 'HINT' && 'Solution Feedback'}
                                                {fb.type === 'REFLECTION_QUESTION' && 'Reflection Question'}
                                                {fb.type === 'COMMUNICATION_TIP' && 'Communication Tip'}
                                            </span>
                                        </div>
                                        <p style={{ margin: 0, color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                                            {fb.message}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex gap-md justify-center">
                        <button
                            className="btn btn-secondary"
                            onClick={() => navigate('/questions')}
                        >
                            More Questions
                        </button>
                        <button
                            className="btn btn-primary"
                            onClick={() => navigate('/')}
                        >
                            View Dashboard
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// Component to fetch and display AI feedback for a user question
function AIFeedbackSection({ userQuestionId }: { userQuestionId: string }) {
    const { data: feedback, isLoading } = useQuery({
        queryKey: ['ai-feedback', userQuestionId],
        queryFn: async () => {
            // Try to get the latest recording for this user question
            const history = await api.getQuestionHistory(userQuestionId);
            if (history.recordings?.[0]?.id) {
                try {
                    const result = await api.getFeedback(history.recordings[0].id);
                    return result.feedback || [];
                } catch {
                    return [];
                }
            }
            return [];
        },
        enabled: !!userQuestionId,
        retry: false,
    });

    if (isLoading) {
        return (
            <div className="card mb-md text-center">
                <p className="text-muted">Loading AI feedback...</p>
            </div>
        );
    }

    if (!feedback || feedback.length === 0) {
        return null;
    }

    return (
        <div className="card mb-md">
            <h3 className="mb-md">🤖 AI Feedback</h3>
            <div className="flex flex-col gap-md">
                {feedback.map((fb, i) => (
                    <div key={i} style={{
                        background: fb.type === 'HINT'
                            ? 'rgba(59, 130, 246, 0.1)'
                            : fb.type === 'REFLECTION_QUESTION'
                                ? 'rgba(139, 92, 246, 0.1)'
                                : 'rgba(34, 197, 94, 0.1)',
                        borderRadius: 'var(--radius-md)',
                        padding: 'var(--spacing-md)',
                    }}>
                        <div className="flex gap-sm items-center mb-sm">
                            <span style={{ fontSize: '1.25rem' }}>
                                {fb.type === 'HINT' && '💡'}
                                {fb.type === 'REFLECTION_QUESTION' && '🤔'}
                                {fb.type === 'COMMUNICATION_TIP' && '💬'}
                            </span>
                            <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                                {fb.type === 'HINT' && 'Solution Feedback'}
                                {fb.type === 'REFLECTION_QUESTION' && 'Reflection Question'}
                                {fb.type === 'COMMUNICATION_TIP' && 'Communication Tip'}
                            </span>
                        </div>
                        <p style={{ margin: 0, color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                            {fb.message}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}
