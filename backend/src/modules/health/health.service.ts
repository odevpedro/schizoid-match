import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HealthMetricsRaw } from './entities/health-metrics-raw.entity';
import { HealthProfileDaily } from './entities/health-profile-daily.entity';
import { ConsentRecord } from './entities/consent-record.entity';
import { HealthProviderFactory } from './providers/health-provider.factory';
import { HealthProfileProcessor } from './processors/health-profile.processor';
import { IngestMetricsDto } from './dto/ingest-metrics.dto';
import { GrantConsentDto, RevokeConsentDto } from './dto/consent.dto';

@Injectable()
export class HealthService {
  constructor(
    @InjectRepository(HealthMetricsRaw)
    private readonly rawRepo: Repository<HealthMetricsRaw>,
    @InjectRepository(HealthProfileDaily)
    private readonly profileRepo: Repository<HealthProfileDaily>,
    @InjectRepository(ConsentRecord)
    private readonly consentRepo: Repository<ConsentRecord>,
    private readonly providerFactory: HealthProviderFactory,
    private readonly processor: HealthProfileProcessor,
  ) {}

  async grantConsent(userId: string, dto: GrantConsentDto): Promise<ConsentRecord[]> {
    const records = dto.metricTypes.map((metricType) =>
      this.consentRepo.create({
        userId,
        metricType,
        permissionStatus: 'granted',
        grantedAt: new Date(),
        sourceProvider: dto.sourceProvider,
      }),
    );
    return this.consentRepo.save(records);
  }

  async revokeConsent(userId: string, dto: RevokeConsentDto): Promise<void> {
    for (const metricType of dto.metricTypes) {
      await this.consentRepo.update(
        { userId, metricType, permissionStatus: 'granted' },
        { permissionStatus: 'revoked', revokedAt: new Date() },
      );
    }
  }

  async getConsents(userId: string): Promise<ConsentRecord[]> {
    return this.consentRepo.find({ where: { userId } });
  }

  async ingestMetrics(userId: string, dto: IngestMetricsDto): Promise<{ imported: number }> {
    const provider = this.providerFactory.getProvider(dto.provider);

    const from = dto.fromDate ? new Date(dto.fromDate) : new Date(Date.now() - 7 * 86400000);
    const to = dto.toDate ? new Date(dto.toDate) : new Date();

    const grantedConsents = await this.consentRepo.find({
      where: { userId, permissionStatus: 'granted', sourceProvider: dto.provider },
    });

    if (!grantedConsents.length) {
      throw new ForbiddenException('No consent granted for this provider. Grant consent first.');
    }

    const rawMetrics = await provider.fetchMetrics(userId, from, to);

    const entities = rawMetrics.map((m) =>
      this.rawRepo.create({ ...m, userId }),
    );

    await this.rawRepo.save(entities);

    const profiles = this.processor.processMetrics(userId, rawMetrics);
    for (const profile of profiles) {
      await this.profileRepo.upsert(profile as HealthProfileDaily, ['userId', 'date']);
    }

    return { imported: entities.length };
  }

  async getDerivedProfile(userId: string): Promise<HealthProfileDaily[]> {
    return this.profileRepo.find({
      where: { userId },
      order: { date: 'DESC' },
      take: 30,
    });
  }

  async deleteRawData(userId: string): Promise<void> {
    await this.rawRepo.delete({ userId });
    await this.profileRepo.delete({ userId });
  }

  async exportUserData(userId: string) {
    const [consents, profiles] = await Promise.all([
      this.consentRepo.find({ where: { userId } }),
      this.profileRepo.find({ where: { userId }, order: { date: 'DESC' } }),
    ]);
    return { consents, derivedProfiles: profiles };
  }
}
