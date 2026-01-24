-- Create trial subscriptions for existing users who don't have one
-- This ensures existing users get a 14-day trial from the time of this migration

INSERT INTO subscriptions (user_id, plan, status, starts_at, expires_at, auto_renew, created_at, updated_at)
SELECT 
    u.id,
    'TRIAL',
    'ACTIVE',
    NOW(),
    NOW() + INTERVAL '14 days',
    false,
    NOW(),
    NOW()
FROM users u
WHERE NOT EXISTS (
    SELECT 1 FROM subscriptions s WHERE s.user_id = u.id
);
