import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Block } from './entities/block.entity';
import { Report } from './entities/report.entity';
import { ModerationAction } from './entities/moderation-action.entity';
import { Match } from '../matching/entities/match.entity';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class ModerationService {
  constructor(
    @InjectRepository(Block)
    private readonly blockRepo: Repository<Block>,
    @InjectRepository(Report)
    private readonly reportRepo: Repository<Report>,
    @InjectRepository(ModerationAction)
    private readonly actionRepo: Repository<ModerationAction>,
    @InjectRepository(Match)
    private readonly matchRepo: Repository<Match>,
    private readonly auditService: AuditService,
  ) {}

  async blockUser(blockerId: string, blockedId: string, reason?: string): Promise<Block> {
    if (blockerId === blockedId) {
      throw new BadRequestException('Cannot block yourself');
    }

    const existing = await this.blockRepo.findOne({
      where: { blockerId, blockedId },
    });
    if (existing) return existing;

    await this.matchRepo.update(
      { userId1: blockerId, userId2: blockedId, status: 'active' },
      { status: 'blocked' },
    );
    await this.matchRepo.update(
      { userId1: blockedId, userId2: blockerId, status: 'active' },
      { status: 'blocked' },
    );

    const block = this.blockRepo.create({ blockerId, blockedId, reason });
    const saved = await this.blockRepo.save(block);
    await this.auditService.record({ userId: blockerId, eventType: 'user_blocked', resourceType: 'user', resourceId: blockedId, metadata: { reason } });
    return saved;
  }

  async unblockUser(blockerId: string, blockedId: string): Promise<void> {
    await this.blockRepo.delete({ blockerId, blockedId });
    await this.auditService.record({ userId: blockerId, eventType: 'user_unblocked', resourceType: 'user', resourceId: blockedId });
  }

  async getBlocks(userId: string): Promise<Block[]> {
    return this.blockRepo.find({
      where: { blockerId: userId },
      relations: ['blocked'],
    });
  }

  async isBlocked(userId: string, targetUserId: string): Promise<boolean> {
    const block = await this.blockRepo.findOne({
      where: { blockerId: userId, blockedId: targetUserId },
    });
    return !!block;
  }

  async reportUser(reporterId: string, reportedId: string, reason: string, description?: string, matchId?: string): Promise<Report> {
    if (reporterId === reportedId) {
      throw new BadRequestException('Cannot report yourself');
    }

    const report = this.reportRepo.create({
      reporterId,
      reportedId,
      reason,
      description,
      matchId,
    });
    const saved = await this.reportRepo.save(report);
    await this.auditService.record({ userId: reporterId, eventType: 'user_reported', resourceType: 'report', resourceId: saved.id, metadata: { reportedId, reason } });
    return saved;
  }

  async getReports(userId: string, role: string): Promise<Report[]> {
    if (role !== 'admin') {
      return this.reportRepo.find({ where: [{ reporterId: userId }, { reportedId: userId }], order: { createdAt: 'DESC' } });
    }
    return this.reportRepo.find({ order: { createdAt: 'DESC' }, relations: ['reporter', 'reported'] });
  }

  async takeAction(targetUserId: string, actionType: string, reason: string, reportId?: string, expiresAt?: Date): Promise<ModerationAction> {
    const action = this.actionRepo.create({
      targetUserId,
      actionType: actionType as 'warning' | 'temporary_ban' | 'permanent_ban' | 'content_removed',
      reason,
      reportId,
      expiresAt,
    });
    const saved = await this.actionRepo.save(action);
    await this.auditService.record({ userId: targetUserId, eventType: 'moderation_action_taken', resourceType: 'moderation_action', resourceId: saved.id, metadata: { actionType, reason, reportId } });
    return saved;
  }
}
