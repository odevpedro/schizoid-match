import { IsArray, IsBoolean, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePreferencesDto {
  @ApiPropertyOptional({ example: ['fitness', 'better_sleep'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  wellnessGoals?: string[];

  @ApiPropertyOptional({ example: ['running', 'yoga', 'cycling'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferredActivities?: string[];

  @ApiPropertyOptional({ example: 'moderate', enum: ['low', 'moderate', 'high', 'very_high'] })
  @IsOptional()
  @IsString()
  preferredIntensity?: string;

  @ApiPropertyOptional({ example: ['morning', 'weekend'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  availabilityPeriods?: string[];

  @ApiPropertyOptional({ example: 30 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(500)
  maxDistanceKm?: number;

  @ApiPropertyOptional({ example: 'morning', enum: ['morning', 'evening', 'flexible'] })
  @IsOptional()
  @IsString()
  chronotypePreference?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  showPhotosAfterMatch?: boolean;
}
