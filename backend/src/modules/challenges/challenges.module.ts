import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChallengesService } from './challenges.service';
import { ChallengesController } from './challenges.controller';
import { ChallengeProgressService } from './challenge-progress.service';
import { Challenge } from './entities/challenge.entity';
import { ChallengeProgress } from './entities/challenge-progress.entity';
import { Match } from '../matching/entities/match.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Challenge, ChallengeProgress, Match])],
  providers: [ChallengesService, ChallengeProgressService],
  controllers: [ChallengesController],
})
export class ChallengesModule {}
