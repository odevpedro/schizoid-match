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
  latitude DECIMAL(10,7),
  longitude DECIMAL(10,7),
  role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'moderator', 'admin')),
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
  purpose VARCHAR(50) DEFAULT 'matching_compatibility',
  consent_version VARCHAR(10) DEFAULT 'v1',
  permission_status VARCHAR(20) NOT NULL CHECK (permission_status IN ('granted', 'revoked', 'pending')),
  granted_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  source_provider VARCHAR(100),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- health_metrics_raw: INTERNAL ONLY - never exposed via public API
CREATE TABLE IF NOT EXISTS health_metrics_raw (
  id UUID DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ NOT NULL,
  source_provider VARCHAR(100),
  heart_rate_bpm INTEGER,
  hrv_ms DECIMAL(6,2),
  steps INTEGER,
  calories INTEGER,
  vo2max DECIMAL(5,2),
  sleep_minutes INTEGER,
  sleep_score DECIMAL(5,2),
  stress_level DECIMAL(5,2),
  blood_oxygen DECIMAL(5,2),
  skin_temp DECIMAL(5,2),
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

-- public_wellness_profile: safe semantic bands for matching
CREATE TABLE IF NOT EXISTS public_wellness_profile (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  activity_level VARCHAR(20),
  activity_consistency_band VARCHAR(10),
  sleep_routine_band VARCHAR(15),
  chronotype_band VARCHAR(10),
  intensity_preference VARCHAR(10),
  main_intention VARCHAR(50),
  preferred_activities TEXT[] DEFAULT '{}',
  wellness_goals TEXT[] DEFAULT '{}',
  availability_periods TEXT[] DEFAULT '{}',
  public_badges TEXT[] DEFAULT '{}',
  score_confidence VARCHAR(10) DEFAULT 'low',
  source VARCHAR(20) DEFAULT 'manual',
  is_visible BOOLEAN DEFAULT true,
  onboarding_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- public_health_profile: legacy, kept for compatibility
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
  read_at TIMESTAMPTZ,
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
  progress_value DECIMAL,
  completed_at TIMESTAMP,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- challenge_progress
CREATE TABLE IF NOT EXISTS challenge_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  current_value DECIMAL DEFAULT 0,
  target_value DECIMAL NOT NULL,
  unit VARCHAR(50),
  date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  completed_at TIMESTAMP,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- blocks
CREATE TABLE IF NOT EXISTS blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id)
);

-- reports
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reported_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason VARCHAR(50) NOT NULL,
  description TEXT,
  match_id UUID REFERENCES matches(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- moderation_actions
CREATE TABLE IF NOT EXISTS moderation_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action_type VARCHAR(30) NOT NULL,
  reason TEXT,
  report_id UUID REFERENCES reports(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
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
CREATE INDEX IF NOT EXISTS idx_users_latitude_longitude ON users(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_public_wellness_profile_visible ON public_wellness_profile(is_visible) WHERE is_visible = true;
CREATE INDEX IF NOT EXISTS idx_public_wellness_profile_onboarding ON public_wellness_profile(onboarding_completed) WHERE onboarding_completed = true;
CREATE INDEX IF NOT EXISTS idx_challenge_progress_challenge_user_date ON challenge_progress(challenge_id, user_id, date);
CREATE INDEX IF NOT EXISTS idx_blocks_blocker ON blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_reports_reported ON reports(reported_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_moderation_actions_target ON moderation_actions(target_user_id);

-- audit_events
CREATE TABLE IF NOT EXISTS audit_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  event_type VARCHAR(50) NOT NULL,
  resource_type VARCHAR(50),
  resource_id UUID,
  metadata JSONB,
  ip_address VARCHAR(45),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_events_user_id ON audit_events(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_event_type ON audit_events(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_events_created_at ON audit_events(created_at);

-- Row-level security policies (enable after adding roles)
ALTER TABLE health_metrics_raw ENABLE ROW LEVEL SECURITY;
