# Moderation — WellMatch

## Entities

### Block
- `blocker_id` + `blocked_id` (unique constraint)
- Cascades: sets matching matches to 'blocked' status
- Undo via DELETE /moderation/block/:targetUserId

### Report
- Fields: reporter_id, reported_id, reason, description, match_id, status
- Reasons: inappropriate_content, harassment, fake_profile, underage, spam, offline_behavior, other
- Statuses: pending, reviewed, dismissed, action_taken

### ModerationAction
- action_type: warning, temporary_ban, permanent_ban, content_removed
- Optional expires_at for temporary actions
- Links to report for traceability

## User-Facing Endpoints

| Method | Endpoint                  | Description           |
|--------|---------------------------|-----------------------|
| POST   | /moderation/block         | Block another user    |
| DELETE | /moderation/block/:id     | Unblock a user        |
| GET    | /moderation/blocks        | List blocked users    |
| POST   | /moderation/report        | Report a user         |
| GET    | /moderation/reports       | View reports          |

## Admin Actions

Admin users can:
- View all reports (non-admin users see only their own reports)
- Take moderation actions (warnings, bans)
- Change report status

## Impact on Matching

When user A blocks user B:
- Any active match between A and B is set to 'blocked'
- A will not see B in new match candidates (future enhancement)
- B will not see A in new match candidates (future enhancement)
