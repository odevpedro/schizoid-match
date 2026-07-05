import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThanOrEqual, Repository } from 'typeorm';
import { HealthMetricsRaw } from './entities/health-metrics-raw.entity';
import { HealthProfileDaily } from './entities/health-profile-daily.entity';
import { ConsentRecord } from './entities/consent-record.entity';
import { PublicWellnessProfile } from '../matching/entities/public-wellness-profile.entity';
import { IngestMetricsDto } from './dto/ingest-metrics.dto';
import { HealthProviderFactory } from './providers/health-provider.factory';
import { HealthProfileProcessor } from './processors/health-profile.processor';
import { RawHealthMetrics } from './providers/health-provider.interface';
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
    private readonly providerFactory: HealthProviderFactory,
    private readonly profileProcessor: HealthProfileProcessor,
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

  private mapMetricToColumn(record: { type: string; value: number; timestamp: string }, provider: string) {
    const base: any = {
      userId: '',
      timestamp: new Date(record.timestamp),
      sourceProvider: provider,
    };
    switch (record.type) {
      case 'steps': base.steps = record.value; break;
      case 'calories': base.calories = record.value; break;
      case 'heart_rate': base.heartRateBpm = record.value; break;
      case 'hrv': base.hrvMs = record.value; break;
      case 'sleep': base.sleepMinutes = record.value; break;
      case 'stress': base.stressLevel = record.value; break;
      case 'blood_oxygen': base.bloodOxygen = record.value; break;
      case 'skin_temp': base.skinTemp = record.value; break;
      case 'vo2max': base.vo2max = record.value; break;
    }
    return base;
  }

  private toRawMetric(record: Partial<HealthMetricsRaw>): RawHealthMetrics {
    return {
      heartRateBpm: toNumber(record.heartRateBpm),
      hrvMs: toNumber(record.hrvMs),
      steps: toNumber(record.steps),
      calories: toNumber(record.calories),
      vo2max: toNumber(record.vo2max),
      sleepMinutes: toNumber(record.sleepMinutes),
      sleepScore: toNumber(record.sleepScore),
      stressLevel: toNumber(record.stressLevel),
      bloodOxygen: toNumber(record.bloodOxygen),
      skinTemp: toNumber(record.skinTemp),
      timestamp: new Date(record.timestamp as any),
      sourceProvider: record.sourceProvider || 'unknown',
    };
  }

  private async refreshDerivedProfiles(userId: string, records: Partial<HealthMetricsRaw>[]): Promise<void> {
    const rawMetrics = records
      .filter((record) => record.timestamp)
      .map((record) => this.toRawMetric({ ...record, userId }));

    if (!rawMetrics.length) return;

    const profiles = this.profileProcessor.processMetrics(userId, rawMetrics);
    for (const profile of profiles) {
      await this.dailyRepo.upsert(profile as HealthProfileDaily, ['userId', 'date']);
    }
  }

  async ingestMetrics(userId: string, dto: IngestMetricsDto): Promise<any> {
    this.logger.log(`Ingesting metrics from provider ${dto.provider} for user ${userId}`);

    if (dto.metrics && dto.metrics.length > 0) {
      let ingested = 0;
      const chunkSize = 50;
      for (let i = 0; i < dto.metrics.length; i += chunkSize) {
        const chunk = dto.metrics.slice(i, i + chunkSize);
        const byTimestamp = new Map<string, any>();
        for (const m of chunk) {
          const ts = new Date(m.timestamp).toISOString();
          if (!byTimestamp.has(ts)) {
            byTimestamp.set(ts, {
              userId,
              timestamp: m.timestamp,
              sourceProvider: dto.provider,
            });
          }
          const entry = byTimestamp.get(ts);
          const col = this.mapMetricToColumn(m, dto.provider);
          Object.assign(entry, col);
          delete entry.userId;
          entry.userId = userId;
        }
        const records = Array.from(byTimestamp.values());
        await this.rawRepo.insert(records);
        await this.refreshDerivedProfiles(userId, records);
        ingested += chunk.length;
      }
      this.logger.log(`Ingested ${ingested} metric samples for user ${userId}`);
      return { ingested, provider: dto.provider };
    }

    const provider = this.providerFactory?.getProvider(dto.provider);
    if (!provider) {
      return { ingested: 0, message: 'Provider not available' };
    }

    const from = dto.fromDate ? new Date(dto.fromDate) : new Date(Date.now() - 86400000 * 7);
    const to = dto.toDate ? new Date(dto.toDate) : new Date();
    const metrics = await provider.fetchMetrics(userId, from, to);

    if (metrics.length === 0) {
      return { ingested: 0, message: 'No metrics returned from provider' };
    }

    let ingested = 0;
    const chunkSize = 50;
    for (let i = 0; i < metrics.length; i += chunkSize) {
      const chunk = metrics.slice(i, i + chunkSize);
      const records = chunk.map((m) => ({
        userId,
        timestamp: m.timestamp,
        sourceProvider: dto.provider,
        steps: m.steps,
        calories: m.calories,
        heartRateBpm: m.heartRateBpm,
        hrvMs: m.hrvMs,
        sleepMinutes: m.sleepMinutes,
        sleepScore: (m as any).sleepScore,
        stressLevel: (m as any).stressLevel,
        bloodOxygen: (m as any).bloodOxygen,
        skinTemp: (m as any).skinTemp,
        vo2max: m.vo2max,
      }));
      await this.rawRepo.insert(records as any);
      await this.refreshDerivedProfiles(userId, records as any);
      ingested += chunk.length;
    }

    this.logger.log(`Ingested ${ingested} metrics from provider ${dto.provider}`);
    return { ingested, provider: dto.provider };
  }

  async getDerivedProfile(userId: string): Promise<any> {
    return this.dailyRepo.findOne({
      where: { userId },
      order: { date: 'DESC' },
    });
  }

  async getDashboard(userId: string): Promise<any> {
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 6);

    const records = await this.rawRepo.find({
      where: { userId, timestamp: MoreThanOrEqual(weekStart) },
      order: { timestamp: 'ASC' },
    });

    const todayRecords = records.filter((record) => new Date(record.timestamp) >= todayStart);
    const latest = records[records.length - 1];

    const dailySteps = new Map<string, number>();
    const dailySleep = new Map<string, number[]>();

    for (const record of records) {
      const key = new Date(record.timestamp).toISOString().split('T')[0];
      const steps = toNumber(record.steps) ?? 0;
      if (steps > 0) {
        dailySteps.set(key, (dailySteps.get(key) || 0) + steps);
      }

      const sleep = toNumber(record.sleepMinutes);
      if (sleep != null) {
        dailySleep.set(key, [...(dailySleep.get(key) || []), sleep]);
      }
    }

    const today = {
      steps: sum(todayRecords.map((record) => toNumber(record.steps))),
      sleepMinutes: latestValue(todayRecords.map((record) => toNumber(record.sleepMinutes))),
      calories: sum(todayRecords.map((record) => toNumber(record.calories))),
      avgHeartRate: average(todayRecords.map((record) => toNumber(record.heartRateBpm))),
      hrv: average(todayRecords.map((record) => toNumber(record.hrvMs))),
      stressLevel: average(todayRecords.map((record) => toNumber(record.stressLevel))),
    };

    const activeDays = Array.from(dailySteps.values()).filter((steps) => steps > 0).length;
    const sleepAverages = Array.from(dailySleep.values()).map((values) => average(values));

    return {
      today,
      weekly: {
        avgSteps: average(Array.from(dailySteps.values())),
        avgSleep: average(sleepAverages),
        activeDays,
      },
      source: latest?.sourceProvider || null,
      lastSync: latest?.timestamp?.toISOString?.() || null,
      derivedProfile: await this.getDerivedProfile(userId),
    };
  }
}

function toNumber(value: unknown): number | undefined {
  if (value == null) return undefined;
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function sum(values: Array<number | undefined>): number {
  return Math.round(values.reduce<number>((total, value) => total + (value || 0), 0));
}

function average(values: Array<number | undefined>): number {
  const numbers = values.filter((value): value is number => value != null && Number.isFinite(value));
  if (!numbers.length) return 0;
  return Math.round(numbers.reduce((total, value) => total + value, 0) / numbers.length);
}

function latestValue(values: Array<number | undefined>): number {
  const numbers = values.filter((value): value is number => value != null && Number.isFinite(value));
  return numbers.length ? Math.round(numbers[numbers.length - 1]) : 0;
}
