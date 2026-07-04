import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PrivacyService } from './privacy.service';
import { PrivacyController } from './privacy.controller';
import { UsersModule } from '../users/users.module';
import { HealthModule } from '../health/health.module';
import { PublicWellnessProfile } from '../matching/entities/public-wellness-profile.entity';
import { Match } from '../matching/entities/match.entity';
import { HealthMetricsRaw } from '../health/entities/health-metrics-raw.entity';
import { HealthProfileDaily } from '../health/entities/health-profile-daily.entity';
import { ConsentRecord } from '../health/entities/consent-record.entity';
import { PrivacyRetentionService } from './privacy-retention.service';

@Module({
  imports: [
    UsersModule,
    HealthModule,
    TypeOrmModule.forFeature([PublicWellnessProfile, Match, HealthMetricsRaw, HealthProfileDaily, ConsentRecord]),
  ],
  providers: [PrivacyService, PrivacyRetentionService],
  controllers: [PrivacyController],
  exports: [PrivacyService],
})
export class PrivacyModule {}
