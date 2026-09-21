import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  StreamableFile,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { StorageService } from '../ingestion/storage/storage.service';
import { AuthenticatedUser } from '../../auth/types/jwt-payload.type';
import { Role } from '../../auth/types/role.type';
import { success } from '../../common/api-response';

@Injectable()
export class TdrSourceLifecycleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly storage: StorageService,
  ) {}

  async archiveSourceFile(sourceFileId: string, user: AuthenticatedUser) {
    requireAdminRole(user.roles);

    const sf = await this.prisma.tdrSourceFile.findFirst({
      where: { id: sourceFileId, tenantId: user.tenantId },
      select: { id: true, archivedAt: true },
    });
    if (!sf) throw new NotFoundException(`Source file ${sourceFileId} not found`);
    if (sf.archivedAt) throw new ConflictException('Source file is already archived');

    await this.prisma.tdrSourceFile.update({
      where: { id: sourceFileId },
      data: { archivedAt: new Date() },
    });

    await this.audit.recordEvent({
      action: 'tdr.sourceFile.archived',
      actorUserId: user.userId,
      tenantId: user.tenantId,
      entityType: 'TdrSourceFile',
      entityId: sourceFileId,
      metadata: { sourceFileId },
    });

    return success({ archived: true, sourceFileId });
  }

  async restoreSourceFile(sourceFileId: string, user: AuthenticatedUser) {
    requireAdminRole(user.roles);

    const sf = await this.prisma.tdrSourceFile.findFirst({
      where: { id: sourceFileId, tenantId: user.tenantId },
      select: { id: true, archivedAt: true },
    });
    if (!sf) throw new NotFoundException(`Source file ${sourceFileId} not found`);
    if (!sf.archivedAt) throw new UnprocessableEntityException('Source file is not archived');

    await this.prisma.tdrSourceFile.update({
      where: { id: sourceFileId },
      data: { archivedAt: null },
    });

    await this.audit.recordEvent({
      action: 'tdr.sourceFile.restored',
      actorUserId: user.userId,
      tenantId: user.tenantId,
      entityType: 'TdrSourceFile',
      entityId: sourceFileId,
      metadata: { sourceFileId },
    });

    return success({ restored: true, sourceFileId });
  }

  async downloadSourceFile(sourceFileId: string, user: AuthenticatedUser): Promise<StreamableFile> {
    const sf = await this.prisma.tdrSourceFile.findFirst({
      where: { id: sourceFileId, tenantId: user.tenantId },
      select: {
        id: true,
        storageKey: true,
        originalFilename: true,
        mimeType: true,
        tradeDirection: true,
        archivedAt: true,
      },
    });
    if (!sf) throw new NotFoundException(`Source file ${sourceFileId} not found`);

    checkSourceDownloadAuthorization(user.roles, sf.tradeDirection);

    const safeName = (sf.originalFilename ?? `source-${sf.id}`)
      .replace(/[\r\n"\\]/g, '_')
      .slice(0, 200);

    const stream = this.storage.createReadStream(sf.storageKey);
    return new StreamableFile(stream, {
      type: sf.mimeType ?? 'application/octet-stream',
      disposition: `attachment; filename="${safeName}"`,
      length: undefined,
    });
  }
}

function requireAdminRole(roles: string[]): void {
  if (
    !roles.includes(Role.SUPER_ADMIN) &&
    !roles.includes(Role.TENANT_ADMIN)
  ) {
    throw new ForbiddenException('Only admins can manage source file lifecycle');
  }
}

function checkSourceDownloadAuthorization(roles: string[], tradeDirection: string): void {
  if (roles.includes(Role.SUPER_ADMIN) || roles.includes(Role.TENANT_ADMIN)) return;
  if (tradeDirection === 'IMPORT' && roles.includes(Role.IMPORT_MANAGER)) return;
  if (tradeDirection === 'EXPORT' && roles.includes(Role.EXPORT_MANAGER)) return;
  throw new ForbiddenException('Not authorized to download this source file');
}
