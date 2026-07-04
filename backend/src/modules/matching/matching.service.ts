import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Not, In, MoreThanOrEqual } from 'typeorm';
import { Match } from './entities/match.entity';
import { SwipeHistory } from './entities/swipe-history.entity';
import { PublicWellnessProfile } from './entities/public-wellness-profile.entity';
import { CompatibilityCalculator } from './compatibility/compatibility.calculator';
import { CompatibilityResult } from './compatibility/compatibility.calculator';
import { SwipeDto } from './dto/swipe.dto';
import { UserPreferences } from '../users/entities/user-preferences.entity';
import { User } from '../users/entities/user.entity';
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
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
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
    const myUser = await this.userRepo.findOne({ where: { id: userId } });

    if (!myProfile || !myPrefs) return [];

    const maxDistanceKm = myPrefs.maxDistanceKm || 50;

    const matchedUsers = await this.matchRepo.find({
      where: [
        { userId1: userId, status: 'active' },
        { userId2: userId, status: 'active' },
      ],
    });
    const matchedUserIds = new Set<string>(
      matchedUsers.map((m) => (m.userId1 === userId ? m.userId2 : m.userId1)),
    );

    return candidates
      .map((candidate) => {
        const theirPrefs = { wellnessGoals: candidate.wellnessGoals, preferredActivities: candidate.preferredActivities, preferredIntensity: candidate.intensityPreference, availabilityPeriods: candidate.availabilityPeriods, maxDistanceKm: 50, chronotypePreference: candidate.chronotypeBand } as any;
        const compatibility = this.calculator.calculate(myProfile, myPrefs, candidate, theirPrefs);
        const displayName = (candidate as any).user?.name || 'Usuário';
        const ageRange = (candidate as any).user?.birthdate ? calculateAgeRange((candidate as any).user.birthdate) : undefined;
        const approximateRegion = (candidate as any).user?.locationRegion || undefined;

        let distanceKm: number | undefined;
        const candidateLat = (candidate as any).user?.latitude;
        const candidateLng = (candidate as any).user?.longitude;
        if (myUser?.latitude != null && myUser?.longitude != null && candidateLat != null && candidateLng != null) {
          distanceKm = calculateDistance(myUser.latitude, myUser.longitude, candidateLat, candidateLng);
        }

        const result: any = { ...candidate, displayName, ageRange, approximateRegion, compatibility, distanceKm };
        if (!matchedUserIds.has(candidate.userId)) {
          const { user, ...rest } = result;
          const { avatarUrl, ...safeUser } = user || {};
          return { ...rest, user: safeUser };
        }
        return result;
      })
      .filter((c) => c.distanceKm === undefined || c.distanceKm <= maxDistanceKm)
      .sort((a, b) => b.compatibility.total - a.compatibility.total);
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

  async unmatch(userId: string, matchId: string): Promise<void> {
    const match = await this.matchRepo.findOne({ where: { id: matchId } });
    if (!match) {
      throw new NotFoundException('Match not found');
    }
    if (match.userId1 !== userId && match.userId2 !== userId) {
      throw new BadRequestException('User is not a participant of this match');
    }
    match.status = 'unmatched';
    await this.matchRepo.save(match);
    await this.auditService.record({
      userId,
      eventType: 'match_unmatched',
      resourceType: 'match',
      resourceId: matchId,
      metadata: { otherUserId: match.userId1 === userId ? match.userId2 : match.userId1 },
    });
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

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
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
