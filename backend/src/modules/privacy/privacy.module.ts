import { Module } from '@nestjs/common';
import { PrivacyService } from './privacy.service';
import { PrivacyController } from './privacy.controller';
import { UsersModule } from '../users/users.module';
import { HealthModule } from '../health/health.module';

@Module({
  imports: [UsersModule, HealthModule],
  providers: [PrivacyService],
  controllers: [PrivacyController],
})
export class PrivacyModule {}
