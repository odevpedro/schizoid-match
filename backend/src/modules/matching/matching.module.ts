import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MatchingService } from './matching.service';
import { MatchingController } from './matching.controller';
import { Match } from './entities/match.entity';
import { SwipeHistory } from './entities/swipe-history.entity';
import { PublicHealthProfile } from './entities/public-health-profile.entity';
import { PublicWellnessProfile } from './entities/public-wellness-profile.entity';
import { CompatibilityCalculator } from './compatibility/compatibility.calculator';
import { RecommendationModule } from './recommendation.module';
import { UserPreferences } from '../users/entities/user-preferences.entity';
import { User } from '../users/entities/user.entity';
import { Block } from '../moderation/entities/block.entity';
import { ChatModule } from '../chat/chat.module';
import { NotificationModule } from '../notifications/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Match, SwipeHistory, PublicHealthProfile, PublicWellnessProfile, UserPreferences, User, Block]),
    RecommendationModule,
    ChatModule,
    NotificationModule,
  ],
  providers: [MatchingService, CompatibilityCalculator],
  controllers: [MatchingController],
  exports: [MatchingService],
})
export class MatchingModule {}
