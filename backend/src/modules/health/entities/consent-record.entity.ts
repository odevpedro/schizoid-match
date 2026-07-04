import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne,
  JoinColumn, CreateDateColumn, UpdateDateColumn, Check,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export const CONSENT_VERSIONS = ['v1', 'v2'] as const;
export const CONSENT_PURPOSE = [
  'matching_compatibility',
  'profile_visibility',
  'data_analytics',
  'wellness_badges',
  'activity_sharing',
] as const;

@Entity('consent_records')
@Check(`"permission_status" IN ('granted', 'revoked', 'pending')`)
export class ConsentRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'metric_type' })
  metricType: string;

  @Column({ name: 'permission_status' })
  permissionStatus: 'granted' | 'revoked' | 'pending';

  @Column({ name: 'purpose' })
  purpose: string;

  @Column({ name: 'consent_version', default: 'v1' })
  consentVersion: string;

  @Column({ name: 'granted_at', type: 'timestamptz', nullable: true })
  grantedAt: Date;

  @Column({ name: 'revoked_at', type: 'timestamptz', nullable: true })
  revokedAt: Date;

  @Column({ name: 'source_provider', nullable: true })
  sourceProvider: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
