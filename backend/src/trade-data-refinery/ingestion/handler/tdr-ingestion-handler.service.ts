import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { TdrProcessingJob } from '@prisma/client';
import * as path from 'path';
import { PrismaService } from '../../../prisma/prisma.service';
import { AuditService } from '../../../audit/audit.service';
import { TdrJobHandler } from '../../types/tdr-job-handler.interface';
import { TdrJobOrchestratorService } from '../../services/tdr-job-orchestrator.service';
import { TdrProcessorService } from '../../services/tdr-processor.service';
import { TdrQualityOrchestratorService } from '../../quality/orchestrator/tdr-quality-orchestrator.service';
import { StorageService } from '../storage/storage.service';
import { streamCsvRows, validateHeaders } from '../parsers/csv.parser';
import { streamXlsxRows, getXlsxSchemaFingerprint } from '../parsers/xlsx.parser';
import { getCsvSchemaFingerprint } from '../parsers/csv.parser';
import { streamTsvRows, getTsvSchemaFingerprint } from '../parsers/tsv.parser';
import { streamJsonRows, streamNdjsonRows, getJsonSchemaFingerprint, getNdjsonSchemaFingerprint } from '../parsers/json.parser';
import { computeRowHash } from '../utils/row-hash.util';
import { CHUNK_SIZE, HEARTBEAT_INTERVAL_MS } from '../constants/ingestion.limits';
import { INGESTION_ERROR } from '../constants/ingestion-error.codes';
import { ParsedRow } from '../parsers/parser.types';

@Injectable()
export class TdrIngestionHandlerService implements TdrJobHandler, OnModuleInit {
  private readonly logger = new Logger(TdrIngestionHandlerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly orchestrator: TdrJobOrchestratorService,
    private readonly processor: TdrProcessorService,
    private readonly storage: StorageService,
    private readonly qualityOrchestrator: TdrQualityOrchestratorService,
  ) {}

  onModuleInit(): void {
    this.processor.registerHandler(this);
    this.processor.startPolling();
    this.logger.log('TdrIngestionHandlerService registered and polling started');
  }

  async handle(job: TdrProcessingJob): Promise<void> {
    const workerInstanceId = (job as TdrProcessingJob & { workerInstanceId: string })
      .workerInstanceId;

    // Load batch + source file
    const batch = await this.prisma.tdrBatch.findUnique({
      where: { id: job.batchId },
      include: {
        sourceFile: {
          select: { storageKey: true, originalFilename: true, tradeDirection: true },
        },
      },
    });

    if (!batch) {
      await this.orchestrator.failJob(job.id, 'Batch not found', INGESTION_ERROR.BATCH_NOT_FOUND);
      return;
    }

    if (batch.status === 'CANCELLED') {
      await this.orchestrator.releaseLease(job.id);
      this.logger.warn(`Job ${job.id}: batch ${batch.id} is CANCELLED — releasing lease`);
      return;
    }

    // Transition batch: QUEUED → PROCESSING
    await this.prisma.tdrBatch.update({
      where: { id: batch.id },
      data: { status: 'PROCESSING', startedAt: batch.startedAt ?? new Date() },
    });

    // Start heartbeat
    const heartbeatTimer = setInterval(() => {
      void this.orchestrator.heartbeat(job.id, workerInstanceId);
    }, HEARTBEAT_INTERVAL_MS);

    try {
      await this.processFile(job, workerInstanceId, batch);
    } finally {
      clearInterval(heartbeatTimer);
    }
  }

