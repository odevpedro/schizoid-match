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

export const METRIC_UNITS: Record<HealthMetricType, string> = {
  steps: 'passos',
  sleep: 'min',
  calories: 'kcal',
  heart_rate: 'bpm',
  hrv: 'ms',
  vo2max: 'ml/kg/min',
  stress: '%',
  blood_oxygen: '%',
  skin_temp: '°C',
};

export const METRIC_LABELS: Record<HealthMetricType, string> = {
  steps: 'Passos',
  sleep: 'Sono',
  calories: 'Calorias',
  heart_rate: 'Freq. Cardíaca',
  hrv: 'Variabilidade Cardíaca',
  vo2max: 'VO2 Máx',
  stress: 'Estresse',
  blood_oxygen: 'Oxigenação',
  skin_temp: 'Temperatura',
};

export interface ConsentRecord {
  id: string;
  userId: string;
  metricType: HealthMetricType;
  permissionStatus: 'granted' | 'revoked' | 'pending';
  purpose?: string;
  consentVersion?: string;
  grantedAt?: string;
  revokedAt?: string;
  sourceProvider: string;
}

export interface HealthProfileDaily {
  id: string;
  userId: string;
  date: string;
  activityLevel: string;
  avgStepsBand: string;
  sleepQualityBand: string;
  chronotype: string;
  recoveryBand: string;
  stressBand: string;
  cardioFitnessBand: string;
  consistencyScore: number;
}

export interface HealthDashboardData {
  today: {
    steps: number;
    sleepMinutes: number;
    calories: number;
    avgHeartRate: number;
    hrv: number;
    stressLevel: number;
  };
  weekly: {
    avgSteps: number;
    avgSleep: number;
    activeDays: number;
  };
  source: string | null;
  lastSync: string | null;
}

export type HealthProvider = 'simulated' | 'healthkit' | 'health_connect' | 'garmin' | 'fitbit';
