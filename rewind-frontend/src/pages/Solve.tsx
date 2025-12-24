import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { useAudioRecorder } from '../hooks/useAudioRecorder';

type Step = 'start' | 'solve' | 'code' | 'record' | 'done';

export default function Solve() {
    const { questionId } = useParams<{ questionId: string }>();
    const navigate = useNavigate();

    const [step, setStep] = useState<Step>('start');
    const [code, setCode] = useState('');
    const [language, setLanguage] = useState('python');
    const [leetcodeLink, setLeetcodeLink] = useState('');
    const [confidenceScore, setConfidenceScore] = useState<number>(3);
    const [userQuestionId, setUserQuestionId] = useState<string | null>(null);

    const recorder = useAudioRecorder();

    // Fetch question data from API
    const { data: question, isLoading: questionLoading } = useQuery({
        queryKey: ['question', questionId],
        queryFn: () => api.getQuestion(questionId!),
        enabled: !!questionId,
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

    return (
        <div className="page">
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
                        onClick={() => {
                            // In production: call startMutation.mutate()
                            setUserQuestionId('mock-uq-id');
                            setStep('solve');
                            window.open(question.leetcodeUrl, '_blank');
                        }}
                    >
                        Start Solving
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
                        onClick={() => {
                            // In production: call submitSolutionMutation.mutate()
                            setStep('record');
                        }}
                        disabled={!code.trim()}
                    >
                        Continue to Recording
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
                                onClick={() => {
                                    // In production: call saveRecordingMutation.mutate()
                                    setStep('done');
                                }}
                            >
                                Save & Complete
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
