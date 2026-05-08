import { Injectable } from '@nestjs/common';
import { PublicHealthProfile } from '../entities/public-health-profile.entity';
import { UserPreferences } from '../../users/entities/user-preferences.entity';

interface CompatibilityBreakdown {
  total: number;
  goals: number;
  activities: number;
  chronotype: number;
  intensity: number;
  availability: number;
  distance: number;
  consistency: number;
}

const WEIGHTS = {
  goals: 0.25,
  activities: 0.20,
  chronotype: 0.15,
  intensity: 0.15,
  availability: 0.10,
  distance: 0.10,
  consistency: 0.05,
};

@Injectable()
export class CompatibilityCalculator {
  calculate(
    profile1: PublicHealthProfile,
    prefs1: UserPreferences,
    profile2: PublicHealthProfile,
    prefs2: UserPreferences,
    distanceKm?: number,
  ): CompatibilityBreakdown {
    const goals = this.scoreGoals(prefs1.wellnessGoals, prefs2.wellnessGoals);
    const activities = this.scoreActivities(prefs1.preferredActivities, prefs2.preferredActivities);
    const chronotype = this.scoreChronotype(profile1.chronotype, profile2.chronotype);
    const intensity = this.scoreIntensity(prefs1.preferredIntensity, prefs2.preferredIntensity);
    const availability = this.scoreAvailability(prefs1.availabilityPeriods, prefs2.availabilityPeriods);
    const distance = this.scoreDistance(distanceKm, Math.min(prefs1.maxDistanceKm, prefs2.maxDistanceKm));
    const consistency = this.scoreConsistency(profile1.activityLevel, profile2.activityLevel);

    const total = Math.round(
      goals * WEIGHTS.goals +
      activities * WEIGHTS.activities +
      chronotype * WEIGHTS.chronotype +
      intensity * WEIGHTS.intensity +
      availability * WEIGHTS.availability +
      distance * WEIGHTS.distance +
      consistency * WEIGHTS.consistency,
    );

    return { total, goals, activities, chronotype, intensity, availability, distance, consistency };
  }

  private scoreGoals(goals1: string[], goals2: string[]): number {
    if (!goals1?.length || !goals2?.length) return 50;
    const intersection = goals1.filter((g) => goals2.includes(g));
    const union = new Set([...goals1, ...goals2]).size;
    return Math.round((intersection.length / union) * 100);
  }

  private scoreActivities(acts1: string[], acts2: string[]): number {
    if (!acts1?.length || !acts2?.length) return 50;
    const intersection = acts1.filter((a) => acts2.includes(a));
    const union = new Set([...acts1, ...acts2]).size;
    return Math.round((intersection.length / union) * 100);
  }

  private scoreChronotype(c1: string, c2: string): number {
    if (!c1 || !c2) return 50;
    const order = ['early_bird', 'morning', 'intermediate', 'afternoon', 'night_owl'];
    const i1 = order.indexOf(c1);
    const i2 = order.indexOf(c2);
    if (i1 === -1 || i2 === -1) return 50;
    const diff = Math.abs(i1 - i2);
    const scores = [100, 80, 50, 20, 0];
    return scores[diff] ?? 0;
  }

  private scoreIntensity(i1: string, i2: string): number {
    const order = ['low', 'moderate', 'high', 'very_high'];
    const idx1 = order.indexOf(i1);
    const idx2 = order.indexOf(i2);
    if (idx1 === -1 || idx2 === -1) return 50;
    const diff = Math.abs(idx1 - idx2);
    return [100, 70, 30, 0][diff] ?? 0;
  }

  private scoreAvailability(a1: string[], a2: string[]): number {
    if (!a1?.length || !a2?.length) return 50;
    const intersection = a1.filter((p) => a2.includes(p));
    const union = new Set([...a1, ...a2]).size;
    return Math.round((intersection.length / union) * 100);
  }

  private scoreDistance(distanceKm?: number, maxKm = 50): number {
    if (distanceKm == null) return 70;
    if (distanceKm > maxKm) return 0;
    return Math.round((1 - distanceKm / maxKm) * 100);
  }

  private scoreConsistency(level1: string, level2: string): number {
    const order = ['sedentary', 'lightly_active', 'moderately_active', 'active', 'very_active'];
    const i1 = order.indexOf(level1);
    const i2 = order.indexOf(level2);
    if (i1 === -1 || i2 === -1) return 50;
    const diff = Math.abs(i1 - i2);
    return [100, 75, 50, 25, 0][diff] ?? 0;
  }
}
