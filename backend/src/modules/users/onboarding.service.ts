import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserPreferences } from './entities/user-preferences.entity';
import { PublicWellnessProfile } from '../matching/entities/public-wellness-profile.entity';
import {
  OnboardingStep1Dto, OnboardingStep2Dto, OnboardingStep3Dto,
  OnboardingStep4Dto, OnboardingStep5Dto, OnboardingStep6Dto, OnboardingStep7Dto,
} from './dto/onboarding.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class OnboardingService {
  constructor(
    @InjectRepository(UserPreferences)
    private readonly prefsRepo: Repository<UserPreferences>,
    @InjectRepository(PublicWellnessProfile)
    private readonly wellnessRepo: Repository<PublicWellnessProfile>,
    private readonly auditService: AuditService,
  ) {}

  async saveStep1(userId: string, dto: OnboardingStep1Dto): Promise<void> {
    const existing = await this.prefsRepo.findOne({ where: { userId } });
    if (existing) {
      await this.prefsRepo.update({ userId }, {});
      return;
    }
    await this.prefsRepo.insert({ userId, wellnessGoals: [] });
  }

  async saveStep2(userId: string, dto: OnboardingStep2Dto): Promise<void> {
    await this.prefsRepo.update({ userId }, { wellnessGoals: dto.wellnessGoals });
  }

  async saveStep3(userId: string, dto: OnboardingStep3Dto): Promise<void> {
    await this.prefsRepo.update({ userId }, { preferredActivities: dto.preferredActivities });
  }

  async saveStep4(userId: string, dto: OnboardingStep4Dto): Promise<void> {
    await this.prefsRepo.update({ userId }, { availabilityPeriods: dto.availabilityPeriods });
  }

  async saveStep5(userId: string, dto: OnboardingStep5Dto): Promise<void> {
    await this.prefsRepo.update({ userId }, { preferredIntensity: dto.intensityPreference });
  }

  async saveStep6(userId: string, dto: OnboardingStep6Dto): Promise<void> {
    await this.prefsRepo.update(
      { userId },
      { showPhotosAfterMatch: dto.showPhotosAfterMatch ?? true },
    );
  }

  async saveStep7(userId: string, dto: OnboardingStep7Dto): Promise<void> {
    const prefs = await this.prefsRepo.findOne({ where: { userId } });
    if (!prefs || !prefs.wellnessGoals?.length) {
      throw new BadRequestException('Complete onboarding steps 1-6 before finishing');
    }

    const existing = await this.wellnessRepo.findOne({ where: { userId } });

    const profile = existing ?? this.wellnessRepo.create({ userId });

    profile.activityLevel = dto.manualActivityLevel
      ? this.mapActivityLevel(dto.manualActivityLevel)
      : 'moderate';
    profile.sleepRoutineBand = dto.manualSleepRoutine
      ? this.mapSleepRoutine(dto.manualSleepRoutine)
      : 'regular';
    profile.chronotypeBand = dto.manualChronotype
      ? this.mapChronotype(dto.manualChronotype)
      : 'flexible';
    profile.activityConsistencyBand = 'medium';
    profile.intensityPreference = this.mapIntensity(prefs.preferredIntensity);
    profile.preferredActivities = prefs.preferredActivities ?? [];
    profile.wellnessGoals = prefs.wellnessGoals ?? [];
    profile.availabilityPeriods = prefs.availabilityPeriods ?? [];
    profile.publicBadges = [];
    profile.scoreConfidence = dto.source === 'manual' ? 'medium' : 'low';
    profile.source = dto.source === 'manual' ? 'manual' : 'mixed';
    profile.isVisible = true;
    profile.onboardingCompleted = true;
    profile.mainIntention = prefs.wellnessGoals?.[0] ?? 'social_connection';

    await this.wellnessRepo.save(profile);
    await this.auditService.record({ userId, eventType: 'onboarding_completed', metadata: { source: dto.source, scoreConfidence: profile.scoreConfidence } });
  }

  async getOnboardingStatus(userId: string): Promise<{ completed: boolean; step: number; profile: PublicWellnessProfile | null }> {
    const profile = await this.wellnessRepo.findOne({ where: { userId } });
    if (profile?.onboardingCompleted) {
      return { completed: true, step: 7, profile };
    }
    const prefs = await this.prefsRepo.findOne({ where: { userId } });
    if (!prefs) return { completed: false, step: 0, profile: null };
    if (!prefs.wellnessGoals?.length) return { completed: false, step: 2, profile: null };
    if (!prefs.preferredActivities?.length) return { completed: false, step: 3, profile: null };
    if (!prefs.availabilityPeriods?.length) return { completed: false, step: 4, profile: null };
    return { completed: false, step: 5, profile: null };
  }

  private mapActivityLevel(level: string): 'low' | 'moderate' | 'active' | 'very_active' {
    const map = { sedentary: 'low' as const, lightly_active: 'low' as const, moderately_active: 'moderate' as const, active: 'active' as const, very_active: 'very_active' as const };
    return map[level] ?? 'moderate';
  }

  private mapSleepRoutine(routine: string): 'irregular' | 'regular' | 'consistent' {
    const map = { poor: 'irregular' as const, fair: 'irregular' as const, good: 'regular' as const, great: 'regular' as const, excellent: 'consistent' as const };
    return map[routine] ?? 'regular';
  }

  private mapChronotype(chronotype: string): 'early' | 'morning' | 'flexible' | 'evening' | 'night' {
    const map = { early_bird: 'early' as const, morning: 'morning' as const, intermediate: 'flexible' as const, afternoon: 'evening' as const, night_owl: 'night' as const };
    return map[chronotype] ?? 'flexible';
  }

  private mapIntensity(intensity: string): 'low' | 'moderate' | 'high' | 'flexible' {
    const valid = ['low', 'moderate', 'high', 'flexible'];
    return valid.includes(intensity) ? intensity as any : 'moderate';
  }
}
