import { IsString, IsArray, IsOptional, IsIn, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OnboardingStep1Dto {
  @ApiProperty({ example: 'friendship', enum: ['friendship', 'walking_partner', 'training_partner', 'habit_accountability', 'social_connection', 'romantic_optional'] })
  @IsString()
  @IsIn(['friendship', 'walking_partner', 'training_partner', 'habit_accountability', 'social_connection', 'romantic_optional'])
  mainIntention: string;
}

export class OnboardingStep2Dto {
  @ApiProperty({ example: ['walk_more', 'exercise_consistently'] })
  @IsArray()
  @IsString({ each: true })
  @IsIn(['walk_more', 'sleep_better', 'exercise_consistently', 'find_training_partner', 'build_routine', 'reduce_sedentary_habits', 'meet_people_safely'], { each: true })
  wellnessGoals: string[];
}

export class OnboardingStep3Dto {
  @ApiProperty({ example: ['walking', 'yoga'] })
  @IsArray()
  @IsString({ each: true })
  @IsIn(['walking', 'running', 'gym', 'cycling', 'yoga', 'stretching', 'outdoor_activity', 'home_workout', 'casual_wellness'], { each: true })
  preferredActivities: string[];
}

export class OnboardingStep4Dto {
  @ApiProperty({ example: ['evening', 'weekends'] })
  @IsArray()
  @IsString({ each: true })
  @IsIn(['early_morning', 'morning', 'afternoon', 'evening', 'night', 'weekends'], { each: true })
  availabilityPeriods: string[];
}

export class OnboardingStep5Dto {
  @ApiProperty({ example: 'moderate', enum: ['low', 'moderate', 'high', 'flexible'] })
  @IsString()
  @IsIn(['low', 'moderate', 'high', 'flexible'])
  intensityPreference: string;
}

export class OnboardingStep6Dto {
  @ApiProperty({ example: true })
  @IsOptional()
  @IsBoolean()
  showPhotosAfterMatch?: boolean;

  @ApiProperty({ example: true })
  @IsOptional()
  @IsBoolean()
  shareActivityLevel?: boolean;

  @ApiProperty({ example: false })
  @IsOptional()
  @IsBoolean()
  shareSleepRoutine?: boolean;
}

export class OnboardingStep7Dto {
  @ApiProperty({ example: 'manual', enum: ['manual', 'simulated'] })
  @IsString()
  source: 'manual' | 'simulated';

  @ApiProperty({ example: 'moderate' })
  @IsOptional()
  @IsString()
  manualActivityLevel?: string;

  @ApiProperty({ example: 'regular' })
  @IsOptional()
  @IsString()
  manualSleepRoutine?: string;

  @ApiProperty({ example: 'morning' })
  @IsOptional()
  @IsString()
  manualChronotype?: string;
}
