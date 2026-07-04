import { registerAs } from '@nestjs/config';
import { User } from '../modules/users/entities/user.entity';
import { UserPreferences } from '../modules/users/entities/user-preferences.entity';
import { ConsentRecord } from '../modules/health/entities/consent-record.entity';
import { HealthMetricsRaw } from '../modules/health/entities/health-metrics-raw.entity';
import { HealthProfileDaily } from '../modules/health/entities/health-profile-daily.entity';
import { PublicHealthProfile } from '../modules/matching/entities/public-health-profile.entity';
import { PublicWellnessProfile } from '../modules/matching/entities/public-wellness-profile.entity';
import { Match } from '../modules/matching/entities/match.entity';
import { SwipeHistory } from '../modules/matching/entities/swipe-history.entity';
import { ChatMessage } from '../modules/chat/entities/chat-message.entity';
import { Challenge } from '../modules/challenges/entities/challenge.entity';
import { Block } from '../modules/moderation/entities/block.entity';
import { Report } from '../modules/moderation/entities/report.entity';
import { ModerationAction } from '../modules/moderation/entities/moderation-action.entity';
import { AuditEvent } from '../modules/audit/entities/audit-event.entity';

export default registerAs('database', () => ({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [
    User,
    UserPreferences,
    ConsentRecord,
    HealthMetricsRaw,
    HealthProfileDaily,
    PublicHealthProfile,
    PublicWellnessProfile,
    Match,
    SwipeHistory,
    ChatMessage,
    Challenge,
    Block,
    Report,
    ModerationAction,
    AuditEvent,
  ],
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
}));
