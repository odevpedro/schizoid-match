-- Migration 007: Add geolocation columns to users table

ALTER TABLE users
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 7);

ALTER TABLE users
ADD COLUMN IF NOT EXISTS longitude DECIMAL(10, 7);

CREATE INDEX IF NOT EXISTS idx_users_latitude_longitude ON users(latitude, longitude);

ALTER TABLE challenges
ADD COLUMN IF NOT EXISTS progress_value DECIMAL;

ALTER TABLE challenges
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP;

ALTER TABLE challenge_progress
ADD COLUMN IF NOT EXISTS target_value DECIMAL;

UPDATE challenge_progress cp
SET target_value = COALESCE(c.target_value, cp.current_value, 0)
FROM challenges c
WHERE cp.challenge_id = c.id
  AND cp.target_value IS NULL;

UPDATE challenge_progress
SET target_value = COALESCE(target_value, current_value, 0)
WHERE target_value IS NULL;

ALTER TABLE challenge_progress
ALTER COLUMN target_value SET NOT NULL;

ALTER TABLE challenge_progress
ADD COLUMN IF NOT EXISTS unit VARCHAR;

ALTER TABLE challenge_progress
ADD COLUMN IF NOT EXISTS date DATE DEFAULT CURRENT_DATE;

UPDATE challenge_progress
SET date = CURRENT_DATE
WHERE date IS NULL;

ALTER TABLE challenge_progress
ALTER COLUMN date SET NOT NULL;

ALTER TABLE challenge_progress
ADD COLUMN IF NOT EXISTS status VARCHAR DEFAULT 'active';

UPDATE challenge_progress
SET status = COALESCE(status, 'active')
WHERE status IS NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'challenge_progress'
      AND column_name = 'completed'
  ) THEN
    UPDATE challenge_progress
    SET status = 'completed'
    WHERE completed = true;
  END IF;
END $$;

ALTER TABLE challenge_progress
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP;

ALTER TABLE challenge_progress
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE challenge_progress
ALTER COLUMN current_value TYPE DECIMAL USING current_value::DECIMAL;

ALTER TABLE challenge_progress
DROP CONSTRAINT IF EXISTS challenge_progress_challenge_id_user_id_key;

CREATE INDEX IF NOT EXISTS idx_challenge_progress_challenge_user_date
ON challenge_progress(challenge_id, user_id, date);
