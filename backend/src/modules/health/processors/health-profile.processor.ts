import { Injectable } from '@nestjs/common';
import { RawHealthMetrics } from '../providers/health-provider.interface';
import { HealthProfileDaily } from '../entities/health-profile-daily.entity';

interface DerivedProfile {
  activityLevel: string;
  avgStepsBand: string;
  sleepQualityBand: string;
  chronotype: string;
  recoveryBand: string;
  stressBand: string;
  cardioFitnessBand: string;
  consistencyScore: number;
}

@Injectable()
export class HealthProfileProcessor {
  processMetrics(userId: string, metrics: RawHealthMetrics[]): Partial<HealthProfileDaily>[] {
    const byDate = this.groupByDate(metrics);
    return Object.entries(byDate).map(([date, dayMetrics]) => ({
      userId,
      date,
      ...this.deriveProfile(dayMetrics),
    }));
  }

  private groupByDate(metrics: RawHealthMetrics[]): Record<string, RawHealthMetrics[]> {
    return metrics.reduce((acc, m) => {
      const date = m.timestamp.toISOString().split('T')[0];
      if (!acc[date]) acc[date] = [];
      acc[date].push(m);
      return acc;
    }, {} as Record<string, RawHealthMetrics[]>);
  }

  private deriveProfile(metrics: RawHealthMetrics[]): DerivedProfile {
    const avg = <K extends keyof RawHealthMetrics>(key: K): number => {
      const values = metrics.map((m) => m[key] as number).filter((v) => v != null);
      if (!values.length) return 0;
      return values.reduce((a, b) => a + b, 0) / values.length;
    };

    const avgSteps = avg('steps');
    const avgSleepScore = avg('sleepScore');
    const avgStress = avg('stressLevel');
    const avgHrv = avg('hrvMs');
    const avgVo2 = avg('vo2max');

    return {
      activityLevel: this.classifyActivityLevel(avgSteps),
      avgStepsBand: this.classifySteps(avgSteps),
      sleepQualityBand: this.classifySleep(avgSleepScore),
      chronotype: this.inferChronotype(metrics),
      recoveryBand: this.classifyRecovery(avgHrv),
      stressBand: this.classifyStress(avgStress),
      cardioFitnessBand: this.classifyCardio(avgVo2),
      consistencyScore: this.calculateConsistency(metrics),
    };
  }

  private classifySteps(steps: number): string {
    if (steps < 3000) return 'very_low';
    if (steps < 6000) return 'low';
    if (steps < 9000) return 'moderate';
    if (steps < 12000) return 'high';
    return 'very_high';
  }

  private classifyActivityLevel(steps: number): string {
    if (steps < 4000) return 'sedentary';
    if (steps < 7000) return 'lightly_active';
    if (steps < 10000) return 'moderately_active';
    if (steps < 13000) return 'active';
    return 'very_active';
  }

  private classifySleep(score: number): string {
    if (score < 40) return 'poor';
    if (score < 60) return 'fair';
    if (score < 75) return 'good';
    if (score < 85) return 'great';
    return 'excellent';
  }

  private classifyRecovery(hrv: number): string {
    if (hrv < 20) return 'low';
    if (hrv < 40) return 'fair';
    if (hrv < 60) return 'good';
    return 'excellent';
  }

  private classifyStress(stress: number): string {
    if (stress < 30) return 'low';
    if (stress < 60) return 'moderate';
    if (stress < 80) return 'high';
    return 'very_high';
  }

  private classifyCardio(vo2max: number): string {
    if (vo2max < 30) return 'below_average';
    if (vo2max < 40) return 'average';
    if (vo2max < 48) return 'above_average';
    if (vo2max < 55) return 'excellent';
    return 'superior';
  }

  private inferChronotype(metrics: RawHealthMetrics[]): string {
    // Simplified: use first data point hour as proxy
    if (!metrics.length) return 'flexible';
    const hour = metrics[0].timestamp.getHours();
    if (hour < 8) return 'early_bird';
    if (hour < 10) return 'morning';
    if (hour < 14) return 'intermediate';
    if (hour < 18) return 'afternoon';
    return 'night_owl';
  }

  private calculateConsistency(metrics: RawHealthMetrics[]): number {
    if (metrics.length < 2) return 50;
    const steps = metrics.map((m) => m.steps || 0);
    const mean = steps.reduce((a, b) => a + b, 0) / steps.length;
    if (mean === 0) return 0;
    const variance = steps.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / steps.length;
    const cv = Math.sqrt(variance) / mean;
    return Math.max(0, Math.min(100, Math.round((1 - cv) * 100)));
  }
}
