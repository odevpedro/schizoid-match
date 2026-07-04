import { Controller, Get, HttpException, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import Redis from 'ioredis';

@ApiTags('system')
@Controller()
export class HealthCheckController {
  private redis: Redis | null = null;

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {
    const redisUrl = this.configService.get<string>('REDIS_URL');
    if (redisUrl) {
      this.redis = new Redis(redisUrl, { lazyConnect: true, maxRetriesPerRequest: 0 });
    }
  }

  @Get('health')
  @ApiOperation({ summary: 'Basic health check - returns service status' })
  getHealth() {
    return {
      status: 'ok',
      service: 'wellmatch-backend',
      version: '0.2.0',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness check - verifies all dependencies' })
  async getReady() {
    const checks: Record<string, string> = {};

    try {
      await this.dataSource.query('SELECT 1');
      checks.database = 'ok';
    } catch {
      checks.database = 'error';
    }

    if (this.redis) {
      try {
        await this.redis.ping();
        checks.redis = 'ok';
      } catch {
        checks.redis = 'error';
      }
    } else {
      checks.redis = 'not_configured';
    }

    const jwtSecret = this.configService.get<string>('JWT_SECRET');
    checks.config = jwtSecret && jwtSecret !== 'wellmatch-dev-secret' ? 'ok' : 'warning';

    const allOk = Object.values(checks).every((v) => v === 'ok');
    if (!allOk) {
      throw new HttpException({ status: 'degraded', checks }, HttpStatus.SERVICE_UNAVAILABLE);
    }

    return { status: 'ready', checks };
  }
}
