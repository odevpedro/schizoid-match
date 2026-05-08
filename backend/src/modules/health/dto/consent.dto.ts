import { IsArray, IsString, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ALL_METRIC_TYPES, HealthMetricType } from '../providers/health-provider.interface';

export class GrantConsentDto {
  @ApiProperty({ example: ['steps', 'sleep'], description: 'Metric types to grant consent for' })
  @IsArray()
  @IsString({ each: true })
  @IsIn(ALL_METRIC_TYPES, { each: true })
  metricTypes: HealthMetricType[];

  @ApiProperty({ example: 'simulated' })
  @IsString()
  sourceProvider: string;
}

export class RevokeConsentDto {
  @ApiProperty({ example: ['heart_rate', 'hrv'] })
  @IsArray()
  @IsString({ each: true })
  @IsIn(ALL_METRIC_TYPES, { each: true })
  metricTypes: HealthMetricType[];
}
