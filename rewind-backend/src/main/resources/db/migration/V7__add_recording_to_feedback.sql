-- Add recording_id foreign key to ai_feedback table
-- This allows filtering feedback to show only the most recent analysis

ALTER TABLE ai_feedback 
ADD COLUMN recording_id UUID NULL REFERENCES explanation_recordings(id) ON DELETE CASCADE;

-- Index for efficient lookup by recording
CREATE INDEX idx_ai_feedback_recording_id ON ai_feedback(recording_id);
