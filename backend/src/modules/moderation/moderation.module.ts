import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ModerationService } from './moderation.service';
import { ModerationController } from './moderation.controller';
import { Block } from './entities/block.entity';
import { Report } from './entities/report.entity';
import { ModerationAction } from './entities/moderation-action.entity';
import { Match } from '../matching/entities/match.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Block, Report, ModerationAction, Match])],
  providers: [ModerationService],
  controllers: [ModerationController],
  exports: [ModerationService],
})
export class ModerationModule {}
