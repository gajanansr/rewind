// API Client for Rewind Backend

const API_BASE = import.meta.env.VITE_API_URL || '/api/v1';

interface RequestOptions {
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    body?: unknown;
    headers?: Record<string, string>;
}

class ApiClient {
    private getAuthHeader(): Record<string, string> {
        const token = localStorage.getItem('access_token');
        return token ? { Authorization: `Bearer ${token}` } : {};
    }

    async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
        const { method = 'GET', body, headers = {} } = options;

        const response = await fetch(`${API_BASE}${endpoint}`, {
            method,
            headers: {
                'Content-Type': 'application/json',
                ...this.getAuthHeader(),
                ...headers,
            },
            body: body ? JSON.stringify(body) : undefined,
        });

        if (!response.ok) {
            // Auto-logout on 401 (Unauthorized) or 403 (Forbidden) - token expired or invalid
            if (response.status === 401 || response.status === 403) {
                console.warn('Token expired or invalid, logging out...');
                // Clear all auth-related storage (Zustand uses 'rewind-auth')
                localStorage.removeItem('rewind-auth');
                localStorage.removeItem('access_token');
                // Redirect to login with full page reload to reset React state
                window.location.href = '/login';
                throw new Error('Session expired. Please log in again.');
            }

            const error = await response.json().catch(() => ({ message: 'Request failed' }));
            throw new Error(error.message || `HTTP ${response.status}`);
        }

        return response.json();
    }

    // Questions
    getQuestions(params?: { difficulty?: string; patternId?: string; page?: number; size?: number }) {
        // Filter out undefined values
        const cleanParams = Object.fromEntries(
            Object.entries(params || {}).filter(([, v]) => v !== undefined && v !== null && v !== '')
        );
        const query = new URLSearchParams(cleanParams as Record<string, string>).toString();
        return this.request<QuestionResponse[] | PagedQuestionResponse>(`/questions${query ? `?${query}` : ''}`);
    }

    getQuestion(id: string) {
        return this.request<QuestionResponse>(`/questions/${id}`);
    }

    getPatterns() {
        return this.request<PatternInfo[]>('/patterns');
    }

    // User Questions
    getMyQuestions() {
        return this.request<UserQuestionResponse[]>('/user-questions');
    }

    /**
     * Lightweight endpoint that only returns questionId:status map.
     * Much faster than getMyQuestions - ideal for initial page load.
     */
    getStatusMap() {
        return this.request<Record<string, string>>('/user-questions/status-map');
    }

    startQuestion(questionId: string) {
        return this.request<UserQuestionResponse>(`/user-questions/${questionId}/start`, {
            method: 'POST',
        });
    }

    getQuestionHistory(questionId: string) {
        return this.request<QuestionHistoryResponse>(`/user-questions/${questionId}/history`);
    }

    // Solutions
    submitSolution(data: SubmitSolutionRequest) {
        return this.request<{ solutionId: string; nextStep: string; message: string }>(
            '/solutions',
            { method: 'POST', body: data }
        );
    }

    // Recordings
    getUploadUrl(data: UploadUrlRequest) {
        return this.request<UploadUrlResponse>('/recordings/upload-url', {
            method: 'POST',
            body: data,
        });
    }

    saveRecording(data: SaveRecordingRequest) {
        return this.request<{ recordingId: string; version: number; message: string }>(
            '/recordings',
            { method: 'POST', body: data }
        );
    }

    getFeedback(recordingId: string) {
        return this.request<{ feedback: Array<{ type: string; message: string }>; analysisStatus: string }>(
            `/recordings/${recordingId}/feedback`
        );
    }

    // Readiness
    getReadiness() {
        return this.request<ReadinessResponse>('/readiness');
    }

    // Activity heatmap (daily question counts)
    getActivity() {
        return this.request<Record<string, number>>('/user-questions/activity');
    }

    // Revisions
    getPendingRevisions() {
        return this.request<{ revisions: RevisionScheduleResponse[]; totalPending: number }>(
            '/revisions/pending'
        );
    }

    getTodayRevisions() {
        return this.request<RevisionScheduleResponse[]>('/revisions/today');
    }

    completeRevision(scheduleId: string, data: CompleteRevisionRequest) {
        return this.request<{ sessionId: string; success: boolean; message: string }>(
            `/revisions/${scheduleId}/complete`,
            { method: 'POST', body: data }
        );
    }

    generateRevisions() {
        return this.request<RevisionScheduleResponse[]>('/revisions/generate', {
            method: 'POST',
        });
    }

    resetProgress() {
        return this.request<void>('/user-questions/reset', {
            method: 'DELETE',
        });
    }

    async uploadFile(url: string, file: Blob, contentType: string = 'audio/webm') {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                ...this.getAuthHeader(),
                'Content-Type': contentType,
            },
            body: file,
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'Upload failed' }));
            throw new Error(error.message || `Upload failed with status ${response.status}`);
        }

        return response;
    }
}

