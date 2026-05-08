import {
  Entity, PrimaryColumn, Column, OneToOne, JoinColumn, UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('public_health_profile')
export class PublicHealthProfile {
  @PrimaryColumn({ name: 'user_id' })
  userId: string;

  @OneToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'display_name', nullable: true })
  displayName: string;

  @Column({ name: 'age_range', nullable: true })
  ageRange: string;

  @Column({ name: 'wellness_tags', type: 'text', array: true, default: [] })
  wellnessTags: string[];

  @Column({ type: 'text', array: true, default: [] })
  badges: string[];

  @Column({ name: 'activity_level', nullable: true })
  activityLevel: string;

  @Column({ nullable: true })
  chronotype: string;

  @Column({ type: 'text', array: true, default: [] })
  goals: string[];

  @Column({ name: 'compatibility_summary', type: 'text', nullable: true })
  compatibilitySummary: string;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
