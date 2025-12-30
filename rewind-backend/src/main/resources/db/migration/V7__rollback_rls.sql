-- Rollback: Disable Row Level Security (RLS) to restore application access
-- The previous RLS enablement likely caused startup failures if the DB user lacks BYPASSRLS
-- Disabling RLS checks allows all connections to function as before

ALTER TABLE flyway_schema_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE patterns DISABLE ROW LEVEL SECURITY;
ALTER TABLE questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE solutions DISABLE ROW LEVEL SECURITY;
ALTER TABLE explanation_recordings DISABLE ROW LEVEL SECURITY;
ALTER TABLE ai_feedback DISABLE ROW LEVEL SECURITY;
ALTER TABLE reflection_responses DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_pattern_stats DISABLE ROW LEVEL SECURITY;
ALTER TABLE readiness_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE revision_schedules DISABLE ROW LEVEL SECURITY;
ALTER TABLE revision_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE readiness_snapshots DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
