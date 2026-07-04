export interface PublicWellnessProfile {
  userId: string;
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

export interface CompatibilityResult {
  total: number;
  confidence: 'low' | 'medium' | 'high';
  reasons: string[];
  dimensions: { dimension: string; score: number; weight: number; reason: string }[];
}

export interface MatchCandidate extends PublicWellnessProfile {
  displayName?: string;
  ageRange?: string;
  approximateRegion?: string;
  compatibility: CompatibilityResult;
}

export interface Match {
  id: string;
  userId1: string;
  userId2: string;
  scoreCompatibility: number;
  status: 'active' | 'unmatched' | 'blocked';
  createdAt: string;
  user1?: { id: string; name: string; avatarUrl?: string };
  user2?: { id: string; name: string; avatarUrl?: string };
}

export type SwipeDirection = 'like' | 'dislike' | 'super_like';
