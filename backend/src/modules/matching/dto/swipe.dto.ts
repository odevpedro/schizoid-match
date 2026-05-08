import { IsString, IsIn, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SwipeDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  targetUserId: string;

  @ApiProperty({ example: 'like', enum: ['like', 'dislike', 'super_like'] })
  @IsString()
  @IsIn(['like', 'dislike', 'super_like'])
  direction: 'like' | 'dislike' | 'super_like';
}
