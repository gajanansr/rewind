-- Enable Row Level Security (RLS) on all tables
-- This blocks all access by default for 'anon' and 'authenticated' roles
-- The 'postgres' superuser (used by Backend) bypasses RLS and retains full access

ALTER TABLE patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE solutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE explanation_recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE reflection_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_pattern_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE readiness_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE revision_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE revision_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE readiness_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Exclude flyway_schema_history from RLS enforcement as it is an internal tool table
-- and managed by the migration user (superuser)
-- ALTER TABLE flyway_schema_history ENABLE ROW LEVEL SECURITY; -- DO NOT ENABLE THIS
