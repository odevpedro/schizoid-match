import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne,
  JoinColumn, Unique, CreateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('health_profile_daily')
@Unique(['userId', 'date'])
export class HealthProfileDaily {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'date' })
  date: string;

  @Column({ name: 'activity_level', nullable: true })
  activityLevel: string;

  @Column({ name: 'avg_steps_band', nullable: true })
  avgStepsBand: string;

  @Column({ name: 'sleep_quality_band', nullable: true })
  sleepQualityBand: string;

  @Column({ nullable: true })
  chronotype: string;

  @Column({ name: 'recovery_band', nullable: true })
  recoveryBand: string;

  @Column({ name: 'stress_band', nullable: true })
  stressBand: string;

  @Column({ name: 'cardio_fitness_band', nullable: true })
  cardioFitnessBand: string;

  @Column({ name: 'consistency_score', type: 'decimal', precision: 5, scale: 2, nullable: true })
  consistencyScore: number;

  @CreateDateColumn({ name: 'generated_at' })
  generatedAt: Date;
}
