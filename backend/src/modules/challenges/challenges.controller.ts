import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ChallengesService } from './challenges.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('challenges')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('challenges')
export class ChallengesController {
  constructor(private readonly challengesService: ChallengesService) {}

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
}
