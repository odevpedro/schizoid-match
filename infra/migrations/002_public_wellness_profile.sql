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

CREATE INDEX idx_public_wellness_profile_visible ON public_wellness_profile(is_visible) WHERE is_visible = true;
CREATE INDEX idx_public_wellness_profile_onboarding ON public_wellness_profile(onboarding_completed) WHERE onboarding_completed = true;
