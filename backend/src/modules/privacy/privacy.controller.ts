import { Controller, Get, Delete, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PrivacyService } from './privacy.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('privacy')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('privacy')
export class PrivacyController {
  constructor(private readonly privacyService: PrivacyService) {}

  @Get('export')
  @ApiOperation({ summary: 'Export all user data as JSON (LGPD compliance)' })
  async exportData(@Request() req) {
    return this.privacyService.exportUserData(req.user.id);
  }

  @Delete('health-data')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete all health data for current user' })
  async deleteHealthData(@Request() req) {
    return this.privacyService.deleteHealthData(req.user.id);
  }

  @Delete('account')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Permanently delete account and all data (LGPD compliance)' })
  async deleteAccount(@Request() req) {
    return this.privacyService.deleteAccount(req.user.id);
  }
}
