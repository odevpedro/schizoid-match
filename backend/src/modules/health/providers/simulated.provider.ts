import { Injectable } from '@nestjs/common';
import { HealthProvider, RawHealthMetrics } from './health-provider.interface';

@Injectable()
export class SimulatedProvider implements HealthProvider {
  readonly providerName = 'simulated';

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async requestPermissions(metrics: string[]): Promise<Record<string, boolean>> {
    return metrics.reduce((acc, m) => ({ ...acc, [m]: true }), {});
  }

  async fetchMetrics(userId: string, from: Date, to: Date): Promise<RawHealthMetrics[]> {
    const seed = this.hashUserId(userId);
    const results: RawHealthMetrics[] = [];
    const dayMs = 86400000;
    const days = Math.ceil((to.getTime() - from.getTime()) / dayMs);

    for (let i = 0; i < days; i++) {
      const date = new Date(from.getTime() + i * dayMs);
      const daySeed = seed + i;

      results.push({
        timestamp: date,
        sourceProvider: this.providerName,
        steps: this.seededRandom(daySeed, 4000, 14000),
        calories: this.seededRandom(daySeed + 1, 1400, 3200),
        heartRateBpm: this.seededRandom(daySeed + 2, 55, 90),
        hrvMs: this.seededRandomFloat(daySeed + 3, 25, 75),
        sleepMinutes: this.seededRandom(daySeed + 4, 300, 540),
        sleepScore: this.seededRandomFloat(daySeed + 5, 45, 92),
        stressLevel: this.seededRandomFloat(daySeed + 6, 10, 70),
        bloodOxygen: this.seededRandomFloat(daySeed + 7, 95, 100),
        skinTemp: this.seededRandomFloat(daySeed + 8, 35.5, 37.2),
        vo2max: this.seededRandomFloat(daySeed + 9, 28, 55),
      });
    }

    return results;
  }

  private hashUserId(userId: string): number {
    return userId.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  }

  private seededRandom(seed: number, min: number, max: number): number {
    const x = Math.sin(seed) * 10000;
    const rand = x - Math.floor(x);
    return Math.floor(rand * (max - min + 1)) + min;
  }

  private seededRandomFloat(seed: number, min: number, max: number): number {
    const x = Math.sin(seed + 0.5) * 10000;
    const rand = x - Math.floor(x);
    return parseFloat((rand * (max - min) + min).toFixed(2));
  }
}
