import { Controller, Get, Post, Delete, Body, UseGuards, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { HealthService } from './health.service';
import { IngestMetricsDto } from './dto/ingest-metrics.dto';
import { GrantConsentDto, RevokeConsentDto } from './dto/consent.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('health')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Post('consent/grant')
  @ApiOperation({ summary: 'Grant consent for specific health metrics with purpose' })
  async grantConsent(@Request() req, @Body() dto: GrantConsentDto) {
    const results = await Promise.all(
      dto.metricTypes.map((metricType) =>
        this.healthService.grantConsent(req.user.id, metricType, dto.purpose, dto.sourceProvider, dto.consentVersion),
      ),
    );
    return results;
  }

  @Post('consent/revoke')
  @ApiOperation({ summary: 'Revoke consent and remove associated public profile data' })
  async revokeConsent(@Request() req, @Body() dto: RevokeConsentDto) {
    await Promise.all(
      dto.metricTypes.map((metricType) =>
        this.healthService.revokeConsent(req.user.id, metricType),
      ),
    );
    return { success: true };
  }

  @Get('consent')
  @ApiOperation({ summary: 'Get all consent records for current user' })
  async getConsents(@Request() req) {
    return this.healthService.getConsents(req.user.id);
  }

  @Post('ingest')
  @ApiOperation({ summary: 'Ingest health metrics from a provider' })
  async ingestMetrics(@Request() req, @Body() dto: IngestMetricsDto) {
    return this.healthService.ingestMetrics(req.user.id, dto);
  }

  @Get('profile')
  @ApiOperation({ summary: 'Get derived health profile (safe, aggregated data)' })
  async getDerivedProfile(@Request() req) {
    return this.healthService.getDerivedProfile(req.user.id);
  }
}
