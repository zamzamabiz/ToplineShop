import { ConflictException, ForbiddenException, Injectable, Logger } from '@nestjs/common';
import * as path from 'path';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../../prisma/prisma.service';
import { AuditService } from '../../../audit/audit.service';
import { AuthenticatedUser } from '../../../auth/types/jwt-payload.type';
import { Role } from '../../../auth/types/role.type';
import { computeFingerprintHash } from '../../utils/fingerprint.util';
import { TDR_PROCESSING_VERSIONS } from '../../config/processing-version.config';
import { StorageService } from '../storage/storage.service';
import { MappingResolverService } from '../mapping/mapping-resolver.service';
import { computeFileHash } from '../utils/file-hash.util';
import { getCsvSchemaFingerprint } from '../parsers/csv.parser';
import { getXlsxSchemaFingerprint } from '../parsers/xlsx.parser';
import { INGESTION_ERROR } from '../constants/ingestion-error.codes';
import { UploadBatchDto } from './upload.dto';

export interface UploadResult {
  sourceFileId: string;
  batchId: string;
  jobId: string;
  status: 'QUEUED';
}

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly storage: StorageService,
    private readonly mappingResolver: MappingResolverService,
  ) {}

  async handleUpload(
    file: Express.Multer.File,
    dto: UploadBatchDto,
    user: AuthenticatedUser,
  ): Promise<UploadResult> {
    const tempPath = file.path;
    let permanentKey: string | null = null;

    try {
      // Direction RBAC check (before any disk I/O beyond what multer already did)
      this.checkDirectionAuthorization(user.roles, dto.tradeDirection);

      // Compute SHA-256 content hash
      const contentHash = await computeFileHash(tempPath);

      // Source duplicate check: same file already uploaded to this tenant
      const existing = await this.prisma.tdrSourceFile.findUnique({
        where: { tenantId_contentHash: { tenantId: user.tenantId, contentHash } },
        select: { id: true },
      });
      if (existing) {
        throw Object.assign(
          new ConflictException(
            `File already uploaded (sourceFileId: ${existing.id}). Use replay to reprocess.`,
          ),
          { code: INGESTION_ERROR.DUPLICATE_SOURCE },
        );
      }

      // Resolve mapping profile
      const mapping = await this.mappingResolver.resolveMapping(
        user.tenantId,
        dto.mappingProfileId,
        dto.tradeDirection,
      );

      // Compute processing fingerprint
      const mappingVersion = String(mapping.version);
      const fingerprintHash = computeFingerprintHash({
        tenantId: user.tenantId,
        contentHash,
        mappingVersion,
        parserVersion: TDR_PROCESSING_VERSIONS.parser,
        normalizationVersion: TDR_PROCESSING_VERSIONS.normalization,
        validationVersion: TDR_PROCESSING_VERSIONS.validation,
      });

      // Processing fingerprint duplicate check
      const dupBatch = await this.prisma.tdrBatch.findFirst({
        where: { tenantId: user.tenantId, processingFingerprintHash: fingerprintHash },
        select: { id: true },
      });
      if (dupBatch) {
        throw Object.assign(
          new ConflictException(
            `Identical processing fingerprint already exists (batchId: ${dupBatch.id}). Use replay to force reprocessing.`,
          ),
          { code: INGESTION_ERROR.DUPLICATE_PROCESSING_FINGERPRINT },
        );
      }

      // Get schema fingerprint (headers) for recording in batch
      const ext = path.extname(file.originalname).toLowerCase();
      const { fingerprint: schemaFingerprint } =
        ext === '.xlsx'
          ? await getXlsxSchemaFingerprint(tempPath)
          : await getCsvSchemaFingerprint(tempPath);

      // Schema fingerprint mismatch check (if mapping specifies expected fingerprint)
      if (
        mapping.sourceSchemaFingerprint &&
        mapping.sourceSchemaFingerprint !== schemaFingerprint
      ) {
        throw Object.assign(
          new ConflictException(
            `File headers do not match mapping "${dto.mappingProfileId}" expected schema`,
          ),
          { code: INGESTION_ERROR.SCHEMA_FINGERPRINT_MISMATCH },
        );
      }

      // Pre-generate IDs so storage key is determined before DB insert
      const sourceFileId = randomUUID();
      const storageKey = this.storage.generateKey(user.tenantId, sourceFileId);

      // Move temp → permanent storage
      await this.storage.persist(tempPath, storageKey);
      permanentKey = storageKey;

      // Create TdrSourceFile + TdrBatch + TdrProcessingJob in a single transaction
      const { batchId, jobId } = await this.createBatchPipeline({
        user,
        dto,
        file,
        contentHash,
        sourceFileId,
        storageKey,
        mappingId: mapping.id,
        mappingVersion,
        fingerprintHash,
        schemaFingerprint,
      });

      await this.audit.recordEvent({
        action: 'tdr.batch.created',
        actorUserId: user.userId,
        tenantId: user.tenantId,
        entityType: 'TdrBatch',
        entityId: batchId,
        metadata: { batchId, sourceFileId, mappingProfileId: dto.mappingProfileId },
      });

      this.logger.log(
        `Upload accepted: tenantId=${user.tenantId} sourceFileId=${sourceFileId} batchId=${batchId}`,
      );

      return { sourceFileId, batchId, jobId, status: 'QUEUED' };
    } catch (err) {
      // Compensate: if permanent file was created but DB failed, remove it
      if (permanentKey) {
        await this.storage.removeSafe(permanentKey);
      } else {
        // Temp file not yet moved — clean it up
        await this.storage.removeTempSafe(tempPath);
      }
      throw err;
    }
  }

  private checkDirectionAuthorization(roles: string[], direction: string): void {
    const canImport = roles.some((r) =>
      [Role.SUPER_ADMIN, Role.TENANT_ADMIN, Role.IMPORT_MANAGER].includes(r as never),
    );
    const canExport = roles.some((r) =>
      [Role.SUPER_ADMIN, Role.TENANT_ADMIN, Role.EXPORT_MANAGER].includes(r as never),
    );

    if (direction === 'IMPORT' && !canImport) {
      throw Object.assign(
        new ForbiddenException('Not authorized to upload IMPORT batches'),
        { code: INGESTION_ERROR.DIRECTION_FORBIDDEN },
      );
    }
    if (direction === 'EXPORT' && !canExport) {
      throw Object.assign(
        new ForbiddenException('Not authorized to upload EXPORT batches'),
        { code: INGESTION_ERROR.DIRECTION_FORBIDDEN },
      );
    }
  }

  private async createBatchPipeline(params: {
    user: AuthenticatedUser;
    dto: UploadBatchDto;
    file: Express.Multer.File;
    contentHash: string;
    sourceFileId: string;
    storageKey: string;
    mappingId: string;
    mappingVersion: string;
    fingerprintHash: string;
    schemaFingerprint: string;
  }): Promise<{ batchId: string; jobId: string }> {
    const { user, dto, file, contentHash, sourceFileId, storageKey, mappingId, mappingVersion, fingerprintHash } =
      params;

    return this.prisma.$transaction(async (tx) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const mimeType = ext === '.xlsx'
        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        : 'text/csv';

      await tx.tdrSourceFile.create({
        data: {
          id: sourceFileId,
          tenantId: user.tenantId,
          originalFilename: path.basename(file.originalname),
          mimeType,
          fileSizeBytes: BigInt(file.size),
          storageKey,
          contentHash,
          tradeDirection: dto.tradeDirection,
          uploadedById: user.userId,
          uploadedAt: new Date(),
        },
      });

      const batch = await tx.tdrBatch.create({
        data: {
          tenantId: user.tenantId,
          sourceFileId,
          mappingId,
          status: 'QUEUED',
          tradeDirection: dto.tradeDirection,
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

      return { batchId: batch.id, jobId: job.id };
    });
  }
}
