import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { success } from '../../common/api-response';
import { TDR_PROCESSING_VERSIONS } from '../config/processing-version.config';
import { computeFingerprintHash } from '../utils/fingerprint.util';
import {
  CANCELLABLE_STATUSES,
  REPLAYABLE_STATUSES,
} from '../types/batch-transition';
import { ListBatchesDto } from '../dto/list-batches.dto';
import { ReplayBatchDto } from '../dto/replay-batch.dto';
import { TenantModuleService } from './tenant-module.service';

@Injectable()
export class TdrService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly tenantModuleService: TenantModuleService,
  ) {}

  async getStatus(tenantId: string, userId: string) {
    const [moduleEnabled, batchGroups] = await Promise.all([
      this.tenantModuleService.isModuleEnabled(tenantId),
      this.prisma.tdrBatch.groupBy({
        by: ['status'],
        where: { tenantId },
        _count: { id: true },
      }),
    ]);

    const batchSummary = batchGroups.reduce<Record<string, number>>(
      (acc, row) => ({ ...acc, [row.status]: row._count.id }),
      {},
    );

    return success({ moduleEnabled, batchSummary, processingVersions: TDR_PROCESSING_VERSIONS });
  }

  async listBatches(tenantId: string, dto: ListBatchesDto) {
    const page = dto.page ?? 1;
    const pageSize = dto.pageSize ?? 25;
    const skip = (page - 1) * pageSize;

    const where = {
      tenantId,
      ...(dto.status ? { status: dto.status } : {}),
      ...(dto.tradeDirection ? { tradeDirection: dto.tradeDirection } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.tdrBatch.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
        select: {
          id: true,
          status: true,
          tradeDirection: true,
          processedRows: true,
          acceptedRows: true,
          quarantinedRows: true,
          rejectedRows: true,
          totalSourceRows: true,
          replayOfBatchId: true,
          createdAt: true,
          updatedAt: true,
          completedAt: true,
        },
      }),
      this.prisma.tdrBatch.count({ where }),
    ]);

    return success(items, { page, pageSize, total, totalPages: Math.ceil(total / pageSize) });
  }

  async getBatch(batchId: string, tenantId: string) {
    const batch = await this.prisma.tdrBatch.findFirst({
      where: { id: batchId, tenantId },
      include: {
        processingJob: {
          select: {
            id: true,
            status: true,
            attemptCount: true,
            lastCheckpointRow: true,
            leasedAt: true,
            leaseExpiresAt: true,
            errorMessage: true,
            completedAt: true,
          },
        },
      },
    });
    if (!batch) throw new NotFoundException(`Batch ${batchId} not found`);
    return success(batch);
  }

  async getBatchProgress(batchId: string, tenantId: string) {
    const batch = await this.prisma.tdrBatch.findFirst({
      where: { id: batchId, tenantId },
      select: {
        id: true,
        status: true,
        totalSourceRows: true,
        processedRows: true,
        acceptedRows: true,
        quarantinedRows: true,
        rejectedRows: true,
        failedChunks: true,
        lastCheckpointAt: true,
        startedAt: true,
        completedAt: true,
      },
    });
    if (!batch) throw new NotFoundException(`Batch ${batchId} not found`);
    return success(batch);
  }

  async cancelBatch(batchId: string, tenantId: string, userId: string) {
    const batch = await this.prisma.tdrBatch.findFirst({
      where: { id: batchId, tenantId },
      select: { id: true, status: true },
    });
    if (!batch) throw new NotFoundException(`Batch ${batchId} not found`);

    if (!CANCELLABLE_STATUSES.includes(batch.status)) {
      throw new UnprocessableEntityException(
        `Batch in status ${batch.status} cannot be cancelled`,
      );
    }

    await this.prisma.$transaction([
      this.prisma.tdrBatch.update({
        where: { id: batchId },
        data: { status: 'CANCELLED' },
      }),
      this.prisma.tdrProcessingJob.updateMany({
        where: { batchId, status: { in: ['PENDING', 'LEASED'] } },
        data: {
          status: 'CANCELLED',
          completedAt: new Date(),
          leasedAt: null,
          leaseExpiresAt: null,
          workerInstanceId: null,
        },
      }),
    ]);

    await this.auditService.recordEvent({
      action: 'tdr.batch.cancelled',
      actorUserId: userId,
      tenantId,
      entityType: 'TdrBatch',
      entityId: batchId,
      metadata: { batchId },
    });

    return success({ cancelled: true });
  }

  async replayBatch(
    batchId: string,
    tenantId: string,
    userId: string,
    dto: ReplayBatchDto,
  ) {
    const original = await this.prisma.tdrBatch.findFirst({
      where: { id: batchId, tenantId },
      select: {
        id: true,
        status: true,
        sourceFileId: true,
        mappingId: true,
        tradeDirection: true,
        mappingVersion: true,
        parserVersion: true,
        normalizationVersion: true,
        validationVersion: true,
        storeSourceRows: true,
        processingConfig: true,
        sourceFile: { select: { contentHash: true } },
      },
    });
    if (!original) throw new NotFoundException(`Batch ${batchId} not found`);

    if (!REPLAYABLE_STATUSES.includes(original.status)) {
      throw new UnprocessableEntityException(
        `Batch in status ${original.status} cannot be replayed`,
      );
    }

    const fingerprintHash = computeFingerprintHash({
      tenantId,
      contentHash: original.sourceFile.contentHash,
      mappingVersion: original.mappingVersion,
      parserVersion: original.parserVersion,
      normalizationVersion: original.normalizationVersion,
      validationVersion: original.validationVersion,
    });

    const newBatch = await this.prisma.tdrBatch.create({
      data: {
        tenantId,
        sourceFileId: original.sourceFileId,
        mappingId: original.mappingId,
        status: 'RECEIVED',
        tradeDirection: original.tradeDirection,
        mappingVersion: original.mappingVersion,
        parserVersion: TDR_PROCESSING_VERSIONS.parser,
        normalizationVersion: TDR_PROCESSING_VERSIONS.normalization,
        validationVersion: TDR_PROCESSING_VERSIONS.validation,
        processingFingerprintHash: fingerprintHash,
        replayOfBatchId: original.id,
        replayReason: dto.reason ?? null,
        storeSourceRows: original.storeSourceRows,
        processingConfig: original.processingConfig ?? undefined,
        createdById: userId,
      },
    });

    await this.prisma.tdrProcessingJob.create({
      data: {
        batchId: newBatch.id,
        tenantId,
        status: 'PENDING',
      },
    });

    await this.auditService.recordEvent({
      action: 'tdr.batch.replayed',
      actorUserId: userId,
      tenantId,
      entityType: 'TdrBatch',
      entityId: newBatch.id,
      metadata: { originalBatchId: batchId, newBatchId: newBatch.id },
    });

    return success({ replayBatchId: newBatch.id });
  }
}
