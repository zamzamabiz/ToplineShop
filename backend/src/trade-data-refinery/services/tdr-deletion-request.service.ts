import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { AuthenticatedUser } from '../../auth/types/jwt-payload.type';
import { Role } from '../../auth/types/role.type';
import { success } from '../../common/api-response';

@Injectable()
export class TdrDeletionRequestService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(
    sourceFileId: string,
    reason: string,
    user: AuthenticatedUser,
  ) {
    this.requireAnyRole(user.roles, [
      Role.SUPER_ADMIN,
      Role.TENANT_ADMIN,
      Role.IMPORT_MANAGER,
      Role.EXPORT_MANAGER,
    ]);

    const sf = await this.prisma.tdrSourceFile.findFirst({
      where: { id: sourceFileId, tenantId: user.tenantId },
      select: { id: true },
    });
    if (!sf) throw new NotFoundException(`Source file ${sourceFileId} not found`);

    const existing = await this.prisma.tdrSourceDeletionRequest.findFirst({
      where: { sourceFileId, tenantId: user.tenantId, status: 'PENDING' },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException(
        `A pending deletion request already exists for source file ${sourceFileId}`,
      );
    }

    const req = await this.prisma.tdrSourceDeletionRequest.create({
      data: {
        tenantId: user.tenantId,
        sourceFileId,
        requestedById: user.userId,
        reason,
        status: 'PENDING',
      },
    });

    await this.audit.recordEvent({
      action: 'tdr.deletion_request.created',
      actorUserId: user.userId,
      tenantId: user.tenantId,
      entityType: 'TdrSourceDeletionRequest',
      entityId: req.id,
      metadata: { sourceFileId, reason },
    });

    return success({ id: req.id, status: req.status });
  }

  async approve(requestId: string, reviewNote: string | undefined, user: AuthenticatedUser) {
    this.requireAnyRole(user.roles, [Role.SUPER_ADMIN, Role.TENANT_ADMIN]);

    const req = await this.getOwnedRequest(requestId, user.tenantId);
    if (req.status !== 'PENDING') {
      throw new BadRequestException(`Deletion request is not PENDING (current: ${req.status})`);
    }

    const updated = await this.prisma.tdrSourceDeletionRequest.update({
      where: { id: requestId },
      data: {
        status: 'APPROVED',
        reviewedAt: new Date(),
        reviewedById: user.userId,
        reviewNote: reviewNote ?? null,
      },
    });

    await this.audit.recordEvent({
      action: 'tdr.deletion_request.approved',
      actorUserId: user.userId,
      tenantId: user.tenantId,
      entityType: 'TdrSourceDeletionRequest',
      entityId: requestId,
      metadata: { reviewNote },
    });

    return success({ id: updated.id, status: updated.status });
  }

  async reject(requestId: string, reviewNote: string | undefined, user: AuthenticatedUser) {
    this.requireAnyRole(user.roles, [Role.SUPER_ADMIN, Role.TENANT_ADMIN]);

    const req = await this.getOwnedRequest(requestId, user.tenantId);
    if (req.status !== 'PENDING') {
      throw new BadRequestException(`Deletion request is not PENDING (current: ${req.status})`);
    }

    const updated = await this.prisma.tdrSourceDeletionRequest.update({
      where: { id: requestId },
      data: {
        status: 'REJECTED',
        reviewedAt: new Date(),
        reviewedById: user.userId,
        reviewNote: reviewNote ?? null,
      },
    });

    await this.audit.recordEvent({
      action: 'tdr.deletion_request.rejected',
      actorUserId: user.userId,
      tenantId: user.tenantId,
      entityType: 'TdrSourceDeletionRequest',
      entityId: requestId,
      metadata: { reviewNote },
    });

    return success({ id: updated.id, status: updated.status });
  }

  async cancel(requestId: string, user: AuthenticatedUser) {
    const req = await this.getOwnedRequest(requestId, user.tenantId);
    if (req.status !== 'PENDING') {
      throw new BadRequestException(`Only PENDING requests can be cancelled (current: ${req.status})`);
    }

    const canCancel =
      req.requestedById === user.userId ||
      user.roles.some((r) => [Role.SUPER_ADMIN, Role.TENANT_ADMIN].includes(r as never));
    if (!canCancel) {
      throw new ForbiddenException('Only the requestor or admin may cancel this request');
    }

    const updated = await this.prisma.tdrSourceDeletionRequest.update({
      where: { id: requestId },
      data: { status: 'CANCELLED' },
    });

    await this.audit.recordEvent({
      action: 'tdr.deletion_request.cancelled',
      actorUserId: user.userId,
      tenantId: user.tenantId,
      entityType: 'TdrSourceDeletionRequest',
      entityId: requestId,
      metadata: {},
    });

    return success({ id: updated.id, status: updated.status });
  }

  async list(user: AuthenticatedUser, status?: string) {
    const where: Record<string, unknown> = { tenantId: user.tenantId };
    if (status) where.status = status;

    const requests = await this.prisma.tdrSourceDeletionRequest.findMany({
      where,
      select: {
        id: true,
        sourceFileId: true,
        requestedById: true,
        reason: true,
        status: true,
        requestedAt: true,
        reviewedAt: true,
        reviewedById: true,
        reviewNote: true,
      },
      orderBy: { requestedAt: 'desc' },
    });

    return success(requests);
  }

  private async getOwnedRequest(requestId: string, tenantId: string) {
    const req = await this.prisma.tdrSourceDeletionRequest.findFirst({
      where: { id: requestId, tenantId },
      select: { id: true, status: true, requestedById: true },
    });
    if (!req) throw new NotFoundException(`Deletion request ${requestId} not found`);
    return req;
  }

  private requireAnyRole(roles: string[], allowed: string[]): void {
    if (!roles.some((r) => allowed.includes(r))) {
      throw new ForbiddenException('Insufficient role for this operation');
    }
  }
}