  private async processFile(
    job: TdrProcessingJob,
    workerInstanceId: string,
    batch: Awaited<ReturnType<typeof this.prisma.tdrBatch.findUnique>> & {
      sourceFile: { storageKey: string; originalFilename: string; tradeDirection: string };
    },
  ): Promise<void> {
    const filePath = this.storage.getFilePath(batch!.sourceFile.storageKey);
    const ext = path.extname(batch!.sourceFile.originalFilename).toLowerCase();

    try {
      // Get headers and schema fingerprint — dispatch by extension
      const { headers, fingerprint: schemaFingerprint } = await this.getSchemaFingerprint(filePath, ext);

      validateHeaders(headers);

      // Verify schema fingerprint if mapping specifies it
      const mapping = batch!.mappingId
        ? await this.prisma.tdrSchemaMapping.findUnique({
            where: { id: batch!.mappingId },
            select: { sourceSchemaFingerprint: true, mappingConfig: true },
          })
        : null;

      if (mapping?.sourceSchemaFingerprint && mapping.sourceSchemaFingerprint !== schemaFingerprint) {
        throw Object.assign(
          new Error(`Schema fingerprint mismatch: expected ${mapping.sourceSchemaFingerprint}, got ${schemaFingerprint}`),
          { code: INGESTION_ERROR.SCHEMA_FINGERPRINT_MISMATCH },
        );
      }

      // Determine resume point from checkpoint
      const resumeFromRow = job.lastCheckpointRow ?? 0;

      // Validate required headers from mapping config (source-column presence check)
      if (mapping) {
        const config = mapping.mappingConfig as { columnMappings?: Array<{ sourceColumnName: string; requiredPolicy?: string }> };
        const headerSet = new Set(headers);
        const missingRequired = (config.columnMappings ?? [])
          .filter((cm) => cm.requiredPolicy === 'REQUIRED' && !headerSet.has(cm.sourceColumnName))
          .map((cm) => cm.sourceColumnName);
        if (missingRequired.length > 0) {
          throw Object.assign(
            new Error(`File is missing required header column(s): ${missingRequired.join(', ')}`),
            { code: INGESTION_ERROR.MISSING_REQUIRED_HEADER },
          );
        }
      }

      const rowGenerator: AsyncGenerator<ParsedRow> = this.getRowGenerator(filePath, ext, headers);

      let chunk: ParsedRow[] = [];
      let totalProcessed = 0;
      let totalRows = 0;

      for await (const parsed of rowGenerator) {
        totalRows++;

        // Skip rows already committed in a previous attempt
        if (parsed.rowNumber <= resumeFromRow) continue;

        chunk.push(parsed);

        if (chunk.length >= CHUNK_SIZE) {
          // Check lease before committing chunk
          const owned = await this.orchestrator.isLeaseOwned(job.id, workerInstanceId);
          if (!owned) {
            this.logger.warn(`Job ${job.id}: lease lost at row ${parsed.rowNumber} — aborting`);
            return;
          }

          await this.persistChunk(job, batch!, chunk, schemaFingerprint);
          totalProcessed += chunk.length;

          // Checkpoint after each committed chunk
          await this.orchestrator.checkpoint(job.id, workerInstanceId, parsed.rowNumber);

          chunk = [];
        }
      }

      // Persist final partial chunk
      if (chunk.length > 0) {
        const owned = await this.orchestrator.isLeaseOwned(job.id, workerInstanceId);
        if (!owned) {
          this.logger.warn(`Job ${job.id}: lease lost before final chunk — aborting`);
          return;
        }
        await this.persistChunk(job, batch!, chunk, schemaFingerprint);
        totalProcessed += chunk.length;
        await this.orchestrator.checkpoint(
          job.id,
          workerInstanceId,
          chunk[chunk.length - 1].rowNumber,
        );
      }

      // Update batch totals
      await this.prisma.tdrBatch.update({
        where: { id: batch!.id },
        data: { totalSourceRows: totalRows, processedRows: totalProcessed },
      });

      // Complete job → batch QUALITY_PENDING
      await this.orchestrator.completeJobWithStatus(job.id, 'QUALITY_PENDING');

      // Ensure a quality job exists so the quality worker can pick it up immediately.
      // ensureQualityJob is idempotent (UNIQUE(batchId) guard). If it fails here, the
      // batch is already at QUALITY_PENDING and reconcileQualityJobs() will recover it
      // on the next backend startup — so we log and continue rather than revert.
      try {
        await this.qualityOrchestrator.ensureQualityJob(batch!.id, batch!.tenantId);
      } catch (qErr) {
        this.logger.error(
          `ensureQualityJob failed for batch ${batch!.id} — will be recovered by reconciliation at next startup. ` +
          `Error: ${qErr instanceof Error ? qErr.message : String(qErr)}`,
        );
      }

      await this.audit.recordEvent({
        action: 'tdr.batch.ingestion_complete',
        actorUserId: '',
        tenantId: batch!.tenantId,
        entityType: 'TdrBatch',
        entityId: batch!.id,
        metadata: { batchId: batch!.id, totalRows, totalProcessed },
      });

      this.logger.log(
        `Job ${job.id} complete: batch ${batch!.id} ingested ${totalProcessed}/${totalRows} rows → QUALITY_PENDING`,
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const code = (err as Record<string, unknown>)['code'] as string | undefined;

      await this.prisma.tdrBatch.update({
        where: { id: batch!.id },
        data: { status: 'FAILED' },
      }).catch(() => {});

      // Retry if under maxAttempts, otherwise fail permanently
      if (job.attemptCount < job.maxAttempts) {
        await this.orchestrator.retryJob(job.id, workerInstanceId, message, code);
      } else {
        await this.orchestrator.failJob(job.id, message, code);
      }
    }
  }

  private async getSchemaFingerprint(
    filePath: string,
    ext: string,
  ): Promise<{ headers: string[]; fingerprint: string }> {
    switch (ext) {
      case '.xlsx': return getXlsxSchemaFingerprint(filePath);
      case '.tsv':  return getTsvSchemaFingerprint(filePath);
      case '.json': return getJsonSchemaFingerprint(filePath);
      case '.jsonl': return getNdjsonSchemaFingerprint(filePath);
      default:      return getCsvSchemaFingerprint(filePath);
    }
  }

  private getRowGenerator(filePath: string, ext: string, headers: string[]): AsyncGenerator<ParsedRow> {
    switch (ext) {
      case '.xlsx':  return streamXlsxRows(filePath, headers);
      case '.tsv':   return streamTsvRows(filePath, headers);
      case '.json':  return streamJsonRows(filePath);
      case '.jsonl': return streamNdjsonRows(filePath);
      default:       return streamCsvRows(filePath, headers);
    }
  }

  private async persistChunk(
    job: TdrProcessingJob,
    batch: { id: string; tenantId: string; sourceFileId: string; tradeDirection: string; mappingVersion: string; parserVersion: string; normalizationVersion: string; validationVersion: string; storeSourceRows: boolean },
    chunk: ParsedRow[],
    schemaSignature: string,
  ): Promise<void> {
    const records = chunk.map((parsed) => ({
      tenantId: batch.tenantId,
      sourceFileId: batch.sourceFileId,
      batchId: batch.id,
      sourceRowNumber: parsed.rowNumber,
      rowHash: computeRowHash(parsed.row),
      tradeDirection: batch.tradeDirection as never,
      sourceSchemaSignature: schemaSignature,
      mappingVersion: batch.mappingVersion,
      parserVersion: batch.parserVersion,
      normalizationVersion: batch.normalizationVersion,
      validationVersion: batch.validationVersion,
      rowDisposition: 'PENDING_QUALITY' as never,
      exportEligible: false,
    }));

    await this.prisma.$transaction(async (tx) => {
      await tx.tdrRecord.createMany({ data: records, skipDuplicates: true });

      if (batch.storeSourceRows) {
        const sourceRows = chunk.map((parsed) => ({
          batchId: batch.id,
          tenantId: batch.tenantId,
          sourceRowNumber: parsed.rowNumber,
          rawContent: parsed.row,
          rowHash: computeRowHash(parsed.row),
        }));
        await tx.tdrSourceRow.createMany({ data: sourceRows, skipDuplicates: true });
      }
    });
  }
}
