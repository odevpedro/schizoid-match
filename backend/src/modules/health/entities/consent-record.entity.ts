import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne,
  JoinColumn, CreateDateColumn, Check,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

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

  @Column({ name: 'granted_at', type: 'timestamptz', nullable: true })
  grantedAt: Date;

  @Column({ name: 'revoked_at', type: 'timestamptz', nullable: true })
  revokedAt: Date;

  @Column({ name: 'source_provider', nullable: true })
  sourceProvider: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
