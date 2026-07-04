import { IsArray, IsString, IsOptional, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CONSENT_PURPOSE, CONSENT_VERSIONS } from '../entities/consent-record.entity';

export class GrantConsentDto {
  @ApiProperty({ example: ['steps', 'sleep'] })
  @IsArray()
  @IsString({ each: true })
  metricTypes: string[];

  @ApiProperty({ example: 'simulated' })
  @IsString()
  sourceProvider: string;

  @ApiProperty({ example: 'matching_compatibility', enum: CONSENT_PURPOSE })
  @IsString()
  @IsIn(CONSENT_PURPOSE)
  purpose: string;

  @ApiPropertyOptional({ example: 'v1', enum: CONSENT_VERSIONS })
  @IsOptional()
  @IsString()
  @IsIn(CONSENT_VERSIONS)
  consentVersion?: string;
}

export class RevokeConsentDto {
  @ApiProperty({ example: ['heart_rate', 'hrv'] })
  @IsArray()
  @IsString({ each: true })
  metricTypes: string[];
}
