# Architecture — WellMatch

## System Overview

WellMatch is a monorepo with two main applications:

- `backend/` — NestJS (Node.js + TypeScript) REST API + WebSocket gateway
- `mobile/` — React Native (Expo) mobile app (web-compatible for development)
- `infra/` — Docker Compose (PostgreSQL + TimescaleDB, Redis), SQL migrations, ci.yml

The backend follows modular architecture: each domain (auth, users, health, matching, chat, challenges, privacy, moderation) has its own NestJS module with controller, service, entities, and DTOs.

## Stack

| Component   | Technology              |
|-------------|-------------------------|
| Backend     | NestJS 10, TypeScript 5 |
| Frontend    | React Native (Expo)     |
| Database    | PostgreSQL 15 + TimescaleDB |
| Cache       | Redis 7                 |
| Auth        | JWT (bcryptjs + passport-jwt) |
| WebSocket   | Socket.IO               |
| Validation  | class-validator + class-transformer |
| Docs        | Swagger/OpenAPI         |

## Data Flow

```
Mobile App  <-->  REST API (:3001)  <-->  PostgreSQL
                 WebSocket (/chat)  <-->  Redis
```

## Database Schema

- `users` + `user_preferences` — identity and preferences
- `public_wellness_profile` — safe semantic bands for matching
- `matches` + `swipe_history` — matching engine
- `chat_messages` — conversation storage
- `consent_records` — LGPD compliance log with purpose and versioning
- `health_metrics_raw` + `health_profile_daily` — internal health metrics
- `blocks` + `reports` + `moderation_actions` — safety and moderation
- `challenges` + `challenge_progress` — gamification

## Privacy Architecture

- Raw health data (`health_metrics_raw`) is stored but never exposed via public API
- `public_wellness_profile` contains only semantic bands (activity_level, chronotype_band, etc.)
- Consent records track purpose, version, and timestamps for every metric
- Revocation removes associated public profile fields and recalculates score confidence
- Account deletion cascades: raw data → wellness profile → matches → soft delete user

## Module Dependencies

```
AppModule
├── AuthModule          ← UsersModule
├── UsersModule         ← PublicWellnessProfile
├── HealthModule        ← PublicWellnessProfile
├── MatchingModule      ← UsersModule
├── ChatModule          ← Match
├── ChallengesModule    ← Match, User
├── PrivacyModule       ← UsersModule, HealthModule
└── ModerationModule    ← Match
```
