import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from '../../users/entities/user.entity';

// This table is INTERNAL ONLY. Fields are never returned via API to other users.
@Entity('health_metrics_raw')
@Index(['userId', 'timestamp'])
export class HealthMetricsRaw {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'timestamptz' })
  timestamp: Date;

  @Column({ name: 'source_provider', nullable: true })
  sourceProvider: string;

  @Column({ name: 'heart_rate_bpm', type: 'int', nullable: true })
  heartRateBpm: number;

  @Column({ name: 'hrv_ms', type: 'decimal', precision: 6, scale: 2, nullable: true })
  hrvMs: number;

  @Column({ type: 'int', nullable: true })
  steps: number;

  @Column({ type: 'int', nullable: true })
  calories: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  vo2max: number;

  @Column({ name: 'sleep_minutes', type: 'int', nullable: true })
  sleepMinutes: number;

  @Column({ name: 'sleep_score', type: 'decimal', precision: 5, scale: 2, nullable: true })
  sleepScore: number;

  @Column({ name: 'stress_level', type: 'decimal', precision: 5, scale: 2, nullable: true })
  stressLevel: number;

  @Column({ name: 'blood_oxygen', type: 'decimal', precision: 5, scale: 2, nullable: true })
  bloodOxygen: number;

  @Column({ name: 'skin_temp', type: 'decimal', precision: 5, scale: 2, nullable: true })
  skinTemp: number;
}
