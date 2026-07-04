import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ChallengesService } from './challenges.service';
import { ChallengeProgressService } from './challenge-progress.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('challenges')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('challenges')
export class ChallengesController {
  constructor(
    private readonly challengesService: ChallengesService,
    private readonly progressService: ChallengeProgressService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all active challenges for current user' })
  async getUserChallenges(@Request() req) {
    return this.challengesService.getUserChallenges(req.user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new challenge with a match partner' })
  async create(@Request() req, @Body() dto: any) {
    return this.challengesService.create(req.user.id, dto);
  }

  @Get('match/:matchId')
  @ApiOperation({ summary: 'Get challenges for a specific match' })
  async getByMatch(@Request() req, @Param('matchId') matchId: string) {
    return this.challengesService.getByMatch(req.user.id, matchId);
  }

  @Post(':id/progress')
  @ApiOperation({ summary: 'Update progress for a challenge' })
  async updateProgress(@Request() req, @Param('id') id: string, @Body('value') value: number) {
    return this.progressService.updateProgress(id, req.user.id, value);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get completed challenge history for current user' })
  async getHistory(@Request() req) {
    return this.challengesService.getHistory(req.user.id);
  }

  @Get(':id/progress')
  @ApiOperation({ summary: 'Get progress for a challenge' })
  async getProgress(@Param('id') id: string) {
    return this.progressService.getProgress(id);
  }
}
