import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './api';
import { ConsentRecord, HealthMetricType, HealthProfileDaily, HealthProvider } from '../types/health.types';
import { DEMO_TOKEN, mockConsents, mockHealthProfile } from './mock-data';

const isDemo = async () => (await AsyncStorage.getItem('@wellmatch:token')) === DEMO_TOKEN;

export const healthService = {
  async grantConsent(metricTypes: HealthMetricType[], sourceProvider: HealthProvider): Promise<ConsentRecord[]> {
    if (await isDemo()) return metricTypes.map((m, i) => ({ id: `c${i}`, userId: 'demo', metricType: m, permissionStatus: 'granted' as const, grantedAt: new Date().toISOString(), sourceProvider: 'simulated' }));
    return api.post('/health/consent/grant', { metricTypes, sourceProvider }) as any;
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
    return api.post('/health/ingest', { provider, fromDate, toDate }) as any;
  },

  async getDerivedProfile(): Promise<HealthProfileDaily[]> {
    if (await isDemo()) return [mockHealthProfile];
    return api.get('/health/profile') as any;
  },
};
