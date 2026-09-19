import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  StreamableFile,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { AuditService } from '../../../audit/audit.service';
import { StorageService } from '../../ingestion/storage/storage.service';
import { AuthenticatedUser } from '../../../auth/types/jwt-payload.type';
import { Role } from '../../../auth/types/role.type';
import { CreateExportDto } from '../dto/create-export.dto';
import { QUALITY_ERROR } from '../../quality/constants/quality-error.codes';
import { DEFAULT_EXPORT_ROW_LIMIT } from '../../quality/constants/quality.limits';
import { success } from '../../../common/api-response';

@Injectable()
export class TdrExportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly storage: StorageService,
  ) {}

  async createExport(dto: CreateExportDto, user: AuthenticatedUser) {
    checkExportAuthorization(user.roles, dto.tradeDirection);

    const rowLimit = dto.rowLimit ?? DEFAULT_EXPORT_ROW_LIMIT;
    const filterConfig = buildFilterConfig(dto);

    const job = await this.prisma.tdrExportJob.create({
      data: {
        tenantId: user.tenantId,
        requestedById: user.userId,
        status: 'PENDING',
        tradeDirection: dto.tradeDirection ?? null,
        filterConfig: filterConfig as object,
        rowLimit,
      },
      select: {
        id: true,
        status: true,
        tradeDirection: true,
        rowLimit: true,
        createdAt: true,
      },
    });

    await this.audit.recordEvent({
      action: 'tdr.export.created',
      actorUserId: user.userId,
      tenantId: user.tenantId,
      entityType: 'TdrExportJob',
      entityId: job.id,
      metadata: { jobId: job.id },
    });

    return success(job);
  }

  async getExportStatus(exportId: string, user: AuthenticatedUser) {
    const job = await this.prisma.tdrExportJob.findFirst({
      where: { id: exportId, tenantId: user.tenantId },
      select: {
        id: true,
        status: true,
        tradeDirection: true,
        rowLimit: true,
        rowCount: true,
        attemptCount: true,
        errorCode: true,
        errorMessage: true,
        startedAt: true,
        completedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!job) throw new NotFoundException(QUALITY_ERROR.EXPORT_NOT_FOUND);
    return success(job);
  }

  async downloadExport(exportId: string, user: AuthenticatedUser): Promise<StreamableFile> {
    const job = await this.prisma.tdrExportJob.findFirst({
      where: { id: exportId, tenantId: user.tenantId },
      select: {
        id: true,
        status: true,
        storageKey: true,
        rowCount: true,
        tradeDirection: true,
      },
    });

    if (!job) throw new NotFoundException(QUALITY_ERROR.EXPORT_NOT_FOUND);
    if (job.status !== 'COMPLETED' || !job.storageKey) {
      throw new BadRequestException(QUALITY_ERROR.EXPORT_NOT_READY);
    }

    const stream = this.storage.createReadStream(job.storageKey);
    return new StreamableFile(stream, {
      type: 'text/csv',
      disposition: `attachment; filename="tdr-export-${job.id}.csv"`,
      length: undefined,
    });
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function checkExportAuthorization(roles: string[], tradeDirection?: string): void {
  const isSuperAdmin = roles.includes(Role.SUPER_ADMIN);
  const isTenantAdmin = roles.includes(Role.TENANT_ADMIN);
  const isImportManager = roles.includes(Role.IMPORT_MANAGER);
  const isExportManager = roles.includes(Role.EXPORT_MANAGER);
  const isAnalyst = roles.includes(Role.ANALYST);

  if (isSuperAdmin || isTenantAdmin || isAnalyst) return;
  if (tradeDirection === 'IMPORT' && isImportManager) return;
  if (tradeDirection === 'EXPORT' && isExportManager) return;
  // No direction filter: only admin/analyst can export all
  if (!tradeDirection && (isImportManager || isExportManager)) {
    throw new ForbiddenException('Specify tradeDirection to export your direction only');
  }
  throw new ForbiddenException('Not authorized to create exports');
}

function buildFilterConfig(dto: CreateExportDto): Record<string, unknown> {
  const config: Record<string, unknown> = {};
  if (dto.batchId) config['batchId'] = dto.batchId;
  if (dto.tradeDirection) config['tradeDirection'] = dto.tradeDirection;
  if (dto.dateFrom) config['dateFrom'] = dto.dateFrom;
  if (dto.dateTo) config['dateTo'] = dto.dateTo;
  if (dto.hsChapter) config['hsChapter'] = dto.hsChapter;
  if (dto.hsCode) config['hsCode'] = dto.hsCode;
  if (dto.foreignPartyCountryCode) config['foreignPartyCountryCode'] = dto.foreignPartyCountryCode;
  return config;
}
