import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChallengeProgress } from './entities/challenge-progress.entity';
import { Challenge } from './entities/challenge.entity';

@Injectable()
export class ChallengeProgressService {
  constructor(
    @InjectRepository(ChallengeProgress)
    private readonly progressRepo: Repository<ChallengeProgress>,
    @InjectRepository(Challenge)
    private readonly challengeRepo: Repository<Challenge>,
  ) {}

  async updateProgress(challengeId: string, userId: string, value: number): Promise<ChallengeProgress> {
    const challenge = await this.challengeRepo.findOne({ where: { id: challengeId } });
    if (!challenge) throw new NotFoundException('Challenge not found');

    const targetValue = challenge.targetValue || value;

    const existing = await this.progressRepo.findOne({
      where: { challengeId, userId, date: new Date().toISOString().split('T')[0] },
    });

    let saved: ChallengeProgress;
    if (existing) {
      existing.currentValue = value;
      saved = await this.progressRepo.save(existing);
    } else {
      const progress = this.progressRepo.create({
        challengeId,
        userId,
        currentValue: value,
        targetValue,
        unit: challenge.targetUnit || undefined,
        date: new Date().toISOString().split('T')[0],
      });
      saved = await this.progressRepo.save(progress);
    }

    if (saved.currentValue >= saved.targetValue && saved.status === 'active') {
      await this.completeChallenge(challengeId);
    }

    return saved;
  }

  async getProgress(challengeId: string): Promise<ChallengeProgress[]> {
    const challenge = await this.challengeRepo.findOne({ where: { id: challengeId } });
    if (!challenge) throw new NotFoundException('Challenge not found');

    return this.progressRepo.find({
      where: { challengeId },
      order: { createdAt: 'DESC' },
    });
  }

  async completeChallenge(challengeId: string): Promise<void> {
    await this.progressRepo.update(
      { challengeId, status: 'active' },
      { status: 'completed', completedAt: new Date() },
    );

    await this.challengeRepo.update(
      { id: challengeId },
      { status: 'completed', completedAt: new Date() },
    );
  }

  async getHistory(userId: string): Promise<ChallengeProgress[]> {
    return this.progressRepo.find({
      where: { userId, status: 'completed' },
      order: { completedAt: 'DESC' },
    });
  }

  async getDetailedHistory(
    userId: string,
    page = 1,
    limit = 10,
  ): Promise<{
    data: Array<{
      challenge: { id: string; name: string; description: string | null; target: number | null };
      progressUpdates: Array<{ date: string; progressValue: number; status: string }>;
      totalDaysActive: number;
      currentStreak: number;
    }>;
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;

    const challenges = await this.challengeRepo
      .createQueryBuilder('c')
      .innerJoin('match', 'm', 'c.match_id = m.id')
      .where('(m.user_id_1 = :userId OR m.user_id_2 = :userId)', { userId })
      .orderBy('c.created_at', 'DESC')
      .skip(skip)
      .take(limit)
      .getMany();

    const total = await this.challengeRepo
      .createQueryBuilder('c')
      .innerJoin('match', 'm', 'c.match_id = m.id')
      .where('(m.user_id_1 = :userId OR m.user_id_2 = :userId)', { userId })
      .getCount();

    const data = await Promise.all(
      challenges.map(async (challenge) => {
        const updates = await this.progressRepo.find({
          where: { challengeId: challenge.id, userId },
          order: { date: 'ASC' },
        });

        const progressUpdates = updates.map((u) => ({
          date: u.date,
          progressValue: Number(u.currentValue),
          status: u.status,
        }));

        const dates = [...new Set(updates.map((u) => u.date))].sort();
        const totalDaysActive = dates.length;

        let currentStreak = 0;
        if (dates.length > 0) {
          const today = new Date().toISOString().split('T')[0];
          const lastDate = dates[dates.length - 1];
          const diffMs = new Date(today).getTime() - new Date(lastDate).getTime();
          const diffDays = Math.floor(diffMs / 86400000);

          if (diffDays <= 1) {
            currentStreak = 1;
            for (let i = dates.length - 2; i >= 0; i--) {
              const curr = new Date(dates[i + 1]);
              const prev = new Date(dates[i]);
              const gap = (curr.getTime() - prev.getTime()) / 86400000;
              if (gap <= 1) {
                currentStreak++;
              } else {
                break;
              }
            }
          }
        }

        return {
          challenge: {
            id: challenge.id,
            name: challenge.title,
            description: challenge.description,
            target: challenge.targetValue ? Number(challenge.targetValue) : null,
          },
          progressUpdates,
          totalDaysActive,
          currentStreak,
        };
      }),
    );

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
