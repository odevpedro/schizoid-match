import { Controller, Post, Get, Delete, Body, Param, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ModerationService } from './moderation.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('moderation')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('moderation')
export class ModerationController {
  constructor(private readonly moderationService: ModerationService) {}

  @Post('block')
  @ApiOperation({ summary: 'Block another user' })
  async blockUser(@Request() req, @Body() body: { targetUserId: string; reason?: string }) {
    return this.moderationService.blockUser(req.user.id, body.targetUserId, body.reason);
  }

  @Delete('block/:targetUserId')
  @ApiOperation({ summary: 'Unblock a previously blocked user' })
  async unblockUser(@Request() req, @Param('targetUserId') targetUserId: string) {
    return this.moderationService.unblockUser(req.user.id, targetUserId);
  }

  @Get('blocks')
  @ApiOperation({ summary: 'Get list of blocked users' })
  async getBlocks(@Request() req) {
    return this.moderationService.getBlocks(req.user.id);
  }

  @Post('report')
  @ApiOperation({ summary: 'Report a user for moderation review' })
  async reportUser(@Request() req, @Body() body: { targetUserId: string; reason: string; description?: string; matchId?: string }) {
    return this.moderationService.reportUser(req.user.id, body.targetUserId, body.reason, body.description, body.matchId);
  }

  @Get('reports')
  @ApiOperation({ summary: 'Get reports (user sees own, admin sees all)' })
  async getReports(@Request() req) {
    return this.moderationService.getReports(req.user.id, req.user.role);
  }
}
