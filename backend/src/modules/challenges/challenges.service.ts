import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Challenge } from './entities/challenge.entity';
import { Match } from '../matching/entities/match.entity';

interface CreateChallengeDto {
  matchId: string;
  title: string;
  description?: string;
  challengeType: 'steps' | 'sleep_streak' | 'weekly_activity' | 'wellness_checkin';
  targetValue?: number;
  targetUnit?: string;
  startDate?: string;
  endDate?: string;
}

@Injectable()
export class ChallengesService {
  constructor(
    @InjectRepository(Challenge)
    private readonly challengeRepo: Repository<Challenge>,
    @InjectRepository(Match)
    private readonly matchRepo: Repository<Match>,
  ) {}

  async create(userId: string, dto: CreateChallengeDto): Promise<Challenge> {
    const match = await this.matchRepo.findOne({ where: { id: dto.matchId } });
    if (!match || (match.userId1 !== userId && match.userId2 !== userId)) {
      throw new ForbiddenException('You are not part of this match');
    }

    const challenge = this.challengeRepo.create({ ...dto, creatorId: userId });
    return this.challengeRepo.save(challenge);
  }

  async getByMatch(userId: string, matchId: string): Promise<Challenge[]> {
    const match = await this.matchRepo.findOne({ where: { id: matchId } });
    if (!match || (match.userId1 !== userId && match.userId2 !== userId)) {
      throw new ForbiddenException('You are not part of this match');
    }

    return this.challengeRepo.find({
      where: { matchId },
      order: { createdAt: 'DESC' },
    });
  }

  async getUserChallenges(userId: string): Promise<Challenge[]> {
    return this.challengeRepo
      .createQueryBuilder('c')
      .innerJoin(Match, 'm', 'c.match_id = m.id')
      .where('(m.user_id_1 = :userId OR m.user_id_2 = :userId)', { userId })
      .andWhere("c.status = 'active'")
      .orderBy('c.created_at', 'DESC')
      .getMany();
  }
}
