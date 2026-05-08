import {
  Entity, PrimaryColumn, Column, OneToOne, JoinColumn,
  CreateDateColumn, UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('user_preferences')
export class UserPreferences {
  @PrimaryColumn({ name: 'user_id' })
  userId: string;

  @OneToOne(() => User, (user) => user.preferences)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'wellness_goals', type: 'text', array: true, default: [] })
  wellnessGoals: string[];

  @Column({ name: 'preferred_activities', type: 'text', array: true, default: [] })
  preferredActivities: string[];

  @Column({ name: 'preferred_intensity', default: 'moderate' })
  preferredIntensity: string;

  @Column({ name: 'availability_periods', type: 'text', array: true, default: [] })
  availabilityPeriods: string[];

  @Column({ name: 'max_distance_km', default: 50 })
  maxDistanceKm: number;

  @Column({ name: 'chronotype_preference', nullable: true })
  chronotypePreference: string;

  @Column({ name: 'show_photos_after_match', default: true })
  showPhotosAfterMatch: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
