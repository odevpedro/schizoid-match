import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('moderation_actions')
export class ModerationAction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'target_user_id' })
  targetUserId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'target_user_id' })
  targetUser: User;

  @Column({ name: 'action_type' })
  actionType: 'warning' | 'temporary_ban' | 'permanent_ban' | 'content_removed';

  @Column({ type: 'text', nullable: true })
  reason: string;

  @Column({ name: 'report_id', nullable: true })
  reportId: string;

  @Column({ name: 'expires_at', type: 'timestamptz', nullable: true })
  expiresAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
