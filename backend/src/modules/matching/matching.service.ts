import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Not, In, MoreThanOrEqual } from 'typeorm';
import { Match } from './entities/match.entity';
import { SwipeHistory } from './entities/swipe-history.entity';
import { PublicWellnessProfile } from './entities/public-wellness-profile.entity';
import { CompatibilityCalculator } from './compatibility/compatibility.calculator';
import { CompatibilityResult } from './compatibility/compatibility.calculator';
import { SwipeDto } from './dto/swipe.dto';
import { UserPreferences } from '../users/entities/user-preferences.entity';
import { AuditService } from '../audit/audit.service';

const MAX_SWIPES_PER_DAY = parseInt(process.env.MAX_SWIPES_PER_DAY || '50');

@Injectable()
export class MatchingService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Match)
    private readonly matchRepo: Repository<Match>,
    @InjectRepository(SwipeHistory)
    private readonly swipeRepo: Repository<SwipeHistory>,
    @InjectRepository(PublicWellnessProfile)
    private readonly profileRepo: Repository<PublicWellnessProfile>,
    @InjectRepository(UserPreferences)
    private readonly prefsRepo: Repository<UserPreferences>,
    private readonly calculator: CompatibilityCalculator,
    private readonly auditService: AuditService,
  ) {}

  async getCandidates(userId: string): Promise<any[]> {
    const swipedIds = await this.swipeRepo
      .createQueryBuilder('s')
      .select('s.target_user_id')
      .where('s.user_id = :userId', { userId })
      .getRawMany()
      .then((rows) => rows.map((r) => r.target_user_id));

    const candidates = await this.profileRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.user', 'u')
      .where('p.user_id != :userId', { userId })
      .andWhere(swipedIds.length ? 'p.user_id NOT IN (:...swipedIds)' : '1=1', { swipedIds })
      .andWhere('p.is_visible = true')
      .andWhere('p.onboarding_completed = true')
      .take(20)
      .getMany();

    const myPrefs = await this.prefsRepo.findOne({ where: { userId } });
    const myProfile = await this.profileRepo.findOne({ where: { userId } });

    if (!myProfile || !myPrefs) return [];

    return candidates.map((candidate) => {
      const theirPrefs = { wellnessGoals: candidate.wellnessGoals, preferredActivities: candidate.preferredActivities, preferredIntensity: candidate.intensityPreference, availabilityPeriods: candidate.availabilityPeriods, maxDistanceKm: 50, chronotypePreference: candidate.chronotypeBand } as any;
      const compatibility = this.calculator.calculate(myProfile, myPrefs, candidate, theirPrefs);
      const displayName = (candidate as any).user?.name || 'Usuário';
      const ageRange = (candidate as any).user?.birthdate ? calculateAgeRange((candidate as any).user.birthdate) : undefined;
      const approximateRegion = (candidate as any).user?.locationRegion || undefined;
      return { ...candidate, displayName, ageRange, approximateRegion, compatibility };
    }).sort((a, b) => b.compatibility.total - a.compatibility.total);
  }

  async swipe(userId: string, dto: SwipeDto): Promise<{ matched: boolean; matchId?: string; compatibility?: CompatibilityResult }> {
    if (userId === dto.targetUserId) {
      throw new BadRequestException('Cannot swipe on yourself');
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const dailyCount = await this.swipeRepo.count({
      where: { userId, timestamp: MoreThanOrEqual(todayStart) },
    });

    if (dailyCount >= MAX_SWIPES_PER_DAY) {
      throw new BadRequestException(`Daily swipe limit of ${MAX_SWIPES_PER_DAY} reached`);
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const existing = await queryRunner.manager.findOne(SwipeHistory, {
        where: { userId, targetUserId: dto.targetUserId },
      });
      if (existing) {
        throw new BadRequestException('Already swiped on this user');
      }

      const swipe = queryRunner.manager.create(SwipeHistory, {
        userId,
        targetUserId: dto.targetUserId,
        direction: dto.direction,
      });
      await queryRunner.manager.save(swipe);

      if (dto.direction === 'like' || dto.direction === 'super_like') {
        const theirLike = await queryRunner.manager.findOne(SwipeHistory, {
          where: { userId: dto.targetUserId, targetUserId: userId, direction: In(['like', 'super_like']) },
        });

        if (theirLike) {
          const existingMatch = await queryRunner.manager.findOne(Match, {
            where: [
              { userId1: userId, userId2: dto.targetUserId },
              { userId1: dto.targetUserId, userId2: userId },
            ],
          });

          if (existingMatch) {
            await queryRunner.commitTransaction();
            return { matched: true, matchId: existingMatch.id };
          }

          const [profile1, profile2, prefs1, prefs2] = await Promise.all([
            queryRunner.manager.findOne(PublicWellnessProfile, { where: { userId } }),
            queryRunner.manager.findOne(PublicWellnessProfile, { where: { userId: dto.targetUserId } }),
            queryRunner.manager.findOne(UserPreferences, { where: { userId } }),
            queryRunner.manager.findOne(UserPreferences, { where: { userId: dto.targetUserId } }),
          ]);

          let compatibility: CompatibilityResult | undefined;
          let scoreCompatibility = 50;
          if (profile1 && profile2 && prefs1 && prefs2) {
            compatibility = this.calculator.calculate(profile1, prefs1, profile2, prefs2);
            scoreCompatibility = compatibility.total;
          }

          const [u1, u2] = [userId, dto.targetUserId].sort();
          const match = queryRunner.manager.create(Match, {
            userId1: u1,
            userId2: u2,
            scoreCompatibility,
            status: 'active',
          });

          const saved = await queryRunner.manager.save(match);
          await queryRunner.commitTransaction();
          await this.auditService.record({ userId, eventType: 'match_created', resourceType: 'match', resourceId: saved.id, metadata: { targetUserId: dto.targetUserId, score: scoreCompatibility } });
          return { matched: true, matchId: saved.id, compatibility };
        }
      }

      await queryRunner.commitTransaction();
      return { matched: false };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async getMatches(userId: string): Promise<Match[]> {
    return this.matchRepo.find({
      where: [
        { userId1: userId, status: 'active' },
        { userId2: userId, status: 'active' },
      ],
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
}

function calculateAgeRange(birthdate: Date): string {
  const now = new Date();
  const age = now.getFullYear() - new Date(birthdate).getFullYear();
  if (age < 20) return '18-20';
  if (age < 25) return '20-25';
  if (age < 30) return '25-30';
  if (age < 35) return '30-35';
  if (age < 40) return '35-40';
  if (age < 50) return '40-50';
  return '50+';
}
