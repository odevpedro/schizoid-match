import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HealthMetricsRaw } from './entities/health-metrics-raw.entity';
import { HealthProfileDaily } from './entities/health-profile-daily.entity';
import { ConsentRecord } from './entities/consent-record.entity';
import { PublicWellnessProfile } from '../matching/entities/public-wellness-profile.entity';
import { IngestMetricsDto } from './dto/ingest-metrics.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

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

  async exportUserData(userId: string) {
    const [rawMetrics, dailyProfiles, consents] = await Promise.all([
      this.rawRepo.find({ where: { userId } }),
      this.dailyRepo.find({ where: { userId } }),
      this.consentRepo.find({ where: { userId } }),
    ]);

    return { rawMetrics, dailyProfiles, consents };
  }

  async deleteRawData(userId: string): Promise<void> {
    await this.rawRepo.delete({ userId });
    await this.dailyRepo.delete({ userId });
    await this.consentRepo.delete({ userId });
  }

  async getConsents(userId: string): Promise<ConsentRecord[]> {
    return this.consentRepo.find({ where: { userId } });
  }

  async grantConsent(
    userId: string,
    metricType: string,
    purpose: string,
    sourceProvider: string,
    consentVersion?: string,
  ): Promise<ConsentRecord> {
    const existing = await this.consentRepo.findOne({
      where: { userId, metricType, purpose },
    });
    if (existing) {
      existing.permissionStatus = 'granted';
      existing.grantedAt = new Date();
      existing.sourceProvider = sourceProvider;
      existing.consentVersion = consentVersion ?? 'v1';
      const saved = await this.consentRepo.save(existing);
      await this.auditService.record({ userId, eventType: 'consent_granted', resourceType: 'consent', resourceId: saved.id, metadata: { metricType, purpose } });
      return saved;
    }
    const saved = await this.consentRepo.save({
      userId,
      metricType,
      permissionStatus: 'granted',
      purpose,
      consentVersion: consentVersion ?? 'v1',
      grantedAt: new Date(),
      sourceProvider,
    });
    await this.auditService.record({ userId, eventType: 'consent_granted', resourceType: 'consent', resourceId: saved.id, metadata: { metricType, purpose } });
    return saved;
  }

  async revokeConsent(userId: string, metricType: string): Promise<void> {
    await this.consentRepo.update(
      { userId, metricType, permissionStatus: 'granted' },
      { permissionStatus: 'revoked', revokedAt: new Date() },
    );

    await this.handleConsentRevocation(userId, [metricType]);
    await this.auditService.record({ userId, eventType: 'consent_revoked', metadata: { metricType } });
  }

  async handleConsentRevocation(userId: string, metricTypes: string[]): Promise<void> {
    const profile = await this.wellnessRepo.findOne({ where: { userId } });
    if (!profile) return;

    const metricToField: Record<string, string> = {
      steps: 'activity_level',
      sleep: 'sleep_routine_band',
      activity: 'activity_consistency_band',
      heart_rate: 'score_confidence',
      hrv: 'score_confidence',
      vo2max: 'score_confidence',
    };

    const fieldsToNullify = metricTypes
      .map((m) => metricToField[m])
      .filter(Boolean);

    if (fieldsToNullify.length > 0) {
      const updateData: Record<string, null | string> = {};
      fieldsToNullify.forEach((f) => { updateData[f] = null; });
      updateData.score_confidence = 'low';
      await this.wellnessRepo.update({ userId }, updateData as any);
    }
  }

  async ingestMetrics(userId: string, dto: IngestMetricsDto): Promise<any> {
    this.logger.log(`Ingesting metrics from provider ${dto.provider} for user ${userId}`);
    return { ingested: 0, message: 'Direct metric push not supported; use provider sync' };
  }

  async getDerivedProfile(userId: string): Promise<any> {
    return this.dailyRepo.findOne({
      where: { userId },
      order: { date: 'DESC' },
    });
  }
}
