import { Injectable } from '@nestjs/common';
import { HealthProvider, RawHealthMetrics } from './health-provider.interface';

@Injectable()
export class FitbitProvider implements HealthProvider {
  readonly providerName = 'fitbit';

  async isAvailable(): Promise<boolean> {
    return !!(process.env.FITBIT_CLIENT_ID && process.env.FITBIT_CLIENT_SECRET);
  }

  async requestPermissions(metrics: string[]): Promise<Record<string, boolean>> {
    return metrics.reduce((acc, m) => ({ ...acc, [m]: true }), {});
  }

  async fetchMetrics(_userId: string, _from: Date, _to: Date): Promise<RawHealthMetrics[]> {
    return [];
  }
}
