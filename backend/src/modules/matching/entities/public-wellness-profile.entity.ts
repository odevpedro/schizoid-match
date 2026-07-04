import { Entity, PrimaryColumn, Column, OneToOne, JoinColumn, UpdateDateColumn, CreateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('public_wellness_profile')
export class PublicWellnessProfile {
  @PrimaryColumn({ name: 'user_id' })
  userId: string;

  @OneToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'activity_level', nullable: true })
  activityLevel: 'low' | 'moderate' | 'active' | 'very_active';

  @Column({ name: 'activity_consistency_band', nullable: true })
  activityConsistencyBand: 'low' | 'medium' | 'high';

  @Column({ name: 'sleep_routine_band', nullable: true })
  sleepRoutineBand: 'irregular' | 'regular' | 'consistent';

  @Column({ name: 'chronotype_band', nullable: true })
  chronotypeBand: 'early' | 'morning' | 'flexible' | 'evening' | 'night';

  @Column({ name: 'intensity_preference', nullable: true })
  intensityPreference: 'low' | 'moderate' | 'high' | 'flexible';

  @Column({ name: 'main_intention', nullable: true })
  mainIntention: string;

  @Column({ name: 'preferred_activities', type: 'text', array: true, default: [] })
  preferredActivities: string[];

  @Column({ name: 'wellness_goals', type: 'text', array: true, default: [] })
  wellnessGoals: string[];

  @Column({ name: 'availability_periods', type: 'text', array: true, default: [] })
  availabilityPeriods: string[];

  @Column({ name: 'public_badges', type: 'text', array: true, default: [] })
  publicBadges: string[];

  @Column({ name: 'score_confidence', default: 'low' })
  scoreConfidence: 'low' | 'medium' | 'high';

  @Column({ default: 'manual' })
  source: 'manual' | 'health_connect' | 'healthkit' | 'mixed';

  @Column({ name: 'is_visible', default: true })
  isVisible: boolean;

  @Column({ name: 'onboarding_completed', default: false })
  onboardingCompleted: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
