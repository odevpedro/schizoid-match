import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { AuditService } from '../audit/audit.service';
import * as bcrypt from 'bcryptjs';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;

  const mockUsersService = {
    findByEmail: jest.fn(),
    create: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('test-token'),
  };

  const mockAuditService = {
    record: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: AuditService, useValue: mockAuditService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
  });

  it('should validate user with correct password', async () => {
    const passwordHash = await bcrypt.hash('correct-password', 4);
    mockUsersService.findByEmail.mockResolvedValue({ id: '1', email: 'test@test.com', passwordHash });
    const result = await service.validateUser('test@test.com', 'correct-password');
    expect(result).toBeDefined();
    expect(result.passwordHash).toBeUndefined();
  });

  it('should return null for wrong password', async () => {
    const passwordHash = await bcrypt.hash('correct-password', 4);
    mockUsersService.findByEmail.mockResolvedValue({ id: '1', email: 'test@test.com', passwordHash });
    const result = await service.validateUser('test@test.com', 'wrong-password');
    expect(result).toBeNull();
  });

  it('should return null for non-existent user', async () => {
    mockUsersService.findByEmail.mockResolvedValue(null);
    const result = await service.validateUser('nobody@test.com', 'password');
    expect(result).toBeNull();
  });

  it('should return JWT token on login', async () => {
    const result = await service.login({ id: '1', email: 'test@test.com' });
    expect(result.access_token).toBe('test-token');
    expect(result.user.id).toBe('1');
  });

  it('should create user and return token on register', async () => {
    mockUsersService.create.mockResolvedValue({ id: '1', email: 'new@test.com' });
    const result = await service.register({ email: 'new@test.com', password: 'pass123', name: 'Test' });
    expect(result.access_token).toBe('test-token');
  });
});
