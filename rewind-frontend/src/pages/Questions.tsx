import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import type { PatternInfo, QuestionResponse } from '../api/client';
import { PATTERN_ORDER } from '../config/patternConfig';

// Skeleton loader component
function QuestionSkeleton() {
    return (
        <div className="card mb-md skeleton-group">
            <div className="skeleton-header mb-sm">
                <div className="skeleton-box" style={{ width: 150, height: 24 }} />
                <div className="skeleton-box" style={{ width: 100, height: 24 }} />
            </div>
            {[...Array(3)].map((_, i) => (
                <div key={i} className="question-row skeleton mb-xs pl-md">
                    <div className="skeleton-box" style={{ width: 30, height: 30, marginRight: 16 }} />
                    <div className="skeleton-box" style={{ width: '40%', height: 20 }} />
                </div>
            ))}
        </div>
    );
}

export default function Questions() {
    const [searchParams] = useSearchParams();
    const patternFromUrl = searchParams.get('pattern');

    const [selectedPattern, setSelectedPattern] = useState<string | null>(patternFromUrl);
    const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
    const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

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

    // Group questions by pattern
    const groupedQuestions = useMemo(() => {
        if (!questions.length) return {};

        const groups: Record<string, QuestionResponse[]> = {};
        questions.forEach(q => {
            const patternName = q.pattern.name;
            if (!groups[patternName]) {
                groups[patternName] = [];
            }
            groups[patternName].push(q);
        });
        return groups;
    }, [questions]);

    // Sort pattern names based on defined PATTERN_ORDER
    const sortedPatternNames = useMemo(() => {
        return Object.keys(groupedQuestions).sort((a, b) => {
            const indexA = PATTERN_ORDER.indexOf(a);
            const indexB = PATTERN_ORDER.indexOf(b);

            // Both in order list
            if (indexA !== -1 && indexB !== -1) {
                return indexA - indexB;
            }
            // Only A in list
            if (indexA !== -1) return -1;
            // Only B in list
            if (indexB !== -1) return 1;

            // Neither in list, sort alphabetically
            return a.localeCompare(b);
        });
    }, [groupedQuestions]);

    const toggleGroup = (patternName: string) => {
        setCollapsedGroups(prev => ({
            ...prev,
            [patternName]: !prev[patternName]
        }));
    };

    const getDifficultyClass = (diff: string) => {
        return `badge-${diff.toLowerCase()}`;
    };

    // Calculate overall stats
    const totalQuestions = questions.length;
    const completedQuestions = questions.filter(q => statusMap[q.id] === 'DONE').length;
    const overallProgress = totalQuestions > 0 ? (completedQuestions / totalQuestions) * 100 : 0;

    return (
        <div className="page">
            {/* Header with Overall Progress */}
            <div className="card mb-lg">
                <div className="flex justify-between items-center mb-md questions-header">
                    <div>
                        <h1 className="text-xl font-bold m-0">Questions</h1>
                        <p className="text-muted text-sm mt-xs">
                            COMPLETED {completedQuestions} / {totalQuestions}
                        </p>
                    </div>

                    <div className="flex gap-md questions-filters">
                        {/* Filters */}
                        <select
                            className="input"
                            value={selectedPattern || ''}
                            onChange={(e) => setSelectedPattern(e.target.value || null)}
                            style={{ minWidth: '180px' }}
                        >
                            <option value="">All Patterns</option>
                            {patterns.map((p: PatternInfo) => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>

                        <select
                            className="input"
                            value={selectedDifficulty || ''}
                            onChange={(e) => setSelectedDifficulty(e.target.value || null)}
                            style={{ minWidth: '150px' }}
                        >
                            <option value="">Any Difficulty</option>
                            <option value="Easy">Easy</option>
                            <option value="Medium">Medium</option>
                            <option value="Hard">Hard</option>
                        </select>
                    </div>
                </div>

                {/* Overall Progress Bar */}
                <div className="progress-bar-container">
                    <div className="progress-bar" style={{ height: '8px' }}>
                        <div
                            className="progress-bar-fill"
                            style={{
                                width: `${overallProgress}%`,
                                background: 'var(--color-success)'
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Question Groups */}
            <div className="question-groups">
                {isLoading ? (
                    [...Array(3)].map((_, i) => <QuestionSkeleton key={i} />)
                ) : (
                    sortedPatternNames.length > 0 ? (
                        sortedPatternNames.map(patternName => {
                            const groupQuestions = groupedQuestions[patternName];
                            const groupTotal = groupQuestions.length;
                            const groupCompleted = groupQuestions.filter(q => statusMap[q.id] === 'DONE').length;
                            const groupProgress = (groupCompleted / groupTotal) * 100;
                            const isCollapsed = collapsedGroups[patternName];

                            return (
                                <div key={patternName} className="card mb-md pattern-group">
                                    {/* Pattern Header */}
                                    <div
                                        className="pattern-header"
                                        onClick={() => toggleGroup(patternName)}
                                    >
                                        <div className="flex-1">
                                            <div className="flex justify-between items-center mb-xs">
                                                <h3 className="text-lg font-bold">{patternName}</h3>
                                                <div className="flex items-center gap-md">
                                                    <span className="text-sm font-medium">
                                                        {groupCompleted} / {groupTotal}
                                                    </span>
                                                    <span className={`chevron ${isCollapsed ? 'collapsed' : ''}`}>▼</span>
                                                </div>
                                            </div>
                                            {/* Pattern Progress */}
                                            <div className="progress-bar" style={{ height: '4px', background: 'var(--color-bg-tertiary)' }}>
                                                <div
                                                    className="progress-bar-fill"
                                                    style={{
                                                        width: `${groupProgress}%`,
                                                        background: groupCompleted === groupTotal ? 'var(--color-success)' : 'var(--color-accent)'
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Questions List */}
                                    {!isCollapsed && (
                                        <div className="pattern-questions mt-md">
                                            {groupQuestions.map((q) => {
                                                const status = statusMap[q.id];
                                                const isDone = status === 'DONE';

                                                return (
                                                    <div
                                                        key={q.id}
                                                        className={`question-row ${isDone ? 'completed' : ''}`}
                                                        onClick={() => navigate(`/solve/${q.id}`)}
                                                    >
                                                        <div className="col-id text-muted" style={{ width: '40px' }}>
                                                            {q.orderIndex}
                                                        </div>

                                                        <div className="col-title flex-1 font-medium">
                                                            {q.title}
                                                            <div className="mobile-only text-xs text-muted mt-xxs">
                                                                {q.difficulty} • {q.timeMinutes} mins
                                                            </div>
                                                        </div>

                                                        <div className="col-meta flex items-center gap-sm desktop-only">
                                                            <span className={`badge ${getDifficultyClass(q.difficulty)}`}>
                                                                {q.difficulty}
                                                            </span>
                                                            <span className="badge-pill">
                                                                {q.timeMinutes} mins
                                                            </span>
                                                            <span className="badge-pill">
                                                                {patternName}
                                                            </span>
                                                        </div>

                                                        <div className="col-status" style={{ width: '40px', textAlign: 'right' }}>
                                                            {isDone ? (
                                                                <div className="status-check">✓</div>
                                                            ) : (
                                                                <div className="status-circle" />
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    ) : (
                        <div className="text-center p-xl text-muted">
                            No questions found matching your filters.
                        </div>
                    )
                )}
            </div>
        </div>
    );
}

