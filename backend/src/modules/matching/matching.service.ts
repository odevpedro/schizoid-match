import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { Match } from './entities/match.entity';
import { SwipeHistory } from './entities/swipe-history.entity';
import { PublicHealthProfile } from './entities/public-health-profile.entity';
import { CompatibilityCalculator } from './compatibility/compatibility.calculator';
import { SwipeDto } from './dto/swipe.dto';
import { UserPreferences } from '../users/entities/user-preferences.entity';

const MAX_SWIPES_PER_DAY = parseInt(process.env.MAX_SWIPES_PER_DAY || '50');

@Injectable()
export class MatchingService {
  constructor(
    @InjectRepository(Match)
    private readonly matchRepo: Repository<Match>,
    @InjectRepository(SwipeHistory)
    private readonly swipeRepo: Repository<SwipeHistory>,
    @InjectRepository(PublicHealthProfile)
    private readonly profileRepo: Repository<PublicHealthProfile>,
    @InjectRepository(UserPreferences)
    private readonly prefsRepo: Repository<UserPreferences>,
    private readonly calculator: CompatibilityCalculator,
  ) {}

  async getCandidates(userId: string): Promise<(PublicHealthProfile & { compatibilityScore: number })[]> {
    const swipedIds = await this.swipeRepo
      .createQueryBuilder('s')
      .select('s.target_user_id')
      .where('s.user_id = :userId', { userId })
      .getRawMany()
      .then((rows) => rows.map((r) => r.target_user_id));

    const candidates = await this.profileRepo
      .createQueryBuilder('p')
      .where('p.user_id != :userId', { userId })
      .andWhere(swipedIds.length ? 'p.user_id NOT IN (:...swipedIds)' : '1=1', { swipedIds })
      .leftJoinAndSelect('p.user', 'user')
      .take(20)
      .getMany();

    const myPrefs = await this.prefsRepo.findOne({ where: { userId } });
    const myProfile = await this.profileRepo.findOne({ where: { userId } });

    return candidates.map((candidate) => {
      let score = 50;
      if (myProfile && myPrefs) {
        const theirPrefs = { wellnessGoals: candidate.goals, preferredActivities: [], preferredIntensity: 'moderate', availabilityPeriods: [], maxDistanceKm: 50, chronotypePreference: candidate.chronotype } as any;
        const breakdown = this.calculator.calculate(myProfile, myPrefs, candidate, theirPrefs);
        score = breakdown.total;
      }
      return { ...candidate, compatibilityScore: score };
    }).sort((a, b) => b.compatibilityScore - a.compatibilityScore);
  }

  async swipe(userId: string, dto: SwipeDto): Promise<{ matched: boolean; matchId?: string }> {
    if (userId === dto.targetUserId) {
      throw new BadRequestException('Cannot swipe on yourself');
    }

    await this.checkRateLimit(userId);

    const existing = await this.swipeRepo.findOne({
      where: { userId, targetUserId: dto.targetUserId },
    });

    if (existing) {
      throw new BadRequestException('Already swiped on this user');
    }

    const swipe = this.swipeRepo.create({
      userId,
      targetUserId: dto.targetUserId,
      direction: dto.direction,
    });
    await this.swipeRepo.save(swipe);

    if (dto.direction === 'like' || dto.direction === 'super_like') {
      return this.checkAndCreateMatch(userId, dto.targetUserId);
    }

    return { matched: false };
  }

  private async checkAndCreateMatch(
    userId: string,
    targetUserId: string,
  ): Promise<{ matched: boolean; matchId?: string }> {
    const theirLike = await this.swipeRepo.findOne({
      where: { userId: targetUserId, targetUserId: userId, direction: 'like' },
    });

    if (!theirLike) {
      const theirSuperLike = await this.swipeRepo.findOne({
        where: { userId: targetUserId, targetUserId: userId, direction: 'super_like' },
      });
      if (!theirSuperLike) return { matched: false };
    }

    const existingMatch = await this.matchRepo.findOne({
      where: [
        { userId1: userId, userId2: targetUserId },
        { userId1: targetUserId, userId2: userId },
      ],
    });

    if (existingMatch) return { matched: true, matchId: existingMatch.id };

    const [profile1, profile2, prefs1, prefs2] = await Promise.all([
      this.profileRepo.findOne({ where: { userId } }),
      this.profileRepo.findOne({ where: { userId: targetUserId } }),
      this.prefsRepo.findOne({ where: { userId } }),
      this.prefsRepo.findOne({ where: { userId: targetUserId } }),
    ]);

    let scoreCompatibility = 50;
    if (profile1 && profile2 && prefs1 && prefs2) {
      const breakdown = this.calculator.calculate(profile1, prefs1, profile2, prefs2);
      scoreCompatibility = breakdown.total;
    }

    const [u1, u2] = [userId, targetUserId].sort();
    const match = this.matchRepo.create({
      userId1: u1,
      userId2: u2,
      scoreCompatibility,
      status: 'active',
    });

    const saved = await this.matchRepo.save(match);
    return { matched: true, matchId: saved.id };
  }

  async getMatches(userId: string): Promise<Match[]> {
    return this.matchRepo.find({
      where: [{ userId1: userId, status: 'active' }, { userId2: userId, status: 'active' }],
      relations: ['user1', 'user2'],
      order: { createdAt: 'DESC' },
    });
  }

  async getSwipeHistory(userId: string): Promise<SwipeHistory[]> {
    return this.swipeRepo.find({
      where: { userId },
      order: { timestamp: 'DESC' },
      take: 100,
    });
  }

  private async checkRateLimit(userId: string): Promise<void> {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const count = await this.swipeRepo.count({
      where: {
        userId,
      },
    });

    if (count >= MAX_SWIPES_PER_DAY) {
      throw new BadRequestException(`Daily swipe limit of ${MAX_SWIPES_PER_DAY} reached`);
    }
  }

  async updatePublicProfile(userId: string, data: Partial<PublicHealthProfile>): Promise<void> {
    await this.profileRepo.upsert({ userId, ...data }, ['userId']);
  }
}
