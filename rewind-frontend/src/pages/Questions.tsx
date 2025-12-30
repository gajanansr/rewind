import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import type { PatternInfo, QuestionResponse } from '../api/client';

// Skeleton loader component
function QuestionSkeleton() {
    return (
        <div className="question-item skeleton">
            <div className="question-number skeleton-box" style={{ width: 40, height: 40 }} />
            <div className="question-info">
                <div className="skeleton-box" style={{ width: '60%', height: 20, marginBottom: 8 }} />
                <div className="skeleton-box" style={{ width: '40%', height: 16 }} />
            </div>
        </div>
    );
}

export default function Questions() {
    const [searchParams] = useSearchParams();
    const patternFromUrl = searchParams.get('pattern');

    const [selectedPattern, setSelectedPattern] = useState<string | null>(patternFromUrl);
    const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
    const navigate = useNavigate();

    const { data: patterns = [], isLoading: patternsLoading } = useQuery({
        queryKey: ['patterns'],
        queryFn: () => api.getPatterns(),
        staleTime: 1000 * 60 * 30, // Cache patterns for 30 minutes
    });

    const { data: questions = [], isLoading: questionsLoading } = useQuery({
        queryKey: ['questions', selectedPattern, selectedDifficulty],
        queryFn: async () => {
            const result = await api.getQuestions({
                patternId: selectedPattern || undefined,
                difficulty: selectedDifficulty || undefined,
            });
            // Handle both array and paginated response
            return Array.isArray(result) ? result : result.content;
        },
    });

    // Use lightweight status-map endpoint instead of full user-questions
    const { data: statusMap = {} } = useQuery({
        queryKey: ['status-map'],
        queryFn: () => api.getStatusMap(),
        retry: false,
        staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    });

    const isLoading = patternsLoading || questionsLoading;

    const getDifficultyClass = (diff: string) => {
        return `badge-${diff.toLowerCase()}`;
    };

    const getStatusIcon = (questionId: string) => {
        const status = statusMap[questionId];
        if (status === 'DONE') return <span className="question-status done">✓</span>;
        if (status === 'STARTED') return <span className="question-status started">⋯</span>;
        return null;
    };

    return (
        <div className="page">
            <h1 className="mb-lg">Questions</h1>

            {/* Filters */}
            <div className="card mb-lg">
                <div className="flex gap-lg" style={{ flexWrap: 'wrap' }}>
                    {/* Pattern Filter */}
                    <div>
                        <label className="text-muted" style={{ fontSize: '0.875rem', display: 'block', marginBottom: 'var(--spacing-xs)' }}>
                            Pattern
                        </label>
                        <select
                            className="input"
                            value={selectedPattern || ''}
                            onChange={(e) => setSelectedPattern(e.target.value || null)}
                            style={{ minWidth: '200px' }}
                        >
                            <option value="">All Patterns</option>
                            {patterns.map((p: PatternInfo) => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Difficulty Filter */}
                    <div>
                        <label className="text-muted" style={{ fontSize: '0.875rem', display: 'block', marginBottom: 'var(--spacing-xs)' }}>
                            Difficulty
                        </label>
                        <div className="flex gap-sm">
                            {['Easy', 'Medium', 'Hard'].map(diff => (
                                <button
                                    key={diff}
                                    className={`btn ${selectedDifficulty === diff ? 'btn-primary' : 'btn-secondary'}`}
                                    onClick={() => setSelectedDifficulty(selectedDifficulty === diff ? null : diff)}
                                >
                                    {diff}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Question List */}
            <div className="question-list">
                {isLoading ? (
                    // Show skeleton loaders while loading
                    <>
                        {[...Array(8)].map((_, i) => (
                            <QuestionSkeleton key={i} />
                        ))}
                    </>
                ) : (
                    questions.map((q: QuestionResponse) => (
                        <div
                            key={q.id}
                            className="question-item"
                            onClick={() => navigate(`/solve/${q.id}`)}
                        >
                            <div className="question-number">{q.orderIndex}</div>

                            <div className="question-info">
                                <div className="question-title">{q.title}</div>
                                <div className="question-meta">
                                    <span className={`badge ${getDifficultyClass(q.difficulty)}`}>
                                        {q.difficulty}
                                    </span>
                                    <span className="badge badge-pattern">{q.pattern.name}</span>
                                    <span>~{q.timeMinutes} min</span>
                                </div>
                            </div>

                            {getStatusIcon(q.id)}

                            <a
                                href={q.leetcodeUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-ghost"
                                onClick={(e) => e.stopPropagation()}
                            >
                                LeetCode ↗
                            </a>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

