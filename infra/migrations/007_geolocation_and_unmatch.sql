-- Migration 007: Add geolocation columns to users table

ALTER TABLE users
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 7);

ALTER TABLE users
ADD COLUMN IF NOT EXISTS longitude DECIMAL(10, 7);

CREATE INDEX IF NOT EXISTS idx_users_latitude_longitude ON users(latitude, longitude);
