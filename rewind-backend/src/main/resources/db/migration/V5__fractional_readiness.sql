-- Change readiness columns to double precision to support fractional days
ALTER TABLE users 
    ALTER COLUMN current_readiness_days TYPE DOUBLE PRECISION,
    ALTER COLUMN interview_target_days TYPE DOUBLE PRECISION;

ALTER TABLE readiness_events 
    ALTER COLUMN change_delta_days TYPE DOUBLE PRECISION;

-- Set default values as floats
ALTER TABLE users 
    ALTER COLUMN current_readiness_days SET DEFAULT 90.0,
    ALTER COLUMN interview_target_days SET DEFAULT 90.0;
