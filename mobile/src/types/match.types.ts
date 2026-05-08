export interface PublicHealthProfile {
  userId: string;
  displayName: string;
  ageRange: string;
  wellnessTags: string[];
  badges: string[];
  activityLevel: string;
  chronotype: string;
  goals: string[];
  compatibilitySummary?: string;
  compatibilityScore?: number;
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
