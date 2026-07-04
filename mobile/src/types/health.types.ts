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

export type HealthProvider = 'simulated' | 'healthkit' | 'health_connect' | 'garmin' | 'fitbit';
