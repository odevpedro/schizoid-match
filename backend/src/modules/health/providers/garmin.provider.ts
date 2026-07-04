import { Injectable } from '@nestjs/common';
import { HealthProvider, RawHealthMetrics } from './health-provider.interface';

@Injectable()
export class GarminProvider implements HealthProvider {
  readonly providerName = 'garmin';

  async isAvailable(): Promise<boolean> {
    return !!(process.env.GARMIN_CLIENT_ID && process.env.GARMIN_CLIENT_SECRET);
  }

  async requestPermissions(metrics: string[]): Promise<Record<string, boolean>> {
    return metrics.reduce((acc, m) => ({ ...acc, [m]: true }), {});
  }

  async fetchMetrics(_userId: string, _from: Date, _to: Date): Promise<RawHealthMetrics[]> {
    return [];
  }
}
