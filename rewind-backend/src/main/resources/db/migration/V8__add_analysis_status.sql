-- Add analysis_status column to explanation_recordings
ALTER TABLE explanation_recordings
ADD COLUMN IF NOT EXISTS analysis_status VARCHAR(20) DEFAULT 'PENDING';

-- Update existing records to COMPLETED (since they are legacy)
UPDATE explanation_recordings SET analysis_status = 'COMPLETED' WHERE analysis_status IS NULL;
