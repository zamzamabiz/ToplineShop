import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditEvent, sanitizeMetadata } from './types/audit-event.type';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async recordEvent(event: AuditEvent): Promise<void> {
    try {
      const sanitized = sanitizeMetadata(event.metadata);

      await this.prisma.auditLog.create({
        data: {
          action: event.action,
          entityType: event.entityType,
          entityId: event.entityId,
          tenantId: event.tenantId,
          actorUserId: event.actorUserId,
          metadata: sanitized
            ? (sanitized as Prisma.InputJsonValue)
            : undefined,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to record audit event: ${error.message}`);
    }
  }
}
