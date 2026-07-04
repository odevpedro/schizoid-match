import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditEvent, AuditEventType } from './entities/audit-event.entity';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditEvent)
    private readonly auditRepo: Repository<AuditEvent>,
  ) {}

  async record(params: {
    userId?: string;
    eventType: AuditEventType;
    resourceType?: string;
    resourceId?: string;
    metadata?: Record<string, any>;
    ipAddress?: string;
  }): Promise<AuditEvent> {
    const event = this.auditRepo.create({
      userId: params.userId || null,
      eventType: params.eventType,
      resourceType: params.resourceType || null,
      resourceId: params.resourceId || null,
      metadata: params.metadata || null,
      ipAddress: params.ipAddress || null,
    });
    return this.auditRepo.save(event);
  }

  async findByUserId(userId: string, limit = 50): Promise<AuditEvent[]> {
    return this.auditRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async findByEventType(eventType: AuditEventType, limit = 50): Promise<AuditEvent[]> {
    return this.auditRepo.find({
      where: { eventType },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}
