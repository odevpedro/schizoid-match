import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SwipeHistory } from './entities/swipe-history.entity';
import { RecommendationService } from './recommendation.service';

@Module({
  imports: [TypeOrmModule.forFeature([SwipeHistory])],
  providers: [RecommendationService],
  exports: [RecommendationService],
})
export class RecommendationModule {}
