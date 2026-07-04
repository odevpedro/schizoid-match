import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly auditService: AuditService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) return null;
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) return null;
    const { passwordHash, ...result } = user as any;
    return result;
  }

  async login(user: { id: string; email: string; role?: string }) {
    const payload = { sub: user.id, email: user.email, role: user.role || 'user' };
    await this.auditService.record({ userId: user.id, eventType: 'login_success', metadata: { email: user.email } });
    return {
      access_token: this.jwtService.sign(payload),
      token_type: 'Bearer',
      expires_in: process.env.JWT_EXPIRES_IN || '7d',
      user: { id: user.id, email: user.email, role: user.role || 'user' },
    };
  }

  async register(dto: CreateUserDto) {
    const user = await this.usersService.create(dto);
    await this.auditService.record({ userId: user.id, eventType: 'user_registered', metadata: { email: dto.email } });
    return this.login({ id: user.id, email: user.email, role: user.role });
  }
}
