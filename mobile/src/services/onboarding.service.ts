import { api } from './api';

export interface OnboardingStatus {
  completed: boolean;
  step: number;
  profile: any;
}

export interface PublicWellnessProfile {
  userId: string;
  displayName?: string;
  ageRange?: string;
  approximateRegion?: string;
  activityLevel: string | null;
  activityConsistencyBand: string | null;
  sleepRoutineBand: string | null;
  chronotypeBand: string | null;
  intensityPreference: string | null;
  mainIntention: string | null;
  preferredActivities: string[];
  wellnessGoals: string[];
  availabilityPeriods: string[];
  publicBadges: string[];
  scoreConfidence: 'low' | 'medium' | 'high';
  source: string;
  isVisible: boolean;
  onboardingCompleted: boolean;
}

export const onboardingService = {
  async getStatus(): Promise<OnboardingStatus> {
    return api.get('/users/onboarding/status');
  },

  async getWellnessProfile(): Promise<PublicWellnessProfile | null> {
    try {
      const result = await api.get('/users/me/wellness-profile');
      return result as any;
    } catch {
      return null;
    }
  },

  async saveStep1(data: { mainIntention: string }) {
    return api.post('/users/onboarding/step1', data);
  },

  async saveStep2(data: { wellnessGoals: string[] }) {
    return api.post('/users/onboarding/step2', data);
  },

  async saveStep3(data: { preferredActivities: string[] }) {
    return api.post('/users/onboarding/step3', data);
  },

  async saveStep4(data: { availabilityPeriods: string[] }) {
    return api.post('/users/onboarding/step4', data);
  },

  async saveStep5(data: { intensityPreference: string }) {
    return api.post('/users/onboarding/step5', data);
  },

  async saveStep6(data: {
    showPhotosAfterMatch?: boolean;
    shareActivityLevel?: boolean;
    shareSleepRoutine?: boolean;
  }) {
    return api.post('/users/onboarding/step6', data);
  },

  async saveStep7(data: {
    source: 'manual' | 'simulated';
    manualActivityLevel?: string;
    manualSleepRoutine?: string;
    manualChronotype?: string;
  }) {
    return api.post('/users/onboarding/step7', data);
  },
};
