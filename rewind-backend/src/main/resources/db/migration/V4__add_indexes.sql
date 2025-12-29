-- Add additional indexes for performance optimization
-- Note: Many indexes already exist in V1, this adds only new ones

-- Additional composite index for questions
CREATE INDEX IF NOT EXISTS idx_questions_order_index ON questions(order_index);

-- Additional composite indexes for user_questions
CREATE INDEX IF NOT EXISTS idx_user_questions_user_question_combo ON user_questions(user_id, question_id);

-- Revision schedule indexes (table is revision_schedules)
CREATE INDEX IF NOT EXISTS idx_revision_schedules_user_id ON revision_schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_revision_schedules_scheduled_at ON revision_schedules(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_revision_schedules_status ON revision_schedules(completed_at);

