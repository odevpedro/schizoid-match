import { Controller, Get, Patch, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from './users.service';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OnboardingService } from './onboarding.service';
import { PublicWellnessProfile } from '../matching/entities/public-wellness-profile.entity';
import {
  OnboardingStep1Dto, OnboardingStep2Dto, OnboardingStep3Dto,
  OnboardingStep4Dto, OnboardingStep5Dto, OnboardingStep6Dto, OnboardingStep7Dto,
} from './dto/onboarding.dto';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly onboardingService: OnboardingService,
    @InjectRepository(PublicWellnessProfile)
    private readonly wellnessRepo: Repository<PublicWellnessProfile>,
  ) {}

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

  @Post('onboarding/step1')
  @ApiOperation({ summary: 'Save onboarding step 1 - main intention' })
  async onboardingStep1(@Request() req, @Body() dto: OnboardingStep1Dto) {
    return this.onboardingService.saveStep1(req.user.id, dto);
  }

  @Post('onboarding/step2')
  @ApiOperation({ summary: 'Save onboarding step 2 - wellness goals' })
  async onboardingStep2(@Request() req, @Body() dto: OnboardingStep2Dto) {
    return this.onboardingService.saveStep2(req.user.id, dto);
  }

  @Post('onboarding/step3')
  @ApiOperation({ summary: 'Save onboarding step 3 - preferred activities' })
  async onboardingStep3(@Request() req, @Body() dto: OnboardingStep3Dto) {
    return this.onboardingService.saveStep3(req.user.id, dto);
  }

  @Post('onboarding/step4')
  @ApiOperation({ summary: 'Save onboarding step 4 - availability periods' })
  async onboardingStep4(@Request() req, @Body() dto: OnboardingStep4Dto) {
    return this.onboardingService.saveStep4(req.user.id, dto);
  }

  @Post('onboarding/step5')
  @ApiOperation({ summary: 'Save onboarding step 5 - intensity preference' })
  async onboardingStep5(@Request() req, @Body() dto: OnboardingStep5Dto) {
    return this.onboardingService.saveStep5(req.user.id, dto);
  }

  @Post('onboarding/step6')
  @ApiOperation({ summary: 'Save onboarding step 6 - privacy visibility settings' })
  async onboardingStep6(@Request() req, @Body() dto: OnboardingStep6Dto) {
    return this.onboardingService.saveStep6(req.user.id, dto);
  }

  @Post('onboarding/step7')
  @ApiOperation({ summary: 'Complete onboarding - generate public wellness profile' })
  async onboardingStep7(@Request() req, @Body() dto: OnboardingStep7Dto) {
    return this.onboardingService.saveStep7(req.user.id, dto);
  }

  @Get('me/wellness-profile')
  @ApiOperation({ summary: 'Get own public wellness profile' })
  async getMyWellnessProfile(@Request() req) {
    const profile = await this.wellnessRepo.findOne({ where: { userId: req.user.id }, relations: ['user'] });
    if (!profile) return { profile: null, message: 'Complete onboarding first' };
    const { user, ...profileData } = profile as any;
    return {
      ...profileData,
      displayName: user?.name || 'Usuário',
      ageRange: user?.birthdate ? calculateAgeRange(user.birthdate) : undefined,
      approximateRegion: user?.locationRegion || undefined,
    };
  }

  @Get('onboarding/status')
  @ApiOperation({ summary: 'Get current onboarding status and step' })
  async getOnboardingStatus(@Request() req) {
    return this.onboardingService.getOnboardingStatus(req.user.id);
  }
}

function calculateAgeRange(birthdate: Date): string {
  const now = new Date();
  const age = now.getFullYear() - new Date(birthdate).getFullYear();
  if (age < 20) return '18-20';
  if (age < 25) return '20-25';
  if (age < 30) return '25-30';
  if (age < 35) return '30-35';
  if (age < 40) return '35-40';
  if (age < 50) return '40-50';
  return '50+';
}
