import { IsString, IsDateString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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
}
