import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Prisma, TdrQualityJob } from '@prisma/client';
import * as path from 'path';
import { PrismaService } from '../../../prisma/prisma.service';
import { AuditService } from '../../../audit/audit.service';
import { StorageService } from '../../ingestion/storage/storage.service';
import { streamCsvRows, readCsvHeaders } from '../../ingestion/parsers/csv.parser';
import { streamXlsxRows, readXlsxHeaders } from '../../ingestion/parsers/xlsx.parser';
import { MappingConfigV1 } from '../types/mapping-config.types';
import { normalizeRowV1, NormalizationResult } from '../normalization/normalizer.service';
import { validateRowV1, ValidationIssueInput } from '../validation/validator.service';
import { determineBatchStatus, determineDisposition } from '../decision/quality-decision.service';
import { TdrQualityOrchestratorService } from '../orchestrator/tdr-quality-orchestrator.service';
import {
  QUALITY_CHUNK_SIZE,
  QUALITY_HEARTBEAT_INTERVAL_MS,
  QUALITY_POLL_INTERVAL_MS,
  QUALITY_RECLAIM_INTERVAL_MS,
  SUPPORTED_NORMALIZATION_VERSION,
  SUPPORTED_VALIDATION_VERSION,
} from '../constants/quality.limits';
import { QUALITY_ERROR } from '../constants/quality-error.codes';

interface QualityChunkResult {
  recordId: string;
  normalized: NormalizationResult;
  issues: ValidationIssueInput[];
  rowDisposition: string;
  exportEligible: boolean;
  quarantineReviewRequired: boolean;
}

