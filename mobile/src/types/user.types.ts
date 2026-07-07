export interface User {
  id: string;
  email: string;
  name: string;
  role?: 'user' | 'moderator' | 'admin';
  birthdate?: string;
  genderOptional?: string;
  bio?: string;
  locationRegion?: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface UserPreferences {
  userId: string;
  wellnessGoals: string[];
  preferredActivities: string[];
  preferredIntensity: 'low' | 'moderate' | 'high' | 'very_high';
  availabilityPeriods: string[];
  maxDistanceKm: number;
  chronotypePreference?: string;
  showPhotosAfterMatch: boolean;
}

export type WellnessGoal =
  | 'fitness'
  | 'weight_loss'
  | 'stress_reduction'
  | 'better_sleep'
  | 'social_activity'
  | 'mindfulness'
  | 'nutrition'
  | 'flexibility';

export type ActivityType =
  | 'running'
  | 'cycling'
  | 'yoga'
  | 'swimming'
  | 'hiking'
  | 'gym'
  | 'walking'
  | 'dancing'
  | 'pilates'
  | 'crossfit';
