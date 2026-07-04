# Privacy & Data Retention — WellMatch

## Data Classification

| Category           | Table(s)                  | Sensitivity | Retention                     |
|-------------------|---------------------------|-------------|-------------------------------|
| Identity          | users                     | High        | Until account deletion        |
| Preferences       | user_preferences          | Medium      | Until account deletion        |
| Wellness Profile  | public_wellness_profile   | Low         | Until account deletion        |
| Health Raw        | health_metrics_raw        | Critical    | 90 days after last collection |
| Health Derived    | health_profile_daily      | Medium      | 90 days after last collection |
| Consent Log       | consent_records           | High        | Permanent (audit trail)       |
| Matches           | matches                   | Medium      | Until account deletion        |
| Chat Messages     | chat_messages             | Medium      | Until account deletion        |
| Reports/Blocks    | reports, blocks           | Medium      | 1 year after resolution       |

## Consent Lifecycle

```
Grant → {purpose, version, timestamp}
Revoke → cascades to public_wellness_profile field nullification
Re-grant → new consent record with updated timestamp
```

## Account Deletion Flow

1. DELETE /privacy/account
2. HealthService.deleteRawData() → removes health_metrics_raw, health_profile_daily, consent_records
3. Wellness repo delete → removes public_wellness_profile
4. Match update → all matches set to 'unmatched'
5. UsersService.softDelete() → anonymizes user record (email, name set to deleted markers, is_deleted=true)

## Export

GET /privacy/export returns:
- user profile data
- wellness profile
- health data (raw + derived + consents)