@Injectable()
export class TdrQualityHandlerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TdrQualityHandlerService.name);
  private readonly workerInstanceId: string;
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private reclaimTimer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly storage: StorageService,
    private readonly orchestrator: TdrQualityOrchestratorService,
  ) {
    this.workerInstanceId = `qworker-${process.pid}-${Date.now()}`;
  }

  onModuleInit(): void {
    // Reconcile any QUALITY_PENDING batches that lack a quality job
    void this.orchestrator.reconcileQualityJobs();
    this.pollTimer = setInterval(() => void this.poll(), QUALITY_POLL_INTERVAL_MS);
    this.reclaimTimer = setInterval(
      () => void this.orchestrator.reclaimExpiredLeases(),
      QUALITY_RECLAIM_INTERVAL_MS,
    );
    this.logger.log(`TdrQualityHandlerService polling started (worker: ${this.workerInstanceId})`);
  }

  onModuleDestroy(): void {
    if (this.pollTimer) { clearInterval(this.pollTimer); this.pollTimer = null; }
    if (this.reclaimTimer) { clearInterval(this.reclaimTimer); this.reclaimTimer = null; }
  }

  private async poll(): Promise<void> {
    try {
      const job = await this.orchestrator.leaseNextJob(this.workerInstanceId);
      if (!job) return;
      try {
        await this.handle(job);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        const code = (err as Record<string, unknown>)['code'] as string | undefined;
        this.logger.error(`Quality job ${job.id} failed: ${message}`);
        if (job.attemptCount < job.maxAttempts) {
          await this.orchestrator.retryJob(job.id, this.workerInstanceId, message, code);
        } else {
          await this.orchestrator.failJob(job.id, message, code);
        }
      }
    } catch (err) {
      this.logger.error('Quality poll cycle error', err instanceof Error ? err.stack : String(err));
    }
  }

  private async handle(job: TdrQualityJob): Promise<void> {
    const batch = await this.prisma.tdrBatch.findUnique({
      where: { id: job.batchId },
      include: {
        sourceFile: { select: { storageKey: true, originalFilename: true } },
      },
    });

    if (!batch) {
      await this.orchestrator.failJob(job.id, 'Batch not found', QUALITY_ERROR.BATCH_NOT_FOUND);
      return;
    }

    // Version dispatch
    if (batch.normalizationVersion !== SUPPORTED_NORMALIZATION_VERSION) {
      await this.orchestrator.failJob(
        job.id,
        `Unsupported normalizationVersion: ${batch.normalizationVersion}`,
        QUALITY_ERROR.UNSUPPORTED_NORMALIZATION_VERSION,
      );
      return;
    }
    if (batch.validationVersion !== SUPPORTED_VALIDATION_VERSION) {
      await this.orchestrator.failJob(
        job.id,
        `Unsupported validationVersion: ${batch.validationVersion}`,
        QUALITY_ERROR.UNSUPPORTED_VALIDATION_VERSION,
      );
      return;
    }

    // Resolve exact locked mapping
    if (!batch.mappingId) {
      await this.orchestrator.failJob(
        job.id,
        'Batch has no mappingId — cannot resolve mapping for quality processing',
        QUALITY_ERROR.MAPPING_IDENTITY_UNRESOLVABLE,
      );
      return;
    }

    const mapping = await this.prisma.tdrSchemaMapping.findUnique({ where: { id: batch.mappingId } });
    if (!mapping) {
      await this.orchestrator.failJob(
        job.id,
        `Mapping ${batch.mappingId} not found`,
        QUALITY_ERROR.MAPPING_NOT_FOUND,
      );
      return;
    }

    const config = mapping.mappingConfig as unknown as MappingConfigV1;

    const heartbeatTimer = setInterval(
      () => void this.orchestrator.heartbeat(job.id, this.workerInstanceId),
      QUALITY_HEARTBEAT_INTERVAL_MS,
    );

    try {
      await this.processFile(job, batch, config);
    } finally {
      clearInterval(heartbeatTimer);
    }
  }

  private async processFile(
    job: TdrQualityJob,
    batch: Awaited<ReturnType<typeof this.prisma.tdrBatch.findUnique>> & {
      sourceFile: { storageKey: string; originalFilename: string };
    },
    config: MappingConfigV1,
  ): Promise<void> {
    const filePath = this.storage.getFilePath(batch!.sourceFile.storageKey);
    const ext = path.extname(batch!.sourceFile.originalFilename).toLowerCase();
    const isXlsx = ext === '.xlsx';

    // Load headers from the stored file (must match what was parsed at ingestion)
    const headers = isXlsx
      ? await readXlsxHeaders(filePath)
      : await readCsvHeaders(filePath);

    // QUALITY-MEMORY-001 fix: sliding window — never load all pending IDs into memory.
    // Query pending IDs per source-row window (QUALITY_CHUNK_SIZE rows at a time).
    const totalPending = await this.prisma.tdrRecord.count({
      where: { batchId: batch!.id, tenantId: batch!.tenantId, rowDisposition: 'PENDING_QUALITY' },
    });

    if (totalPending === 0) {
      await this.finishQualityJob(job, batch!.id, batch!.tenantId);
      return;
    }

    const rowGenerator = isXlsx
      ? streamXlsxRows(filePath, headers)
      : streamCsvRows(filePath, headers);

    const qualityResults: QualityChunkResult[] = [];
    let srcWindow: Array<{ rowNumber: number; row: Record<string, string> }> = [];

    const flushWindow = async () => {
      if (srcWindow.length === 0) return;
      const rowNumbers = srcWindow.map((r) => r.rowNumber);
      const dbRows = await this.prisma.tdrRecord.findMany({
        where: {
          batchId: batch!.id,
          tenantId: batch!.tenantId,
          rowDisposition: 'PENDING_QUALITY',
          sourceRowNumber: { in: rowNumbers },
        },
        select: { id: true, sourceRowNumber: true },
      });
      const windowMap = new Map<number, string>(dbRows.map((r) => [r.sourceRowNumber, r.id]));

      for (const { rowNumber, row } of srcWindow) {
        const recordId = windowMap.get(rowNumber);
        if (!recordId) continue;
        const normalized = normalizeRowV1(row, config);
        const issues = validateRowV1(normalized, config);
        const decision = determineDisposition(issues);
        qualityResults.push({
          recordId,
          normalized,
          issues,
          rowDisposition: decision.rowDisposition,
          exportEligible: decision.exportEligible,
          quarantineReviewRequired: decision.quarantineReviewRequired,
        });
      }
      srcWindow = [];
    };

    for await (const parsed of rowGenerator) {
      srcWindow.push({ rowNumber: parsed.rowNumber, row: parsed.row });

      if (srcWindow.length >= QUALITY_CHUNK_SIZE) {
        await flushWindow();

        if (qualityResults.length >= QUALITY_CHUNK_SIZE) {
          const owned = await this.orchestrator.isLeaseOwned(job.id, this.workerInstanceId);
          if (!owned) {
            this.logger.warn(`Quality job ${job.id}: lease lost — aborting`);
            return;
          }
          await this.persistQualityChunk(qualityResults, batch!.id, batch!.tenantId);
          qualityResults.length = 0;
        }
      }
    }

    await flushWindow();

    if (qualityResults.length > 0) {
      const owned = await this.orchestrator.isLeaseOwned(job.id, this.workerInstanceId);
      if (!owned) {
        this.logger.warn(`Quality job ${job.id}: lease lost before final chunk — aborting`);
        return;
      }
      await this.persistQualityChunk(qualityResults, batch!.id, batch!.tenantId);
    }

    await this.finishQualityJob(job, batch!.id, batch!.tenantId);
  }

  private async persistQualityChunk(
    chunk: QualityChunkResult[],
    batchId: string,
    tenantId: string,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      // Set-based bulk UPDATE using Prisma.sql VALUES
      const rows = chunk.map((r) =>
        Prisma.sql`(
          ${r.recordId}::text,
          ${r.normalized.tradeDateRaw ?? null}::text,
          ${r.normalized.tradeDate ? r.normalized.tradeDate.toISOString().split('T')[0] : null}::date,
          ${r.normalized.hsCodeRaw ?? null}::text,
          ${r.normalized.hsCodeNormalized ?? null}::text,
          ${r.normalized.hsChapter ?? null}::bpchar,
          ${r.normalized.productDescriptionRaw ?? null}::text,
          ${r.normalized.productDescriptionNormalized ?? null}::text,
          ${r.normalized.localPartyTaxIdRaw ?? null}::text,
          ${r.normalized.localPartyTaxIdNormalized ?? null}::text,
          ${r.normalized.localPartyNameRaw ?? null}::text,
          ${r.normalized.localPartyNameNormalized ?? null}::text,
          ${r.normalized.localPartyAddressRaw ?? null}::text,
          ${r.normalized.localPartyCountryCode ?? null}::bpchar,
          ${r.normalized.foreignPartyNameRaw ?? null}::text,
          ${r.normalized.foreignPartyNameNormalized ?? null}::text,
          ${r.normalized.foreignPartyAddressRaw ?? null}::text,
          ${r.normalized.foreignPartyCountryRaw ?? null}::text,
          ${r.normalized.foreignPartyCountryCode ?? null}::bpchar,
          ${r.normalized.originPortRaw ?? null}::text,
          ${r.normalized.originPortNormalized ?? null}::text,
          ${r.normalized.quantityRaw ?? null}::text,
          ${r.normalized.quantityNormalized !== null ? r.normalized.quantityNormalized.toString() : null}::numeric,
          ${r.normalized.quantityUnitRaw ?? null}::text,
          ${r.normalized.quantityUnitCode ?? null}::text,
          ${r.normalized.unitPriceRaw ?? null}::text,
          ${r.normalized.unitPriceNormalized !== null ? r.normalized.unitPriceNormalized.toString() : null}::numeric,
          ${r.normalized.currencyRaw ?? null}::text,
          ${r.normalized.currencyCode ?? null}::bpchar,
          ${r.rowDisposition}::"RowDisposition",
          ${r.exportEligible}::boolean,
          ${r.quarantineReviewRequired}::boolean,
          ${JSON.stringify(r.normalized.valueTreatmentMeta)}::jsonb
        )`,
      );

      await tx.$executeRaw`
        UPDATE tdr_records AS rec
        SET
          hs_code_raw = v.hs_code_raw,
          hs_code_normalized = v.hs_code_normalized,
          hs_chapter = v.hs_chapter,
          product_description_raw = v.product_description_raw,
          product_description_normalized = v.product_description_normalized,
          local_party_tax_id_raw = v.local_party_tax_id_raw,
          local_party_tax_id_normalized = v.local_party_tax_id_normalized,
          local_party_name_raw = v.local_party_name_raw,
          local_party_name_normalized = v.local_party_name_normalized,
          local_party_address_raw = v.local_party_address_raw,
          local_party_country_code = v.local_party_country_code,
          foreign_party_name_raw = v.foreign_party_name_raw,
          foreign_party_name_normalized = v.foreign_party_name_normalized,
          foreign_party_address_raw = v.foreign_party_address_raw,
          foreign_party_country_raw = v.foreign_party_country_raw,
          foreign_party_country_code = v.foreign_party_country_code,
          origin_port_raw = v.origin_port_raw,
          origin_port_normalized = v.origin_port_normalized,
          quantity_raw = v.quantity_raw,
          quantity_normalized = v.quantity_normalized,
          quantity_unit_raw = v.quantity_unit_raw,
          quantity_unit_code = v.quantity_unit_code,
          unit_price_raw = v.unit_price_raw,
          unit_price_normalized = v.unit_price_normalized,
          currency_raw = v.currency_raw,
          currency_code = v.currency_code,
          trade_date = v.trade_date,
          row_disposition = v.row_disposition,
          export_eligible = v.export_eligible,
          quarantine_review_required = v.quarantine_review_required,
          value_treatment_meta = v.value_treatment_meta,
          updated_at = NOW()
        FROM (VALUES ${Prisma.join(rows, ',')}) AS v(
          id, trade_date_raw, trade_date, hs_code_raw, hs_code_normalized, hs_chapter,
          product_description_raw, product_description_normalized,
          local_party_tax_id_raw, local_party_tax_id_normalized,
          local_party_name_raw, local_party_name_normalized, local_party_address_raw,
          local_party_country_code, foreign_party_name_raw, foreign_party_name_normalized,
          foreign_party_address_raw, foreign_party_country_raw, foreign_party_country_code,
          origin_port_raw, origin_port_normalized,
          quantity_raw, quantity_normalized, quantity_unit_raw, quantity_unit_code,
          unit_price_raw, unit_price_normalized, currency_raw, currency_code,
          row_disposition, export_eligible, quarantine_review_required, value_treatment_meta
        )
        WHERE rec.id = v.id AND rec.tenant_id = ${tenantId}::text
      `;

      // createMany validation issues
      const issues = chunk.flatMap((r) =>
        r.issues.map((issue) => ({
          recordId: r.recordId,
          batchId,
          tenantId,
          fieldName: issue.fieldName,
          ruleCode: issue.ruleCode,
          severity: issue.severity,
          message: issue.message,
          rawValue: issue.rawValue,
          status: 'OPEN' as const,
        })),
      );

      if (issues.length > 0) {
        await tx.tdrValidationIssue.createMany({ data: issues });
      }
    });
  }

  private async finishQualityJob(
    job: TdrQualityJob,
    batchId: string,
    tenantId: string,
  ): Promise<void> {
    // Verify no PENDING_QUALITY rows remain
    const remainingPending = await this.prisma.tdrRecord.count({
      where: { batchId, tenantId, rowDisposition: 'PENDING_QUALITY' },
    });
    if (remainingPending > 0) {
      this.logger.warn(`Quality job ${job.id}: ${remainingPending} rows still PENDING_QUALITY after processing — unexpected`);
    }

    // Reconcile counters from DB
    const [accepted, quarantined, rejected, total] = await Promise.all([
      this.prisma.tdrRecord.count({ where: { batchId, tenantId, rowDisposition: 'ACCEPTED' } }),
      this.prisma.tdrRecord.count({ where: { batchId, tenantId, rowDisposition: 'QUARANTINED' } }),
      this.prisma.tdrRecord.count({ where: { batchId, tenantId, rowDisposition: 'REJECTED' } }),
      this.prisma.tdrRecord.count({ where: { batchId, tenantId } }),
    ]);

    const batchStatus = determineBatchStatus(accepted, quarantined, rejected, remainingPending);

    await this.prisma.$transaction([
      this.prisma.tdrBatch.update({
        where: { id: batchId },
        data: {
          acceptedRows: accepted,
          quarantinedRows: quarantined,
          rejectedRows: rejected,
          processedRows: total,
        },
      }),
    ]);

    await this.orchestrator.completeJob(job.id, batchStatus);

    await this.audit.recordEvent({
      action: 'tdr.quality.processing_completed',
      actorUserId: '',
      tenantId,
      entityType: 'TdrBatch',
      entityId: batchId,
      metadata: { batchId, accepted, quarantined, rejected, batchStatus },
    });

    this.logger.log(
      `Quality job ${job.id} complete: batch ${batchId} → ${batchStatus} ` +
      `(accepted=${accepted} quarantined=${quarantined} rejected=${rejected})`,
    );
  }
}
