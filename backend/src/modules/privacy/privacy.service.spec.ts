import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PrivacyService } from './privacy.service';
import { UsersService } from '../users/users.service';
import { HealthService } from '../health/health.service';
import { PublicWellnessProfile } from '../matching/entities/public-wellness-profile.entity';
import { Match } from '../matching/entities/match.entity';
import { AuditService } from '../audit/audit.service';

describe('PrivacyService', () => {
  let service: PrivacyService;

  const mockUsersService = {
    getPublicProfile: jest.fn().mockResolvedValue({ id: 'user-1', name: 'Test User' }),
    softDelete: jest.fn().mockResolvedValue(undefined),
  };

  const mockHealthService = {
    exportUserData: jest.fn().mockResolvedValue({ rawMetrics: [], dailyProfiles: [], consents: [] }),
    deleteRawData: jest.fn().mockResolvedValue(undefined),
  };

  const mockWellnessRepo = {
    findOne: jest.fn(),
    delete: jest.fn().mockResolvedValue({ affected: 1, raw: [] }),
  };

  const mockMatchRepo = {
    update: jest.fn().mockResolvedValue({ affected: 1 }),
  };

  const mockAuditService = {
    record: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrivacyService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: HealthService, useValue: mockHealthService },
        { provide: getRepositoryToken(PublicWellnessProfile), useValue: mockWellnessRepo },
        { provide: getRepositoryToken(Match), useValue: mockMatchRepo },
        { provide: AuditService, useValue: mockAuditService },
      ],
    }).compile();

    service = module.get<PrivacyService>(PrivacyService);
  });

  it('should export user data', async () => {
    mockWellnessRepo.findOne.mockResolvedValue({ userId: 'user-1', activityLevel: 'moderate' });
    const result = await service.exportUserData('user-1');
    expect(result.userId).toBe('user-1');
    expect(result.wellnessProfile).toBeDefined();
    expect(result.healthData).toBeDefined();
  });

  it('should delete account and cleanup', async () => {
    await service.deleteAccount('user-1');
    expect(mockHealthService.deleteRawData).toHaveBeenCalledWith('user-1');
    expect(mockMatchRepo.update).toHaveBeenCalledTimes(2);
    expect(mockUsersService.softDelete).toHaveBeenCalledWith('user-1');
  });
});
