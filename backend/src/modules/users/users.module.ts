import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { UserPreferences } from './entities/user-preferences.entity';
import { PublicWellnessProfile } from '../matching/entities/public-wellness-profile.entity';
import { OnboardingService } from './onboarding.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserPreferences, PublicWellnessProfile])],
  providers: [UsersService, OnboardingService],
  controllers: [UsersController],
  exports: [UsersService, OnboardingService],
})
export class UsersModule {}
