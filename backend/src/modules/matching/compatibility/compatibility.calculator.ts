import { Injectable } from '@nestjs/common';
import { PublicWellnessProfile } from '../entities/public-wellness-profile.entity';
import { UserPreferences } from '../../users/entities/user-preferences.entity';

interface DimensionScore {
  dimension: string;
  score: number;
  weight: number;
  reason: string;
}

export interface CompatibilityResult {
  total: number;
  confidence: 'low' | 'medium' | 'high';
  reasons: string[];
  dimensions: DimensionScore[];
}

const WEIGHTS = {
  goals: 0.25,
  activities: 0.20,
  chronotype: 0.15,
  intensity: 0.15,
  availability: 0.15,
  consistency: 0.10,
};

@Injectable()
export class CompatibilityCalculator {
  calculate(
    profile1: PublicWellnessProfile,
    prefs1: UserPreferences,
    profile2: PublicWellnessProfile,
    prefs2: UserPreferences,
  ): CompatibilityResult {
    const dimensions: DimensionScore[] = [];

    const goals = this.scoreGoals(prefs1.wellnessGoals, prefs2.wellnessGoals);
    dimensions.push({ dimension: 'goals', score: goals, weight: WEIGHTS.goals, reason: goals >= 70 ? 'Wellness goals align well' : goals >= 40 ? 'Some common wellness goals' : 'Different wellness goals' });

    const activities = this.scoreActivities(profile1.preferredActivities, profile2.preferredActivities);
    dimensions.push({ dimension: 'activities', score: activities, weight: WEIGHTS.activities, reason: activities >= 70 ? 'Share preferred activities' : activities >= 40 ? 'Some overlapping activities' : 'Different activity preferences' });

    const chronotype = this.scoreChronotype(profile1.chronotypeBand, profile2.chronotypeBand);
    dimensions.push({ dimension: 'chronotype', score: chronotype, weight: WEIGHTS.chronotype, reason: chronotype >= 80 ? 'Similar daily energy rhythms' : chronotype >= 50 ? 'Compatible energy patterns' : 'Different chronotypes' });

    const intensity = this.scoreIntensity(profile1.intensityPreference, profile2.intensityPreference);
    dimensions.push({ dimension: 'intensity', score: intensity, weight: WEIGHTS.intensity, reason: intensity >= 70 ? 'Match on workout intensity preference' : intensity >= 40 ? 'Compatible intensity range' : 'Different intensity expectations' });

    const availability = this.scoreAvailability(profile1.availabilityPeriods, profile2.availabilityPeriods);
    dimensions.push({ dimension: 'availability', score: availability, weight: WEIGHTS.availability, reason: availability >= 70 ? 'Availability overlaps well' : availability >= 40 ? 'Some overlapping availability' : 'Different available times' });

    const consistency = this.scoreConsistency(profile1.activityConsistencyBand, profile2.activityConsistencyBand);
    dimensions.push({ dimension: 'consistency', score: consistency, weight: WEIGHTS.consistency, reason: consistency >= 70 ? 'Similar consistency in habits' : consistency >= 40 ? 'Compatible habit consistency' : 'Different habit consistency levels' });

    const total = Math.round(
      dimensions.reduce((acc, d) => acc + d.score * d.weight, 0),
    );

    const filledProfileFields = [profile1.activityLevel, profile1.chronotypeBand, profile1.sleepRoutineBand, profile1.preferredActivities?.length, profile1.wellnessGoals?.length].filter(Boolean).length;
    const confidence: 'low' | 'medium' | 'high' = filledProfileFields >= 4 ? 'high' : filledProfileFields >= 2 ? 'medium' : 'low';

    const reasons = dimensions
      .filter((d) => d.score >= 60)
      .slice(0, 3)
      .map((d) => d.reason);

    return { total, confidence, reasons, dimensions };
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
    const order = ['early', 'morning', 'flexible', 'evening', 'night'];
    const i1 = order.indexOf(c1);
    const i2 = order.indexOf(c2);
    if (i1 === -1 || i2 === -1) return 50;
    const diff = Math.abs(i1 - i2);
    const scores = [100, 80, 50, 20, 0];
    return scores[diff] ?? 0;
  }

  private scoreIntensity(i1: string, i2: string): number {
    const order = ['low', 'moderate', 'flexible', 'high'];
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

  private scoreConsistency(c1: string, c2: string): number {
    const order = ['low', 'medium', 'high'];
    const i1 = order.indexOf(c1);
    const i2 = order.indexOf(c2);
    if (i1 === -1 || i2 === -1) return 50;
    const diff = Math.abs(i1 - i2);
    return [100, 60, 20][diff] ?? 0;
  }
}
