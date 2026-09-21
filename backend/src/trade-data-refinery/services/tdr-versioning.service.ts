import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as path from 'path';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { StorageService } from '../ingestion/storage/storage.service';
import { MappingResolverService } from '../ingestion/mapping/mapping-resolver.service';
import { AuthenticatedUser } from '../../auth/types/jwt-payload.type';
import { Role } from '../../auth/types/role.type';
import { computeFileHash } from '../ingestion/utils/file-hash.util';
import { computeFingerprintHash } from '../utils/fingerprint.util';
import { TDR_PROCESSING_VERSIONS } from '../config/processing-version.config';
import { success } from '../../common/api-response';

export interface CreateReplacementParams {
  file: Express.Multer.File;
  previousSourceFileId: string;
  replacementReason: string;
  mappingProfileId?: string;
  user: AuthenticatedUser;
}

export interface LineageVersion {
  id: string;
  versionNumber: number;
  originalFilename: string;
  uploadedAt: Date;
  fileSizeBytes: string;
  replacementReason: string | null;
  uploadedById: string;
  archivedAt: Date | null;
}

@Injectable()
export class TdrVersioningService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly storage: StorageService,
    private readonly mappingResolver: MappingResolverService,
  ) {}

  async createReplacement(params: CreateReplacementParams) {
    const { file, previousSourceFileId, replacementReason, mappingProfileId, user } = params;

    this.checkUploadAuthorization(user.roles);

    const prevFile = await this.prisma.tdrSourceFile.findFirst({
      where: { id: previousSourceFileId, tenantId: user.tenantId },
      select: {
        id: true,
        tenantId: true,
        tradeDirection: true,
        logicalDatasetId: true,
        versionNumber: true,
        archivedAt: true,
      },
    });
    if (!prevFile) {
      throw new NotFoundException(`Source file ${previousSourceFileId} not found`);
    }
    if (!prevFile.logicalDatasetId) {
      throw new BadRequestException(
        `Source file ${previousSourceFileId} has no logical dataset assigned; backfill may be pending`,
      );
    }

    const tempPath = file.path;
    let permanentKey: string | null = null;

    try {
      const contentHash = await computeFileHash(tempPath);

      const existing = await this.prisma.tdrSourceFile.findUnique({
        where: { tenantId_contentHash: { tenantId: user.tenantId, contentHash } },
        select: { id: true },
      });
      if (existing) {
        throw new ConflictException(
          `Identical file already uploaded (sourceFileId: ${existing.id}). Replacement must provide new source evidence.`,
        );
      }

      const mapping = await this.mappingResolver.resolveMapping(
        user.tenantId,
        mappingProfileId,
        prevFile.tradeDirection,
      );
      const mappingVersion = String(mapping.version);
      const fingerprintHash = computeFingerprintHash({
        tenantId: user.tenantId,
        contentHash,
        mappingVersion,
        parserVersion: TDR_PROCESSING_VERSIONS.parser,
        normalizationVersion: TDR_PROCESSING_VERSIONS.normalization,
        validationVersion: TDR_PROCESSING_VERSIONS.validation,
      });

      const dupBatch = await this.prisma.tdrBatch.findFirst({
        where: { tenantId: user.tenantId, processingFingerprintHash: fingerprintHash },
        select: { id: true },
      });
      if (dupBatch) {
        throw new ConflictException(
          `Identical processing fingerprint exists (batchId: ${dupBatch.id}). Use replay to force reprocessing.`,
        );
      }

      const newSourceFileId = randomUUID();
      const storageKey = this.storage.generateKey(user.tenantId, newSourceFileId);
      await this.storage.persist(tempPath, storageKey);
      permanentKey = storageKey;

      const newVersionNumber = prevFile.versionNumber + 1;
      const ext = path.extname(file.originalname).toLowerCase();
      const mimeType =
        ext === '.xlsx'
          ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          : 'text/csv';

      const uploadedAt = new Date();
      const retentionExpiresAt = new Date(uploadedAt);
      retentionExpiresAt.setFullYear(retentionExpiresAt.getFullYear() + 7);

      const { sourceFile, batchId, jobId } = await this.prisma.$transaction(async (tx) => {
        const sf = await tx.tdrSourceFile.create({
          data: {
            id: newSourceFileId,
            tenantId: user.tenantId,
            originalFilename: path.basename(file.originalname),
            mimeType,
            fileSizeBytes: BigInt(file.size),
            storageKey,
            contentHash,
            tradeDirection: prevFile.tradeDirection,
            uploadedById: user.userId,
            uploadedAt,
            retentionExpiresAt,
            logicalDatasetId: prevFile.logicalDatasetId,
            versionNumber: newVersionNumber,
            supersedesSourceFileId: previousSourceFileId,
            replacementReason,
          },
        });

        const batch = await tx.tdrBatch.create({
          data: {
            tenantId: user.tenantId,
            sourceFileId: newSourceFileId,
            mappingId: mapping.id,
            status: 'QUEUED',
            tradeDirection: prevFile.tradeDirection,
            mappingVersion,
            parserVersion: TDR_PROCESSING_VERSIONS.parser,
            normalizationVersion: TDR_PROCESSING_VERSIONS.normalization,
            validationVersion: TDR_PROCESSING_VERSIONS.validation,
            processingFingerprintHash: fingerprintHash,
            createdById: user.userId,
          },
        });

        const job = await tx.tdrProcessingJob.create({
          data: {
            batchId: batch.id,
            tenantId: user.tenantId,
            status: 'PENDING',
          },
        });

        return { sourceFile: sf, batchId: batch.id, jobId: job.id };
      });

      await this.audit.recordEvent({
        action: 'tdr.source.version_replaced',
        actorUserId: user.userId,
        tenantId: user.tenantId,
        entityType: 'TdrSourceFile',
        entityId: newSourceFileId,
        metadata: {
          previousSourceFileId,
          newSourceFileId,
          logicalDatasetId: prevFile.logicalDatasetId,
          versionNumber: newVersionNumber,
          batchId,
        },
      });

      return success({
        sourceFileId: newSourceFileId,
        batchId,
        jobId,
        versionNumber: newVersionNumber,
        logicalDatasetId: prevFile.logicalDatasetId,
        status: 'QUEUED' as const,
      });
    } catch (err) {
      if (permanentKey) {
        await this.storage.removeSafe(permanentKey);
      } else {
        await this.storage.removeTempSafe(tempPath);
      }
      throw err;
    }
  }

  async getLineage(logicalDatasetId: string, user: AuthenticatedUser) {
    const versions = await this.prisma.tdrSourceFile.findMany({
      where: { tenantId: user.tenantId, logicalDatasetId },
      select: {
        id: true,
        versionNumber: true,
        originalFilename: true,
        uploadedAt: true,
        fileSizeBytes: true,
        replacementReason: true,
        uploadedById: true,
        archivedAt: true,
      },
      orderBy: { versionNumber: 'asc' },
    });

    if (versions.length === 0) {
      throw new NotFoundException(`Logical dataset ${logicalDatasetId} not found`);
    }

    return success(
      versions.map((v) => ({
        ...v,
        fileSizeBytes: v.fileSizeBytes.toString(),
      })),
    );
  }

  private checkUploadAuthorization(roles: string[]): void {
    const canUpload = roles.some((r) =>
      [Role.SUPER_ADMIN, Role.TENANT_ADMIN, Role.IMPORT_MANAGER, Role.EXPORT_MANAGER].includes(
        r as never,
      ),
    );
    if (!canUpload) {
      throw new ForbiddenException('Not authorized to replace source files');
    }
  }
}
