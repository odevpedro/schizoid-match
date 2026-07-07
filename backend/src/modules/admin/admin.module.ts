import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { Report } from '../moderation/entities/report.entity';
import { ModerationAction } from '../moderation/entities/moderation-action.entity';
import { Block } from '../moderation/entities/block.entity';
import { AuditEvent } from '../audit/entities/audit-event.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Report, ModerationAction, Block, AuditEvent, User])],
  providers: [AdminService],
  controllers: [AdminController],
  exports: [AdminService],
})
export class AdminModule {}
