import { healthService } from './health.service';
import { HealthMetricType, HealthProvider } from '../types/health.types';

export interface SyncStatus {
  provider: HealthProvider;
  lastSyncAt: string | null;
  metricsCount: number;
  isSyncing: boolean;
  error: string | null;
}

export interface BiometricSample {
  type: HealthMetricType;
  value: number;
  unit: string;
  timestamp: string;
}

class HealthSyncService {
  private syncTimer: ReturnType<typeof setInterval> | null = null;
  private status: SyncStatus = {
    provider: 'simulated',
    lastSyncAt: null,
    metricsCount: 0,
    isSyncing: false,
    error: null,
  };
  private listeners: Array<(status: SyncStatus) => void> = [];

  getStatus(): SyncStatus {
    return { ...this.status };
  }

  subscribe(cb: (status: SyncStatus) => void): () => void {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  private notify() {
    const s = this.getStatus();
    this.listeners.forEach((cb) => cb(s));
  }

  private generateSample(metricType: HealthMetricType): BiometricSample {
    const now = new Date();
    const base: Record<HealthMetricType, { value: number; unit: string }> = {
      steps: { value: Math.floor(Math.random() * 2000) + 500, unit: 'count' },
      sleep: { value: Math.floor(Math.random() * 120) + 300, unit: 'minutes' },
      calories: { value: Math.floor(Math.random() * 200) + 100, unit: 'kcal' },
      heart_rate: { value: Math.floor(Math.random() * 40) + 60, unit: 'bpm' },
      hrv: { value: Math.floor(Math.random() * 50) + 20, unit: 'ms' },
      vo2max: { value: parseFloat((Math.random() * 20 + 30).toFixed(1)), unit: 'ml/kg/min' },
      stress: { value: Math.floor(Math.random() * 60) + 10, unit: 'percent' },
      blood_oxygen: { value: parseFloat((Math.random() * 4 + 96).toFixed(1)), unit: 'percent' },
      skin_temp: { value: parseFloat((Math.random() * 1.5 + 35.8).toFixed(1)), unit: 'celsius' },
    };
    const data = base[metricType];
    return {
      type: metricType,
      value: data.value,
      unit: data.unit,
      timestamp: now.toISOString(),
    };
  }

  private generateDailyMetrics(metricTypes: HealthMetricType[]): BiometricSample[] {
    const samples: BiometricSample[] = [];
    const now = new Date();
    for (const metricType of metricTypes) {
      const dailySamples = metricType === 'steps' ? 24 : metricType === 'heart_rate' ? 144 : 1;
      for (let i = 0; i < dailySamples; i++) {
        const sample = this.generateSample(metricType);
        const date = new Date(now.getTime() - i * (86400000 / dailySamples));
        sample.timestamp = date.toISOString();
        samples.push(sample);
      }
    }
    return samples;
  }

  async connect(provider: HealthProvider, metricTypes: HealthMetricType[]): Promise<void> {
    this.status = { ...this.status, isSyncing: true, error: null, provider };
    this.notify();

    try {
      await healthService.grantConsent(metricTypes, provider, 'matching_compatibility');
      const samples = this.generateDailyMetrics(metricTypes);
      await healthService.ingestMetricSamples(provider, samples);
      this.status = {
        ...this.status,
        lastSyncAt: new Date().toISOString(),
        metricsCount: samples.length,
        isSyncing: false,
        error: null,
      };
      this.notify();

      this.startAutoSync(provider, metricTypes);
    } catch (err: any) {
      this.status = {
        ...this.status,
        isSyncing: false,
        error: err?.response?.data?.message || err?.message || 'Erro ao conectar',
      };
      this.notify();
      throw err;
    }
  }

  private startAutoSync(provider: HealthProvider, metricTypes: HealthMetricType[]): void {
    if (this.syncTimer) clearInterval(this.syncTimer);
    this.syncTimer = setInterval(async () => {
      try {
        this.status = { ...this.status, isSyncing: true };
        this.notify();
        const samples = this.generateDailyMetrics(metricTypes);
        await healthService.ingestMetricSamples(provider, samples);
        this.status = {
          ...this.status,
          lastSyncAt: new Date().toISOString(),
          metricsCount: this.status.metricsCount + samples.length,
          isSyncing: false,
          error: null,
        };
        this.notify();
      } catch {
        this.status = { ...this.status, isSyncing: false, error: 'Falha na sincronia automática' };
        this.notify();
      }
    }, 120000);
  }

  stopSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
    this.status = { ...this.status, isSyncing: false };
    this.notify();
  }
}

export const healthSyncService = new HealthSyncService();
