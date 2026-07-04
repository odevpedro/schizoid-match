import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export const REPORT_REASONS = [
  'inappropriate_content',
  'harassment',
  'fake_profile',
  'underage',
  'spam',
  'offline_behavior',
  'other',
] as const;

export const REPORT_STATUS = ['pending', 'reviewed', 'dismissed', 'action_taken'] as const;

@Entity('reports')
export class Report {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'reporter_id' })
  reporterId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'reporter_id' })
  reporter: User;

  @Column({ name: 'reported_id' })
  reportedId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'reported_id' })
  reported: User;

  @Column({ name: 'reason' })
  reason: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'match_id', nullable: true })
  matchId: string;

  @Column({ default: 'pending' })
  status: 'pending' | 'reviewed' | 'dismissed' | 'action_taken';

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
