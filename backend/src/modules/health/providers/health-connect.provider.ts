import { Injectable } from '@nestjs/common';
import { HealthProvider, RawHealthMetrics } from './health-provider.interface';

@Injectable()
export class HealthConnectProvider implements HealthProvider {
  readonly providerName = 'health_connect';

  async isAvailable(): Promise<boolean> {
    return false;
  }

  async requestPermissions(metrics: string[]): Promise<Record<string, boolean>> {
    return metrics.reduce((acc, m) => ({ ...acc, [m]: false }), {});
  }

  async fetchMetrics(_userId: string, _from: Date, _to: Date): Promise<RawHealthMetrics[]> {
    return [];
  }
}