// Types
export interface PatternInfo {
    id: string;
    name: string;
    category?: string;
    shortMentalModel?: string;
}

export interface QuestionResponse {
    id: string;
    title: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    leetcodeUrl: string;
    timeMinutes: number;
    orderIndex: number;
    pattern: PatternInfo;
}

export interface PagedQuestionResponse {
    content: QuestionResponse[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    hasNext: boolean;
}

export interface UserQuestionResponse {
    id: string;
    questionId: string;
    status: 'NOT_STARTED' | 'STARTED' | 'DONE';
    confidenceScore?: number;
    startedAt?: string;
    solvedDurationSeconds?: number;
    doneAt?: string;
    question: QuestionResponse;
}

export interface QuestionHistoryResponse {
    userQuestion: UserQuestionResponse;
    solutions: SolutionResponse[];
    recordings: RecordingResponse[];
}

export interface SolutionResponse {
    id: string;
    code: string;
    language: string;
    leetcodeSubmissionLink?: string;
    isOptimal?: boolean;
    createdAt: string;
}

export interface RecordingResponse {
    id: string;
    audioUrl: string;
    transcript?: string;
    durationSeconds: number;
    version: number;
    recordedAt: string;
}

export interface SubmitSolutionRequest {
    userQuestionId: string;
    code: string;
    language: string;
    leetcodeSubmissionLink?: string;
}

export interface UploadUrlRequest {
    userQuestionId: string;
    contentType: string;
    durationSeconds?: number;
}

export interface UploadUrlResponse {
    uploadUrl: string;
    audioPath: string;
    expiresAt: string;
}

export interface SaveRecordingRequest {
    userQuestionId: string;
    audioUrl: string;
    durationSeconds: number;
    confidenceScore?: number;
}

export interface ReadinessResponse {
    daysRemaining: number;
    targetDays: number;
    percentComplete: number;
    trend: 'IMPROVING' | 'STABLE' | 'SLOWING';
    breakdown: {
        questionsSolved: number;
        questionsTotal: number;
        easyComplete: number;
        mediumComplete: number;
        hardComplete: number;
        revisionsComplete: number;
        weakPatterns: string[];
    };
    recentEvents: {
        delta: number;
        reason: string;
        createdAt: string;
    }[];
    registrationDate?: string;
}

export interface RevisionScheduleResponse {
    scheduleId: string;
    question: {
        id: string;
        title: string;
        difficulty: string;
        pattern: string;
        leetcodeUrl: string;
    };
    reason: string;
    priorityScore: number;
    scheduledAt: string;
    lastRecording?: {
        id: string;
        version: number;
        audioUrl: string;
        recordedAt: string;
    };
    daysSinceLastPractice: number;
}

export interface CompleteRevisionRequest {
    listenedVersion: number;
    rerecorded: boolean;
    newConfidenceScore?: number;
}

export const api = new ApiClient();
