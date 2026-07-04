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
}
