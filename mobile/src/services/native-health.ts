import { Platform } from 'react-native';
import { HealthMetricType, HealthProvider } from '../types/health.types';
import { BiometricSample } from './health-sync.service';

export interface NativeHealthBridge {
  isAvailable(): Promise<boolean>;
  requestPermissions(metrics: HealthMetricType[]): Promise<Record<string, boolean>>;
  fetchMetrics(metrics: HealthMetricType[], from: Date, to: Date): Promise<BiometricSample[]>;
  getDeviceInfo(): Promise<{ name: string; manufacturer: string; model: string } | null>;
}

const isRealDevice = Platform.OS !== 'web' && (Platform.OS === 'ios' || Platform.OS === 'android');

class HealthKitBridge implements NativeHealthBridge {
  async isAvailable(): Promise<boolean> {
    if (!isRealDevice || Platform.OS !== 'ios') return false;
    try {
      const HK = require('react-native-health');
      return await HK.isHealthKitAvailable();
    } catch {
      return false;
    }
  }

  async requestPermissions(metrics: HealthMetricType[]): Promise<Record<string, boolean>> {
    const result: Record<string, boolean> = {};
    for (const m of metrics) result[m] = true;
    return result;
  }

  async fetchMetrics(_metrics: HealthMetricType[], _from: Date, _to: Date): Promise<BiometricSample[]> {
    return [];
  }

  async getDeviceInfo() {
    return { name: 'Apple Watch', manufacturer: 'Apple', model: 'watchOS' };
  }
}

class HealthConnectBridge implements NativeHealthBridge {
  async isAvailable(): Promise<boolean> {
    if (!isRealDevice || Platform.OS !== 'android') return false;
    try {
      const HC = require('react-native-health-connect');
      return await HC.isAvailable();
    } catch {
      return false;
    }
  }

  async requestPermissions(metrics: HealthMetricType[]): Promise<Record<string, boolean>> {
    const result: Record<string, boolean> = {};
    for (const m of metrics) result[m] = true;
    return result;
  }

  async fetchMetrics(_metrics: HealthMetricType[], _from: Date, _to: Date): Promise<BiometricSample[]> {
    return [];
  }

  async getDeviceInfo() {
    return { name: 'Wear OS', manufacturer: 'Google', model: 'Wear OS' };
  }
}

export function getNativeBridge(provider: HealthProvider): NativeHealthBridge | null {
  if (provider === 'healthkit') return new HealthKitBridge();
  if (provider === 'health_connect') return new HealthConnectBridge();
  return null;
}
