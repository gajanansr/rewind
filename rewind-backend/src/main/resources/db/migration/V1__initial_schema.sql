-- V1__initial_schema.sql
-- DSA Thinking Recorder - Complete Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===========================================
-- CORE ENTITIES
-- ===========================================

-- Patterns (seeded data - 21 patterns)
CREATE TABLE patterns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    category VARCHAR(50),
    importance_weight INT DEFAULT 1 CHECK (importance_weight BETWEEN 1 AND 5),
    short_mental_model TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Questions (seeded data - 169 questions)
CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL,
    difficulty VARCHAR(10) NOT NULL CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
    leetcode_url TEXT NOT NULL,
    time_minutes INT NOT NULL,
    order_index INT NOT NULL UNIQUE,
    pattern_id UUID NOT NULL REFERENCES patterns(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users (linked to Supabase auth.users)
CREATE TABLE users (
    id UUID PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(255) NOT NULL,
    interview_target_days INT DEFAULT 90,
    current_readiness_days INT DEFAULT 90,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- USER PROGRESS ENTITIES
-- ===========================================

-- User Questions (central lifecycle entity)
CREATE TABLE user_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(id),
    status VARCHAR(20) NOT NULL DEFAULT 'NOT_STARTED' 
        CHECK (status IN ('NOT_STARTED', 'STARTED', 'DONE')),
    confidence_score INT CHECK (confidence_score BETWEEN 1 AND 5),
    started_at TIMESTAMPTZ,
    solved_duration_seconds INT,
    done_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, question_id)
);

-- Solutions
CREATE TABLE solutions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_question_id UUID NOT NULL REFERENCES user_questions(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    language VARCHAR(30) NOT NULL,
    leetcode_submission_link TEXT,
    is_optimal BOOLEAN,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Explanation Recordings
CREATE TABLE explanation_recordings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_question_id UUID NOT NULL REFERENCES user_questions(id) ON DELETE CASCADE,
    audio_url TEXT NOT NULL,
    transcript TEXT,
    duration_seconds INT NOT NULL,
    version INT NOT NULL DEFAULT 1,
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- AI & REFLECTION ENTITIES
-- ===========================================

-- AI Feedback (on-demand, saved)
CREATE TABLE ai_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_question_id UUID NOT NULL REFERENCES user_questions(id) ON DELETE CASCADE,
    feedback_type VARCHAR(30) NOT NULL 
        CHECK (feedback_type IN ('HINT', 'COMMUNICATION_TIP', 'REFLECTION_QUESTION')),
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reflection Responses
CREATE TABLE reflection_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_question_id UUID NOT NULL REFERENCES user_questions(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    user_response TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- PATTERN MASTERY & REVISION ENTITIES
-- ===========================================

-- User Pattern Stats (aggregated per pattern)
CREATE TABLE user_pattern_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    pattern_id UUID NOT NULL REFERENCES patterns(id),
    questions_attempted INT DEFAULT 0,
    questions_completed INT DEFAULT 0,
    avg_confidence FLOAT DEFAULT 0,
    last_practiced_at TIMESTAMPTZ,
    UNIQUE(user_id, pattern_id)
);

-- Revision Schedules
CREATE TABLE revision_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_question_id UUID NOT NULL REFERENCES user_questions(id) ON DELETE CASCADE,
    pattern_id UUID NOT NULL REFERENCES patterns(id),
    scheduled_at TIMESTAMPTZ NOT NULL,
    reason VARCHAR(50) NOT NULL 
        CHECK (reason IN ('LOW_CONFIDENCE', 'TIME_DECAY', 'PATTERN_WEAKNESS', 'MANUAL')),
    priority_score FLOAT DEFAULT 0,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Revision Sessions
CREATE TABLE revision_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    revision_schedule_id UUID NOT NULL REFERENCES revision_schedules(id) ON DELETE CASCADE,
    listened_audio_version INT NOT NULL,
    rerecorded BOOLEAN DEFAULT FALSE,
    new_confidence_score INT CHECK (new_confidence_score BETWEEN 1 AND 5),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- READINESS TRACKING ENTITIES
-- ===========================================

-- Readiness Snapshots (daily snapshot)
CREATE TABLE readiness_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    days_remaining INT NOT NULL,
    calculated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Readiness Events (audit log)
CREATE TABLE readiness_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    change_delta_days INT NOT NULL,
    reason TEXT NOT NULL,
    related_question_id UUID REFERENCES questions(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- INDEXES
-- ===========================================

CREATE INDEX idx_questions_pattern ON questions(pattern_id);
CREATE INDEX idx_questions_difficulty ON questions(difficulty);
CREATE INDEX idx_user_questions_user ON user_questions(user_id);
CREATE INDEX idx_user_questions_status ON user_questions(user_id, status);
CREATE INDEX idx_user_questions_question ON user_questions(question_id);
CREATE INDEX idx_solutions_user_question ON solutions(user_question_id);
CREATE INDEX idx_recordings_user_question ON explanation_recordings(user_question_id);
CREATE INDEX idx_ai_feedback_user_question ON ai_feedback(user_question_id);
CREATE INDEX idx_revision_schedules_pending ON revision_schedules(user_id, completed_at) 
    WHERE completed_at IS NULL;
CREATE INDEX idx_pattern_stats_user ON user_pattern_stats(user_id);
CREATE INDEX idx_readiness_events_user ON readiness_events(user_id, created_at DESC);
