import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { useAudioRecorder } from '../hooks/useAudioRecorder';

type Step = 'start' | 'solve' | 'code' | 'record' | 'done';

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

    const recorder = useAudioRecorder();

    // Fetch question data from API
    const { data: question, isLoading: questionLoading } = useQuery({
        queryKey: ['question', questionId],
        queryFn: () => api.getQuestion(questionId!),
        enabled: !!questionId,
    });

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
        mutationFn: () => api.saveRecording({
            userQuestionId: userQuestionId!,
            audioUrl: recorder.audioUrl || '',
            durationSeconds: recorder.duration,
            confidenceScore,
        }),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['user-questions'] });
            queryClient.invalidateQueries({ queryKey: ['readiness'] });
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
            setAiFeedback(data.feedback || []);
        },
        onError: () => {
            // Silently fail - AI feedback is optional
        },
    });

    // Loading state
    if (questionLoading || !question) {
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

    const handleSubmitCode = () => {
        setError(null);
        if (userQuestionId) {
            submitSolutionMutation.mutate();
        } else {
            // Fallback if no userQuestionId (shouldn't happen, but handle gracefully)
            setStep('record');
        }
    };

    const handleSaveRecording = () => {
        setError(null);
        if (userQuestionId && recorder.audioUrl) {
            saveRecordingMutation.mutate();
        } else {
            // Fallback for demo/testing
            setStep('done');
        }
    };

    const isLoading = startMutation.isPending || submitSolutionMutation.isPending || saveRecordingMutation.isPending;

    return (
        <div className="page">
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

            {/* Step: Start */}
            {step === 'start' && (
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
                        <textarea
                            className="input"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            placeholder="Paste your solution code here..."
                            style={{ fontFamily: 'var(--font-mono)', minHeight: '200px' }}
                        />
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
                        disabled={!code.trim() || isLoading}
                    >
                        {submitSolutionMutation.isPending ? 'Submitting...' : 'Continue to Recording'}
                    </button>
                </div>
            )}

            {/* Step: Record Explanation */}
            {step === 'record' && (
                <div className="audio-recorder">
                    <h2>Explain Your Approach</h2>
                    <p className="text-muted text-center" style={{ maxWidth: '500px' }}>
                        Record yourself explaining your solution. Talk about your approach,
                        time/space complexity, and any edge cases you considered.
                    </p>

                    <div className="recording-timer">
                        {formatTime(recorder.duration)}
                    </div>

                    {!recorder.isRecording && !recorder.audioUrl && (
                        <button
                            className="record-btn"
                            onClick={recorder.startRecording}
                        >
                            <span style={{ fontSize: '2rem' }}>🎙️</span>
                        </button>
                    )}

                    {recorder.isRecording && (
                        <button
                            className="record-btn recording"
                            onClick={recorder.stopRecording}
                        >
                            <span style={{ fontSize: '2rem' }}>⏹️</span>
                        </button>
                    )}

                    {recorder.audioUrl && (
                        <div className="flex flex-col items-center gap-md">
                            <audio controls src={recorder.audioUrl} />

                            <div className="flex gap-md">
                                <button
                                    className="btn btn-secondary"
                                    onClick={recorder.resetRecording}
                                >
                                    Re-record
                                </button>
                            </div>

                            {/* Confidence Rating */}
                            <div className="mt-lg text-center">
                                <p className="text-muted mb-sm">How confident are you in this solution?</p>
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

