# Onboarding Flow — WellMatch

## Overview

Onboarding is a mandatory 7-step post-registration flow. Until `onboarding_completed = true` on the `public_wellness_profile`, the user cannot access matching.

## Steps

### Step 0 — Registration
- POST /auth/register → creates `users` + `user_preferences` rows
- User has empty profile; `getOnboardingStatus` returns `step: 0`

### Step 1 — Main Intention
- POST /users/onboarding/step1
- Field: `mainIntention` — enum (friendship, walking_partner, training_partner, habit_accountability, social_connection, romantic_optional)

### Step 2 — Wellness Goals
- POST /users/onboarding/step2
- Multi-select from: walk_more, sleep_better, exercise_consistently, find_training_partner, build_routine, reduce_sedentary_habits, meet_people_safely

### Step 3 — Preferred Activities
- POST /users/onboarding/step3
- Multi-select from: walking, running, gym, cycling, yoga, stretching, outdoor_activity, home_workout, casual_wellness

### Step 4 — Availability Periods
- POST /users/onboarding/step4
- Multi-select from: early_morning, morning, afternoon, evening, night, weekends

### Step 5 — Intensity Preference
- POST /users/onboarding/step5
- Single select: low, moderate, high, flexible

### Step 6 — Privacy Visibility Settings
- POST /users/onboarding/step6
- Toggles: showPhotosAfterMatch, shareActivityLevel, shareSleepRoutine

### Step 7 — Data Source + Profile Generation
- POST /users/onboarding/step7
- Requires steps 1-6 complete
- Source: manual or simulated
- Generates `public_wellness_profile` with semantic bands
- Sets `onboarding_completed = true`

## Status Endpoint

GET /users/onboarding/status → `{ completed: boolean, step: number, profile: PublicWellnessProfile | null }`

## Error States

- Attempting step 7 without completing steps 1-6 → 400 BadRequest
- Duplicate step call → upsert behavior (idempotent)
- Onboarding status queried before registration → null profile, step 0
