import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChallengesService } from './challenges.service';
import { ChallengesController } from './challenges.controller';
import { Challenge } from './entities/challenge.entity';
import { Match } from '../matching/entities/match.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Challenge, Match])],
  providers: [ChallengesService],
  controllers: [ChallengesController],
})
export class ChallengesModule {}
