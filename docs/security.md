# Security — WellMatch

## Authentication

- JWT-based with passport-jwt strategy
- Token secret from `JWT_SECRET` env var (default for dev only)
- Default expiry: 7 days (configurable via `JWT_EXPIRES_IN`)
- Password hashing: bcryptjs with configurable rounds (default 12)
- JWT payload includes `role` field (`user | moderator | admin`) for role-based access control

## Role-Based Access Control

- `RolesGuard` (`src/modules/auth/guards/roles.guard.ts`) protects endpoints requiring specific roles
- `@Roles('admin')` decorator (`src/common/decorators/roles.decorator.ts`) marks endpoint roles
- `RolesGuard` reads JWT payload `role` field and compares against allowed roles
- Used to restrict admin/moderation endpoints (e.g., viewing all reports, applying moderation actions)
- Default role for new users is `user`

## Rate Limiting

| Scope          | Limit | Implementation                      |
|---------------|-------|-------------------------------------|
| Global HTTP   | 60 req/min | @nestjs/throttler (ThrottlerModule) |
| Daily swipes  | 50/day  | Repository count on swipe_history   |
| Daily messages| 200/day | Repository count on chat_messages   |

## WebSocket Security

- Connection requires JWT token in handshake auth or Authorization header
- `join:match` event validates user is a participant via ChatService
- `message:send` validates match access server-side before persisting
- User automatically joined to `user:{userId}` room on connection

## Blocking

- POST /moderation/block — creates block record, updates match status to 'blocked'
- DELETE /moderation/block/:id — unblock user, removes block record
- GET /moderation/blocks — list all blocks for current user
- Blocked users cannot appear in candidates (future enhancement: filter out blocked pairs)
- Self-blocking is rejected
- Mobile: `BlockUserButton` component shows confirmation Alert before blocking
- Mobile: `BlockedUsersScreen` lists blocked users with unblock functionality

## Moderation

- Users can report others with reason and optional description
- Reports have status lifecycle: pending → reviewed → dismissed / action_taken
- Admin endpoint GET /moderation/reports returns all reports; regular users see only their own
- Admin endpoints protected by `@Roles('admin')` decorator via RolesGuard
- Moderation actions: warning, temporary_ban, permanent_ban, content_removed
- Mobile: `ReportUserScreen` provides reason selector (7 options) and multiline description (max 500 chars)
- Mobile: `moderation.service.ts` handles API calls for block, unblock, report

## AuditModule

- `AuditEvent` entity (`audit_events` table) stores all significant system events
- `AuditService` provides `record(event)` method, called by AuthService, OnboardingService, HealthService, MatchingService, ChatService, ModerationService, PrivacyService
- Event types include: `user_registered`, `login_success`, `login_failed`, `onboarding_completed`, `consent_granted`, `consent_revoked`, `privacy_export_requested`, `health_data_deleted`, `account_deleted`, `user_blocked`, `user_unblocked`, `user_reported`, `moderation_action_taken`, `match_created`, `message_sent`, `message_read`, `retention_cleanup_executed`
- Each event records: userId, eventType, resourceType, resourceId, metadata (JSONB), ipAddress, createdAt
- Events are immutable — no update or delete operations on audit_events

## Structured Logging

- `LoggingInterceptor` (`src/common/interceptors/logging.interceptor.ts`) logs every HTTP request/response
- Log format: structured JSON with timestamp, method, path, statusCode, duration, userId (if authenticated)
- Used for debugging, monitoring, and audit trail complement
- Sensitive fields (password, token) are automatically redacted from logs

## Healthcheck & Readiness

- `GET /health` — basic health probe, returns `{ status: 'ok', timestamp }` (no auth required)
- `GET /ready` — readiness probe checking database and Redis connectivity (no auth required)
- Implemented in `HealthCheckController` (`src/modules/health-check`)

## Privacy (LGPD)

- Consent records track purpose (matching_compatibility, profile_visibility, data_analytics, wellness_badges, activity_sharing)
- Consent versioning (v1, v2) for tracking policy changes
- Revocation cascades: consent status → revoked, associated public profile fields → null, score_confidence → low
- Data export endpoint: GET /privacy/export
- Account deletion: DELETE /privacy/account (hard deletes health data, soft deletes user profile)
