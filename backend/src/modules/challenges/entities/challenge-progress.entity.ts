import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne,
  JoinColumn, CreateDateColumn, UpdateDateColumn,
} from 'typeorm';
import { Challenge } from './challenge.entity';

@Entity('challenge_progress')
export class ChallengeProgress {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'challenge_id' })
  challengeId: string;

  @ManyToOne(() => Challenge)
  @JoinColumn({ name: 'challenge_id' })
  challenge: Challenge;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'current_value', type: 'decimal', default: 0 })
  currentValue: number;

  @Column({ name: 'target_value', type: 'decimal' })
  targetValue: number;

  @Column({ name: 'unit', nullable: true })
  unit: string;

  @Column({ type: 'date' })
  date: string;

  @Column({ default: 'active' })
  status: 'active' | 'completed' | 'expired';

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
