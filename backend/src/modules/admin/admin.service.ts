import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Report } from '../moderation/entities/report.entity';
import { ModerationAction } from '../moderation/entities/moderation-action.entity';
import { Block } from '../moderation/entities/block.entity';
import { AuditEvent } from '../audit/entities/audit-event.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Report)
    private readonly reportRepo: Repository<Report>,
    @InjectRepository(ModerationAction)
    private readonly actionRepo: Repository<ModerationAction>,
    @InjectRepository(Block)
    private readonly blockRepo: Repository<Block>,
    @InjectRepository(AuditEvent)
    private readonly auditRepo: Repository<AuditEvent>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async getReports(): Promise<Report[]> {
    return this.reportRepo.find({
      relations: ['reporter', 'reported'],
      order: { createdAt: 'DESC' },
    });
  }

  async getReport(id: string): Promise<Report> {
    const report = await this.reportRepo.findOne({
      where: { id },
      relations: ['reporter', 'reported'],
    });
    if (!report) throw new NotFoundException('Report not found');
    return report;
  }

  async resolveReport(
    id: string,
    action: 'warn' | 'ban' | 'dismiss',
    moderatorId: string,
  ): Promise<Report> {
    const report = await this.getReport(id);
    let actionType: string;
    let status: string;

    switch (action) {
      case 'warn':
        actionType = 'warning';
        status = 'action_taken';
        break;
      case 'ban':
        actionType = 'permanent_ban';
        status = 'action_taken';
        break;
      case 'dismiss':
        actionType = 'content_removed';
        status = 'dismissed';
        break;
      default:
        throw new NotFoundException('Invalid action');
    }

    this.actionRepo.save(
      this.actionRepo.create({
        targetUserId: report.reportedId,
        actionType: actionType as any,
        reason: `Report ${id} resolved with ${action}`,
        reportId: id,
      }),
    );

    report.status = status as any;
    return this.reportRepo.save(report);
  }

  async getDashboardStats(): Promise<{
    totalReports: number;
    pendingReports: number;
    totalBans: number;
    activeUsers: number;
  }> {
    const totalReports = await this.reportRepo.count();
    const pendingReports = await this.reportRepo.count({ where: { status: 'pending' } });
    const totalBans = await this.actionRepo.count({ where: { actionType: 'permanent_ban' as any } });
    const activeUsers = await this.userRepo.count({ where: { isDeleted: false } });

    return { totalReports, pendingReports, totalBans, activeUsers };
  }

  async getAuditLog(page = 1, limit = 20): Promise<{
    data: AuditEvent[];
    total: number;
    page: number;
    limit: number;
  }> {
    const [data, total] = await this.auditRepo.findAndCount({
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total, page, limit };
  }
}
