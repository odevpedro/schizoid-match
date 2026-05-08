export interface RawHealthMetrics {
  heartRateBpm?: number;
  hrvMs?: number;
  steps?: number;
  calories?: number;
  vo2max?: number;
  sleepMinutes?: number;
  sleepScore?: number;
  stressLevel?: number;
  bloodOxygen?: number;
  skinTemp?: number;
  timestamp: Date;
  sourceProvider: string;
}

export interface HealthProvider {
  readonly providerName: string;
  isAvailable(): Promise<boolean>;
  requestPermissions(metrics: string[]): Promise<Record<string, boolean>>;
  fetchMetrics(userId: string, from: Date, to: Date): Promise<RawHealthMetrics[]>;
}

export type HealthMetricType =
  | 'heart_rate'
  | 'hrv'
  | 'steps'
  | 'calories'
  | 'vo2max'
  | 'sleep'
  | 'stress'
  | 'blood_oxygen'
  | 'skin_temp';

export const ALL_METRIC_TYPES: HealthMetricType[] = [
  'heart_rate', 'hrv', 'steps', 'calories', 'vo2max',
  'sleep', 'stress', 'blood_oxygen', 'skin_temp',
];
