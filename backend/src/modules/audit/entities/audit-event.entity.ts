import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

export type AuditEventType =
  | 'user_registered'
  | 'login_success'
  | 'login_failed'
  | 'onboarding_completed'
  | 'public_profile_updated'
  | 'consent_granted'
  | 'consent_revoked'
  | 'privacy_export_requested'
  | 'health_data_deleted'
  | 'account_deleted'
  | 'user_blocked'
  | 'user_unblocked'
  | 'user_reported'
  | 'moderation_action_taken'
  | 'match_created'
  | 'message_sent'
  | 'message_read'
  | 'retention_cleanup_executed';

@Entity('audit_events')
export class AuditEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  @Index()
  userId: string | null;

  @Column({ name: 'event_type', type: 'varchar', length: 50 })
  eventType: AuditEventType;

  @Column({ name: 'resource_type', type: 'varchar', length: 50, nullable: true })
  resourceType: string | null;

  @Column({ name: 'resource_id', type: 'uuid', nullable: true })
  resourceId: string | null;

  @Column({ name: 'metadata', type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @Column({ name: 'ip_address', type: 'varchar', nullable: true })
  ipAddress: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
