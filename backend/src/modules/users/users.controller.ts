import { Controller, Get, Patch, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  async getMe(@Request() req) {
    return this.usersService.getPublicProfile(req.user.id);
  }

  @Get(':id/public')
  @ApiOperation({ summary: 'Get public profile of a user' })
  async getPublicProfile(@Param('id') id: string) {
    return this.usersService.getPublicProfile(id);
  }

  @Patch('me/preferences')
  @ApiOperation({ summary: 'Update current user preferences' })
  async updatePreferences(@Request() req, @Body() dto: UpdatePreferencesDto) {
    return this.usersService.updatePreferences(req.user.id, dto);
  }
}
