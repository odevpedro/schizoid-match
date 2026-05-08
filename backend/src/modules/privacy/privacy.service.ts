import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { HealthService } from '../health/health.service';

@Injectable()
export class PrivacyService {
  constructor(
    private readonly usersService: UsersService,
    private readonly healthService: HealthService,
  ) {}

  async exportUserData(userId: string) {
    const [user, healthData] = await Promise.all([
      this.usersService.getPublicProfile(userId),
      this.healthService.exportUserData(userId),
    ]);

    return {
      exportedAt: new Date().toISOString(),
      userId,
      userData: user,
      healthData,
    };
  }

  async deleteHealthData(userId: string): Promise<void> {
    await this.healthService.deleteRawData(userId);
  }

  async deleteAccount(userId: string): Promise<void> {
    await this.healthService.deleteRawData(userId);
    await this.usersService.softDelete(userId);
  }
}
