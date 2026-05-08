import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from '../users/dto/create-user.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) return null;
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) return null;
    const { passwordHash, ...result } = user as any;
    return result;
  }

  async login(user: { id: string; email: string }) {
    const payload = { sub: user.id, email: user.email };
    return {
      access_token: this.jwtService.sign(payload),
      token_type: 'Bearer',
      expires_in: process.env.JWT_EXPIRES_IN || '7d',
      user: { id: user.id, email: user.email },
    };
  }

  async register(dto: CreateUserDto) {
    const user = await this.usersService.create(dto);
    return this.login({ id: user.id, email: user.email });
  }
}
