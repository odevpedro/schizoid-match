import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatService } from './chat.service';
import { ChatMessage } from './entities/chat-message.entity';
import { Match } from '../matching/entities/match.entity';
import { AuditService } from '../audit/audit.service';

describe('ChatService', () => {
  let service: ChatService;
  let matchRepo: Repository<Match>;
  let messageRepo: Repository<ChatMessage>;

  const mockMatch = {
    id: 'match-1',
    userId1: 'user-1',
    userId2: 'user-2',
    status: 'active',
  };

  const mockAuditService = {
    record: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        { provide: getRepositoryToken(ChatMessage), useClass: Repository },
        { provide: getRepositoryToken(Match), useClass: Repository },
        { provide: AuditService, useValue: mockAuditService },
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);
    matchRepo = module.get(getRepositoryToken(Match));
    messageRepo = module.get(getRepositoryToken(ChatMessage));
  });

  it('should validate match access for participant', async () => {
    jest.spyOn(matchRepo, 'findOne').mockResolvedValue(mockMatch as any);
    const result = await service.validateMatchAccess('match-1', 'user-1');
    expect(result).toBe(true);
  });

  it('should reject match access for non-participant', async () => {
    jest.spyOn(matchRepo, 'findOne').mockResolvedValue(mockMatch as any);
    const result = await service.validateMatchAccess('match-1', 'user-3');
    expect(result).toBe(false);
  });

  it('should reject match access for inactive match', async () => {
    jest.spyOn(matchRepo, 'findOne').mockResolvedValue({ ...mockMatch, status: 'blocked' } as any);
    const result = await service.validateMatchAccess('match-1', 'user-1');
    expect(result).toBe(false);
  });

  it('should return wellness suggestions deterministically', () => {
    const suggestions = service.getWellnessSuggestions('match-1');
    const suggestionsAgain = service.getWellnessSuggestions('match-1');
    expect(suggestions).toEqual(suggestionsAgain);
    expect(suggestions.length).toBe(3);
  });
});
