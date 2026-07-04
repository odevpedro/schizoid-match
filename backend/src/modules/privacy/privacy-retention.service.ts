import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { HealthMetricsRaw } from '../health/entities/health-metrics-raw.entity';
import { HealthProfileDaily } from '../health/entities/health-profile-daily.entity';
import { ConsentRecord } from '../health/entities/consent-record.entity';
import { PublicWellnessProfile } from '../matching/entities/public-wellness-profile.entity';
import { AuditService } from '../audit/audit.service';

const RAW_DATA_RETENTION_DAYS = 30;

@Injectable()
export class PrivacyRetentionService {
  private readonly logger = new Logger(PrivacyRetentionService.name);

  constructor(
    @InjectRepository(HealthMetricsRaw)
    private readonly rawRepo: Repository<HealthMetricsRaw>,
    @InjectRepository(HealthProfileDaily)
    private readonly dailyRepo: Repository<HealthProfileDaily>,
    @InjectRepository(ConsentRecord)
    private readonly consentRepo: Repository<ConsentRecord>,
    @InjectRepository(PublicWellnessProfile)
    private readonly wellnessRepo: Repository<PublicWellnessProfile>,
    private readonly auditService: AuditService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async runRetentionCleanup() {
    this.logger.log('Starting daily retention cleanup...');
    const deletedRaw = await this.deleteExpiredRawHealthMetrics();
    const cleanedRevoked = await this.cleanupRevokedConsentData();
    const cleanedDeleted = await this.cleanupDeletedUsersProfiles();

    this.logger.log(`Retention cleanup complete: ${deletedRaw} raw metrics deleted, ${cleanedRevoked} revoked profiles updated, ${cleanedDeleted} deleted profiles removed`);

    await this.auditService.record({
      eventType: 'retention_cleanup_executed',
      metadata: {
        deletedRawMetrics: deletedRaw,
        cleanedRevokedProfiles: cleanedRevoked,
        cleanedDeletedProfiles: cleanedDeleted,
      },
    });
  }

  async deleteExpiredRawHealthMetrics(): Promise<number> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - RAW_DATA_RETENTION_DAYS);

    const result = await this.rawRepo.delete({
      timestamp: LessThan(cutoff),
    });
    return result.affected || 0;
  }

  async cleanupRevokedConsentData(): Promise<number> {
    const revokedConsents = await this.consentRepo.find({
      where: { permissionStatus: 'revoked' },
    });

    const userIds = [...new Set(revokedConsents.map((c) => c.userId))];
    let updatedCount = 0;

    for (const userId of userIds) {
      const profile = await this.wellnessRepo.findOne({ where: { userId } });
      if (!profile) continue;

      const revokedMetricTypes = revokedConsents
        .filter((c) => c.userId === userId)
        .map((c) => c.metricType);

      const metricToField: Record<string, string> = {
        steps: 'activity_level',
        sleep: 'sleep_routine_band',
        activity: 'activity_consistency_band',
        heart_rate: 'score_confidence',
        hrv: 'score_confidence',
        vo2max: 'score_confidence',
      };

      const updateFields = revokedMetricTypes
        .map((m: string) => metricToField[m])
        .filter(Boolean);

      if (updateFields.length > 0) {
        const updateData: Record<string, null | string> = {};
        updateFields.forEach((f: string) => { updateData[f] = null; });
        if (revokedMetricTypes.some((m: string) => ['heart_rate', 'hrv', 'vo2max'].includes(m))) {
          updateData.score_confidence = 'low';
        }
        await this.wellnessRepo.update({ userId }, updateData as any);
        updatedCount++;
      }
    }

    return updatedCount;
  }

  async cleanupDeletedUsersProfiles(): Promise<number> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - RAW_DATA_RETENTION_DAYS);
    const cutoffStr = thirtyDaysAgo.toISOString().split('T')[0];

    const oldMetrics = await this.dailyRepo.find({
      where: { date: LessThan(cutoffStr) },
    });

    const uniqueUsers = [...new Set(oldMetrics.map((m) => m.userId))];
    let deletedCount = 0;

    for (const userId of uniqueUsers) {
      const deleted = await this.dailyRepo.delete({ userId, date: LessThan(cutoffStr) } as any);
      deletedCount += deleted.affected || 0;
    }

    return deletedCount;
  }
}
