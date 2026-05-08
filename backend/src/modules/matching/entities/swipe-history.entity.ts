import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne,
  JoinColumn, CreateDateColumn, Unique, Check,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('swipe_history')
@Unique(['userId', 'targetUserId'])
@Check(`"direction" IN ('like', 'dislike', 'super_like')`)
export class SwipeHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'target_user_id' })
  targetUserId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'target_user_id' })
  targetUser: User;

  @Column()
  direction: 'like' | 'dislike' | 'super_like';

  @CreateDateColumn({ name: 'timestamp' })
  timestamp: Date;
}
