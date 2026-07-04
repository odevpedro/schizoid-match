import { Controller, Get, Post, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { MatchingService } from './matching.service';
import { SwipeDto } from './dto/swipe.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('matching')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('matching')
export class MatchingController {
  constructor(private readonly matchingService: MatchingService) {}

  @Get('candidates')
  @ApiOperation({ summary: 'Get ranked list of match candidates' })
  async getCandidates(@Request() req) {
    return this.matchingService.getCandidates(req.user.id);
  }

  @Post('swipe')
  @ApiOperation({ summary: 'Swipe like or dislike on a candidate' })
  async swipe(@Request() req, @Body() dto: SwipeDto) {
    return this.matchingService.swipe(req.user.id, dto);
  }

  @Get('matches')
  @ApiOperation({ summary: 'Get all active matches for current user' })
  async getMatches(@Request() req) {
    return this.matchingService.getMatches(req.user.id);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get swipe history for current user' })
  async getSwipeHistory(@Request() req) {
    return this.matchingService.getSwipeHistory(req.user.id);
  }

  @Delete('unmatch/:matchId')
  @ApiOperation({ summary: 'Unmatch a previously matched user' })
  async unmatch(@Request() req, @Param('matchId') matchId: string) {
    await this.matchingService.unmatch(req.user.id, matchId);
    return { message: 'Match unmatched successfully' };
  }
}
