import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { patternConfig, getPatternResource, PATTERN_ORDER } from '../config/patternConfig';
import type { PatternInfo } from '../api/client';

export default function Learn() {
    const [selectedPattern, setSelectedPattern] = useState<string | null>(null);
    const [selectedPatternId, setSelectedPatternId] = useState<string | null>(null);

    const { data: patterns = [], isLoading } = useQuery({
        queryKey: ['patterns'],
        queryFn: () => api.getPatterns(),
        staleTime: 1000 * 60 * 30,
    });

    const selectedResource = selectedPattern ? getPatternResource(selectedPattern) : null;

    const handlePatternSelect = (pattern: PatternInfo) => {
        setSelectedPattern(pattern.name);
        setSelectedPatternId(pattern.id);
    };

    return (
        <div className="page">
            <div className="learn-header">
                <h1>Learn Patterns</h1>
                <p className="text-muted">
                    Master each pattern with video explanations and key concepts
                </p>
            </div>

            <div className="learn-layout">
                {/* Pattern List - Left Side */}
                <div className="pattern-list-container">
                    <h3 className="pattern-list-title">Patterns</h3>
                    {isLoading ? (
                        <div className="text-muted">Loading patterns...</div>
                    ) : (
                        <div className="pattern-list">
                            {[...patterns].sort((a, b) => {
                                const indexA = PATTERN_ORDER.indexOf(a.name);
                                const indexB = PATTERN_ORDER.indexOf(b.name);
                                if (indexA !== -1 && indexB !== -1) return indexA - indexB;
                                if (indexA !== -1) return -1;
                                if (indexB !== -1) return 1;
                                return a.name.localeCompare(b.name);
                            }).map((pattern: PatternInfo) => {
                                const hasResource = !!patternConfig[pattern.name];
                                return (
                                    <button
                                        key={pattern.id}
                                        className={`pattern-item ${selectedPattern === pattern.name ? 'active' : ''} ${!hasResource ? 'disabled' : ''}`}
                                        onClick={() => hasResource && handlePatternSelect(pattern)}
                                        disabled={!hasResource}
                                    >
                                        <span className="pattern-name">{pattern.name}</span>
                                        {hasResource && <span className="pattern-check">📚</span>}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Content - Right Side */}
                <div className="learn-content">
                    {!selectedPattern ? (
                        <div className="learn-empty">
                            <div className="learn-empty-icon">📖</div>
                            <h2>Select a Pattern</h2>
                            <p className="text-muted">
                                Choose a pattern from the left to view learning materials
                            </p>
                        </div>
                    ) : selectedResource ? (
                        <div className="learn-details">
                            <h2>{selectedResource.name}</h2>

                            {/* YouTube Video */}
                            <div className="video-container">
                                <iframe
                                    src={`${selectedResource.youtubeUrl}?rel=0&modestbranding=1`}
                                    title={`${selectedResource.name} Tutorial`}
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                    referrerPolicy="strict-origin-when-cross-origin"
                                    allowFullScreen
                                />
                            </div>

                            {/* Theory Section */}
                            <div className="theory-section">
                                <h3>Theory</h3>
                                <p>{selectedResource.theory}</p>
                            </div>

                            {/* Key Points */}
                            <div className="key-points-section">
                                <h3>Key Points</h3>
                                <ul className="key-points-list">
                                    {selectedResource.keyPoints.map((point, i) => (
                                        <li key={i}>{point}</li>
                                    ))}
                                </ul>
                            </div>

                            {/* Practice Button */}
                            <div className="learn-actions">
                                <a
                                    href={`/questions?pattern=${selectedPatternId}`}
                                    className="btn btn-primary"
                                >
                                    Practice {selectedResource.name} Problems →
                                </a>
                            </div>
                        </div>
                    ) : (
                        <div className="learn-empty">
                            <div className="learn-empty-icon">🚧</div>
                            <h2>Coming Soon</h2>
                            <p className="text-muted">
                                Learning materials for {selectedPattern} are being prepared
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
