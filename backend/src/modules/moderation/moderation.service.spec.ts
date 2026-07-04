import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ModerationService } from './moderation.service';
import { Block } from './entities/block.entity';
import { Report } from './entities/report.entity';
import { ModerationAction } from './entities/moderation-action.entity';
import { Match } from '../matching/entities/match.entity';
import { AuditService } from '../audit/audit.service';

describe('ModerationService', () => {
  let service: ModerationService;
  let blockRepo: Repository<Block>;
  let reportRepo: Repository<Report>;
  let matchRepo: Repository<Match>;

  const mockAuditService = {
    record: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ModerationService,
        { provide: getRepositoryToken(Block), useClass: Repository },
        { provide: getRepositoryToken(Report), useClass: Repository },
        { provide: getRepositoryToken(ModerationAction), useClass: Repository },
        { provide: getRepositoryToken(Match), useClass: Repository },
        { provide: AuditService, useValue: mockAuditService },
      ],
    }).compile();

    service = module.get<ModerationService>(ModerationService);
    blockRepo = module.get(getRepositoryToken(Block));
    reportRepo = module.get(getRepositoryToken(Report));
    matchRepo = module.get(getRepositoryToken(Match));
  });

  it('should block a user', async () => {
    jest.spyOn(blockRepo, 'findOne').mockResolvedValue(null);
    jest.spyOn(matchRepo, 'update').mockResolvedValue({ affected: 0 } as any);
    jest.spyOn(blockRepo, 'create').mockReturnValue({ blockerId: 'user-1', blockedId: 'user-2' } as any);
    jest.spyOn(blockRepo, 'save').mockResolvedValue({ id: 'block-1', blockerId: 'user-1', blockedId: 'user-2' } as any);

    const result = await service.blockUser('user-1', 'user-2', 'harassment');
    expect(result.blockerId).toBe('user-1');
    expect(result.blockedId).toBe('user-2');
  });

  it('should reject self-block', async () => {
    await expect(service.blockUser('user-1', 'user-1')).rejects.toThrow('Cannot block yourself');
  });

  it('should report a user', async () => {
    jest.spyOn(reportRepo, 'create').mockReturnValue({ reporterId: 'user-1', reportedId: 'user-3' } as any);
    jest.spyOn(reportRepo, 'save').mockResolvedValue({ id: 'report-1', reporterId: 'user-1', reportedId: 'user-3' } as any);

    const result = await service.reportUser('user-1', 'user-3', 'inappropriate_content', 'Sent offensive messages');
    expect(result.reporterId).toBe('user-1');
    expect(result.reportedId).toBe('user-3');
  });

  it('should reject self-report', async () => {
    await expect(service.reportUser('user-1', 'user-1', 'other')).rejects.toThrow('Cannot report yourself');
  });
});
