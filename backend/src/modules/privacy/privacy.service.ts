import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import { HealthService } from '../health/health.service';
import { PublicWellnessProfile } from '../matching/entities/public-wellness-profile.entity';
import { Match } from '../matching/entities/match.entity';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class PrivacyService {
  constructor(
    private readonly usersService: UsersService,
    private readonly healthService: HealthService,
    @InjectRepository(PublicWellnessProfile)
    private readonly wellnessRepo: Repository<PublicWellnessProfile>,
    @InjectRepository(Match)
    private readonly matchRepo: Repository<Match>,
    private readonly auditService: AuditService,
  ) {}

  async exportUserData(userId: string) {
    const [user, healthData, wellnessProfile] = await Promise.all([
      this.usersService.getPublicProfile(userId),
      this.healthService.exportUserData(userId),
      this.wellnessRepo.findOne({ where: { userId } }),
    ]);

    await this.auditService.record({ userId, eventType: 'privacy_export_requested' });
    return {
      exportedAt: new Date().toISOString(),
      userId,
      userData: user,
      wellnessProfile,
      healthData,
    };
  }

  async deleteHealthData(userId: string): Promise<void> {
    await this.healthService.deleteRawData(userId);
    await this.auditService.record({ userId, eventType: 'health_data_deleted' });
  }

  async deleteAccount(userId: string): Promise<void> {
    await this.healthService.deleteRawData(userId);
    await this.wellnessRepo.delete({ userId });
    await this.matchRepo.update(
      { userId1: userId },
      { status: 'unmatched' },
    );
    await this.matchRepo.update(
      { userId2: userId },
      { status: 'unmatched' },
    );
    await this.usersService.softDelete(userId);
    await this.auditService.record({ userId, eventType: 'account_deleted' });
  }
}
