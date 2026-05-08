import { IsEmail, IsString, MinLength, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'StrongPass123!' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: 'Ana Lima' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: '1995-06-15' })
  @IsOptional()
  @IsDateString()
  birthdate?: string;

  @ApiPropertyOptional({ example: 'female' })
  @IsOptional()
  @IsString()
  genderOptional?: string;

  @ApiPropertyOptional({ example: 'São Paulo, SP' })
  @IsOptional()
  @IsString()
  locationRegion?: string;
}
