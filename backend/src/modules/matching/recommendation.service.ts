import { Injectable } from '@nestjs/common';

interface SwipeRecord {
  targetUserId: string;
  direction: 'like' | 'dislike' | 'super_like';
  timestamp: Date;
}

interface TermVector {
  terms: Map<string, number>;
  magnitude: number;
}

const WELLNESS_FIELDS: (keyof WellnessProfile)[] = [
  'wellnessGoals',
  'preferredActivities',
  'availabilityPeriods',
  'publicBadges',
  'mainIntention',
];

interface WellnessProfile {
  wellnessGoals: string[];
  preferredActivities: string[];
  availabilityPeriods: string[];
  publicBadges: string[];
  mainIntention: string;
  chronotypeBand: string;
  intensityPreference: string;
  activityConsistencyBand: string;
}

@Injectable()
export class RecommendationService {
  private readonly interactions = new Map<string, SwipeRecord[]>();

  async getRecommendedOrder(
    userId: string,
    candidates: any[],
  ): Promise<any[]> {
    const userSwipes = this.interactions.get(userId) || [];

    const likedProfiles = userSwipes
      .filter((s) => s.direction === 'like' || s.direction === 'super_like')
      .map((s) => s.targetUserId);

    const dislikedProfiles = userSwipes
      .filter((s) => s.direction === 'dislike')
      .map((s) => s.targetUserId);

    const scored = candidates.map((candidate) => {
      let score = 0;

      const profile = candidate as WellnessProfile;
      const embedding = this.buildEmbedding(profile);

      for (const likedId of likedProfiles) {
        const liked = candidates.find((c) => c.userId === likedId);
        if (liked) {
          score += this.calculateEmbeddingSimilarity(embedding, this.buildEmbedding(liked as WellnessProfile));
        }
      }

      for (const dislikedId of dislikedProfiles) {
        const disliked = candidates.find((c) => c.userId === dislikedId);
        if (disliked) {
          score -= this.calculateEmbeddingSimilarity(embedding, this.buildEmbedding(disliked as WellnessProfile));
        }
      }

      const likeFrequency = userSwipes.filter(
        (s) => s.targetUserId === candidate.userId,
      ).length;
      if (likeFrequency > 0) {
        score += likeFrequency * 10;
      }

      return { candidate, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.map((s) => s.candidate);
  }

  async recordInteraction(
    userId: string,
    targetUserId: string,
    direction: string,
  ): Promise<void> {
    if (!this.interactions.has(userId)) {
      this.interactions.set(userId, []);
    }
    this.interactions.get(userId)!.push({
      targetUserId,
      direction: direction as SwipeRecord['direction'],
      timestamp: new Date(),
    });
  }

  calculateEmbeddingSimilarity(profile1: any, profile2: any): number {
    const vec1 = this.buildEmbedding(profile1);
    const vec2 = this.buildEmbedding(profile2);

    if (vec1.magnitude === 0 || vec2.magnitude === 0) return 0;

    let dotProduct = 0;
    for (const [term, freq] of vec1.terms) {
      const otherFreq = vec2.terms.get(term) || 0;
      dotProduct += freq * otherFreq;
    }

    return dotProduct / (vec1.magnitude * vec2.magnitude);
  }

  collaborativeFilter(userId: string, allUsers: any[]): any[] {
    const userSwipes = this.interactions.get(userId) || [];
    const userLikeIds = new Set(
      userSwipes
        .filter((s) => s.direction === 'like' || s.direction === 'super_like')
        .map((s) => s.targetUserId),
    );

    if (userLikeIds.size === 0) return [];

    const similarityScores = new Map<string, number>();

    for (const otherUser of allUsers) {
      if (otherUser.id === userId || otherUser.userId === userId) continue;

      const otherSwipes = this.interactions.get(otherUser.id || otherUser.userId) || [];
      const otherLikeIds = new Set(
        otherSwipes
          .filter((s) => s.direction === 'like' || s.direction === 'super_like')
          .map((s) => s.targetUserId),
      );

      if (otherLikeIds.size === 0) continue;

      let intersection = 0;
      for (const id of userLikeIds) {
        if (otherLikeIds.has(id)) intersection++;
      }

      if (intersection > 0) {
        const similarity =
          intersection /
          Math.sqrt(userLikeIds.size * otherLikeIds.size);
        similarityScores.set(otherUser.id || otherUser.userId, similarity);
      }
    }

    const recommended = new Map<string, { profile: any; score: number }>();

    for (const otherUser of allUsers) {
      const otherId = otherUser.id || otherUser.userId;
      const similarity = similarityScores.get(otherId);
      if (!similarity) continue;

      const otherSwipes = this.interactions.get(otherId) || [];
      for (const swipe of otherSwipes) {
        if (
          (swipe.direction === 'like' || swipe.direction === 'super_like') &&
          !userLikeIds.has(swipe.targetUserId) &&
          swipe.targetUserId !== userId
        ) {
          const existing = recommended.get(swipe.targetUserId);
          const contribution = similarity * 100;
          if (existing) {
            existing.score += contribution;
          } else {
            const profile = allUsers.find(
              (u) => (u.id || u.userId) === swipe.targetUserId,
            );
            if (profile) {
              recommended.set(swipe.targetUserId, {
                profile,
                score: contribution,
              });
            }
          }
        }
      }
    }

    return Array.from(recommended.values())
      .sort((a, b) => b.score - a.score)
      .map((r) => r.profile);
  }

  private buildEmbedding(profile: any): TermVector {
    const terms = new Map<string, number>();
    const allTokens: string[] = [];

    for (const field of WELLNESS_FIELDS) {
      const value = profile[field];
      if (Array.isArray(value)) {
        for (const item of value) {
          allTokens.push(this.normalize(item));
        }
      } else if (typeof value === 'string') {
        allTokens.push(this.normalize(value));
      }
    }

    const scalarFields = ['chronotypeBand', 'intensityPreference', 'activityConsistencyBand'] as const;
    for (const field of scalarFields) {
      const value = profile[field];
      if (typeof value === 'string') {
        allTokens.push(this.normalize(value));
      }
    }

    const idf = this.inverseDocumentFrequency(allTokens);

    for (const token of allTokens) {
      const tf = allTokens.filter((t) => t === token).length / allTokens.length;
      const weight = tf * (idf.get(token) || 1);
      terms.set(token, (terms.get(token) || 0) + weight);
    }

    let magnitude = 0;
    for (const weight of terms.values()) {
      magnitude += weight * weight;
    }
    magnitude = Math.sqrt(magnitude);

    return { terms, magnitude };
  }

  private inverseDocumentFrequency(tokens: string[]): Map<string, number> {
    const df = new Map<string, number>();
    const unique = new Set(tokens);
    const totalDocs = Math.max(1, unique.size);

    for (const token of unique) {
      const count = tokens.filter((t) => t === token).length;
      df.set(token, Math.log((totalDocs + 1) / (count + 1)) + 1);
    }

    return df;
  }

  private normalize(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  }
}
