import { storage } from './storage';
import { api } from './api';
import { ConsentRecord, HealthDashboardData, HealthMetricType, HealthProfileDaily, HealthProvider } from '../types/health.types';
import { DEMO_TOKEN, mockConsents, mockHealthProfile } from './mock-data';

const isDemo = async () => (await storage.getItem('@wellmatch:token')) === DEMO_TOKEN;

export const healthService = {
  async grantConsent(metricTypes: HealthMetricType[], sourceProvider: HealthProvider, purpose?: string): Promise<ConsentRecord[]> {
    if (await isDemo()) return metricTypes.map((m, i) => ({ id: `c${i}`, userId: 'demo', metricType: m, permissionStatus: 'granted' as const, grantedAt: new Date().toISOString(), sourceProvider: 'simulated' }));
    return api.post('/health/consent/grant', { metricTypes, sourceProvider, purpose: purpose || 'matching_compatibility' }) as any;
  },

  async revokeConsent(metricTypes: HealthMetricType[]): Promise<void> {
    if (await isDemo()) return;
    return api.post('/health/consent/revoke', { metricTypes }) as any;
  },

  async getConsents(): Promise<ConsentRecord[]> {
    if (await isDemo()) return mockConsents;
    return api.get('/health/consent') as any;
  },

  async ingestMetrics(provider: HealthProvider, fromDate?: string, toDate?: string): Promise<{ imported: number }> {
    if (await isDemo()) return { imported: 0 };
    return api.post('/health/ingest', { provider, fromDate, toDate }) as any;
  },

  async ingestMetricSamples(
    provider: HealthProvider,
    metrics: Array<{ type: HealthMetricType; value: number; unit: string; timestamp: string }>,
  ): Promise<{ imported?: number; ingested?: number }> {
    if (await isDemo()) return { imported: metrics.length };
    return api.post('/health/ingest', { provider, metrics }) as any;
  },

  async getDerivedProfile(): Promise<HealthProfileDaily[]> {
    if (await isDemo()) return [mockHealthProfile];
    return api.get('/health/profile') as any;
  },

  async getDashboardData(): Promise<HealthDashboardData> {
    if (await isDemo()) {
      return {
        today: { steps: 0, sleepMinutes: 0, calories: 0, avgHeartRate: 0, hrv: 0, stressLevel: 0 },
        weekly: { avgSteps: 0, avgSleep: 0, activeDays: 0 },
        source: 'demo',
        lastSync: null,
      };
    }
    return api.get('/health/dashboard') as any;
  },
};
