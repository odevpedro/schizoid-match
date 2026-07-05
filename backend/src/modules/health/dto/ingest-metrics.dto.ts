import { IsString, IsDateString, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class MetricSample {
  @ApiProperty({ example: 'steps' })
  @IsString()
  type: string;

  @ApiProperty({ example: 8432 })
  value: number;

  @ApiProperty({ example: 'count' })
  @IsString()
  unit: string;

  @ApiProperty({ example: '2026-07-04T12:00:00Z' })
  @IsString()
  timestamp: string;
}

export class IngestMetricsDto {
  @ApiProperty({ example: 'simulated', description: 'Health data provider name' })
  @IsString()
  provider: string;

  @ApiPropertyOptional({ example: '2024-01-01' })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional({ example: '2024-01-07' })
  @IsOptional()
  @IsDateString()
  toDate?: string;

  @ApiPropertyOptional({ type: [MetricSample], description: 'Direct metric samples to ingest' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MetricSample)
  metrics?: MetricSample[];
}
