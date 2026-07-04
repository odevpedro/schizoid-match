import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AvatarDto {
  @ApiProperty({ description: 'Avatar URL or base64 data URL' })
  @IsString()
  @IsNotEmpty()
  avatarUrl: string;
}
