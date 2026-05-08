-- WellMatch Database Schema
-- Privacy-first wellness social match platform

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  birthdate DATE,
  gender_optional VARCHAR(50),
  bio TEXT,
  location_region VARCHAR(255),
  avatar_url VARCHAR(500),
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- user_preferences
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  wellness_goals TEXT[] DEFAULT '{}',
  preferred_activities TEXT[] DEFAULT '{}',
  preferred_intensity VARCHAR(50) DEFAULT 'moderate',
  availability_periods TEXT[] DEFAULT '{}',
  max_distance_km INTEGER DEFAULT 50,
  chronotype_preference VARCHAR(50),
  show_photos_after_match BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- consent_records (LGPD compliance log)
CREATE TABLE IF NOT EXISTS consent_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  metric_type VARCHAR(100) NOT NULL,
  permission_status VARCHAR(20) NOT NULL CHECK (permission_status IN ('granted', 'revoked', 'pending')),
  granted_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  source_provider VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- health_metrics_raw: INTERNAL ONLY - never exposed via public API
-- All fields here are sensitive health data subject to strict access controls
CREATE TABLE IF NOT EXISTS health_metrics_raw (
  id UUID DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ NOT NULL,
  source_provider VARCHAR(100),
  heart_rate_bpm INTEGER,                         -- sensitive: never expose externally
  hrv_ms DECIMAL(6,2),                            -- sensitive: never expose externally
  steps INTEGER,
  calories INTEGER,
  vo2max DECIMAL(5,2),                            -- sensitive: never expose externally
  sleep_minutes INTEGER,
  sleep_score DECIMAL(5,2),                       -- sensitive: never expose externally
  stress_level DECIMAL(5,2),                      -- sensitive: never expose externally
  blood_oxygen DECIMAL(5,2),                      -- sensitive: never expose externally
  skin_temp DECIMAL(5,2),                         -- sensitive: never expose externally
  PRIMARY KEY (id, timestamp)
);
SELECT create_hypertable('health_metrics_raw', 'timestamp', if_not_exists => TRUE);

-- health_profile_daily: safe derived bands only
CREATE TABLE IF NOT EXISTS health_profile_daily (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  activity_level VARCHAR(50),
  avg_steps_band VARCHAR(50),
  sleep_quality_band VARCHAR(50),
  chronotype VARCHAR(50),
  recovery_band VARCHAR(50),
  stress_band VARCHAR(50),
  cardio_fitness_band VARCHAR(50),
  consistency_score DECIMAL(5,2),
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- public_health_profile: safe data for match display
CREATE TABLE IF NOT EXISTS public_health_profile (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  display_name VARCHAR(255),
  age_range VARCHAR(20),
  wellness_tags TEXT[] DEFAULT '{}',
  badges TEXT[] DEFAULT '{}',
  activity_level VARCHAR(50),
  chronotype VARCHAR(50),
  goals TEXT[] DEFAULT '{}',
  compatibility_summary TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- matches
CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id_1 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_id_2 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  score_compatibility DECIMAL(5,2),
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'unmatched', 'blocked')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_match UNIQUE(user_id_1, user_id_2),
  CONSTRAINT no_self_match CHECK (user_id_1 != user_id_2)
);

-- swipe_history
CREATE TABLE IF NOT EXISTS swipe_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  direction VARCHAR(10) NOT NULL CHECK (direction IN ('like', 'dislike', 'super_like')),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_swipe UNIQUE(user_id, target_user_id)
);

-- chat_messages
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- challenges
CREATE TABLE IF NOT EXISTS challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES users(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  challenge_type VARCHAR(100),
  target_value INTEGER,
  target_unit VARCHAR(50),
  start_date DATE,
  end_date DATE,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- challenge_progress
CREATE TABLE IF NOT EXISTS challenge_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  current_value INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(challenge_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_health_metrics_user_time ON health_metrics_raw(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_health_profile_user_date ON health_profile_daily(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_swipe_history_user ON swipe_history(user_id);
CREATE INDEX IF NOT EXISTS idx_swipe_history_target ON swipe_history(target_user_id);
CREATE INDEX IF NOT EXISTS idx_matches_user1 ON matches(user_id_1);
CREATE INDEX IF NOT EXISTS idx_matches_user2 ON matches(user_id_2);
CREATE INDEX IF NOT EXISTS idx_chat_messages_match ON chat_messages(match_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_consent_records_user ON consent_records(user_id, metric_type);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email) WHERE is_deleted = FALSE;

-- Row-level security policies (enable after adding roles)
ALTER TABLE health_metrics_raw ENABLE ROW LEVEL SECURITY;
