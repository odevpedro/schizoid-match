import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthService } from './health.service';
import { HealthController } from './health.controller';
import { HealthMetricsRaw } from './entities/health-metrics-raw.entity';
import { HealthProfileDaily } from './entities/health-profile-daily.entity';
import { ConsentRecord } from './entities/consent-record.entity';
import { PublicWellnessProfile } from '../matching/entities/public-wellness-profile.entity';
import { SimulatedProvider } from './providers/simulated.provider';
import { HealthProviderFactory } from './providers/health-provider.factory';
import { HealthProfileProcessor } from './processors/health-profile.processor';

@Module({
  imports: [TypeOrmModule.forFeature([HealthMetricsRaw, HealthProfileDaily, ConsentRecord, PublicWellnessProfile])],
  providers: [HealthService, SimulatedProvider, HealthProviderFactory, HealthProfileProcessor],
  controllers: [HealthController],
  exports: [HealthService],
})
export class HealthModule {}
