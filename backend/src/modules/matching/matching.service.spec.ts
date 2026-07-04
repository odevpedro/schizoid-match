import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { MatchingService } from './matching.service';
import { Match } from './entities/match.entity';
import { SwipeHistory } from './entities/swipe-history.entity';
import { PublicWellnessProfile } from './entities/public-wellness-profile.entity';
import { CompatibilityCalculator } from './compatibility/compatibility.calculator';
import { UserPreferences } from '../users/entities/user-preferences.entity';
import { AuditService } from '../audit/audit.service';

describe('MatchingService', () => {
  let service: MatchingService;

  const mockQueryRunner = {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    manager: {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    },
  };

  const mockDataSource = {
    createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
  };

  const mockCalculator = {
    calculate: jest.fn().mockReturnValue({ total: 85, confidence: 'high', reasons: ['Compatible goals'], dimensions: [] }),
  };

  const mockSwipeRepo = {
    count: jest.fn().mockResolvedValue(0),
    find: jest.fn(),
  };

  const mockMatchRepo = {};
  const mockProfileRepo = {};
  const mockPrefsRepo = {};

  const mockAuditService = {
    record: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MatchingService,
        { provide: DataSource, useValue: mockDataSource },
        { provide: getRepositoryToken(Match), useValue: mockMatchRepo },
        { provide: getRepositoryToken(SwipeHistory), useValue: mockSwipeRepo },
        { provide: getRepositoryToken(PublicWellnessProfile), useValue: mockProfileRepo },
        { provide: getRepositoryToken(UserPreferences), useValue: mockPrefsRepo },
        { provide: CompatibilityCalculator, useValue: mockCalculator },
        { provide: AuditService, useValue: mockAuditService },
      ],
    }).compile();

    service = module.get<MatchingService>(MatchingService);
  });

  it('should reject swipe on self', async () => {
    await expect(service.swipe('user-1', { targetUserId: 'user-1', direction: 'like' })).rejects.toThrow('Cannot swipe on yourself');
  });

  it('should reject duplicate swipes', async () => {
    mockQueryRunner.manager.findOne.mockResolvedValueOnce({ id: 'existing' });
    await expect(service.swipe('user-1', { targetUserId: 'user-2', direction: 'like' })).rejects.toThrow('Already swiped on this user');
  });

  it('should create match on mutual like', async () => {
    mockQueryRunner.manager.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 'their-like', userId: 'user-2', targetUserId: 'user-1', direction: 'like' })
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ userId: 'user-1', onboardingCompleted: true })
      .mockResolvedValueOnce({ userId: 'user-2', onboardingCompleted: true })
      .mockResolvedValueOnce({ wellnessGoals: ['walk_more'] })
      .mockResolvedValueOnce({ wellnessGoals: ['walk_more'] });

    mockQueryRunner.manager.save.mockResolvedValue({ id: 'new-match-id' });

    const result = await service.swipe('user-1', { targetUserId: 'user-2', direction: 'like' });
    expect(result.matched).toBe(true);
    expect(result.matchId).toBe('new-match-id');
  });

  it('should not create match on non-mutual like', async () => {
    mockQueryRunner.manager.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);

    const result = await service.swipe('user-1', { targetUserId: 'user-2', direction: 'like' });
    expect(result.matched).toBe(false);
  });
});
