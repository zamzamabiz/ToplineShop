import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { createHash } from 'crypto';
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Prisma, TdrExportJob } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { AuditService } from '../../../audit/audit.service';
import { StorageService } from '../../ingestion/storage/storage.service';
import { TdrExportOrchestratorService } from '../orchestrator/tdr-export-orchestrator.service';
import {
  DEFAULT_EXPORT_ROW_LIMIT,
  EXPORT_CHUNK_SIZE,
  QUALITY_HEARTBEAT_INTERVAL_MS,
  QUALITY_POLL_INTERVAL_MS,
  QUALITY_RECLAIM_INTERVAL_MS,
} from '../../quality/constants/quality.limits';

/**
 * CSV formula-injection safe characters that must be prefixed with a single-quote
 * to prevent spreadsheet execution when the CSV is opened in Excel/Sheets.
 */
const FORMULA_INJECTION_CHARS = /^[=+\-@\t\r]/;

/** CSV export column headers — canonical spec §2 snake_case names. */
const EXPORT_COLUMNS = [
  'trade_date',
  'hs_chapter',
  'hs_code',
  'product_description',
  'exporter_id',
  'exporter_name',
  'exporter_address',
  'exporter_country',
  'port_of_loading',
  'importer_id',
  'importer_name',
  'importer_address',
  'importer_country',
  'port_of_discharge',
  'quantity',
  'quantity_unit',
  'unit_price',
  'currency_code',
  'data_source',
] as const;

@Injectable()
export class TdrExportHandlerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TdrExportHandlerService.name);
  private readonly workerInstanceId: string;
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private reclaimTimer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly storage: StorageService,
    private readonly orchestrator: TdrExportOrchestratorService,
  ) {
    this.workerInstanceId = `eworker-${process.pid}-${Date.now()}`;
  }

  onModuleInit(): void {
    this.pollTimer = setInterval(() => void this.poll(), QUALITY_POLL_INTERVAL_MS);
    this.reclaimTimer = setInterval(
      () => void this.orchestrator.reclaimExpiredLeases(),
      QUALITY_RECLAIM_INTERVAL_MS,
    );
    this.logger.log(`TdrExportHandlerService polling started (worker: ${this.workerInstanceId})`);
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
        this.logger.error(`Export job ${job.id} failed: ${message}`);
        // Clean up any partial temp file
        await cleanTempFile(tempKeyFor(job.id));
        await this.orchestrator.failJob(job.id, this.workerInstanceId, message, code);
      }
    } catch (err) {
      this.logger.error('Export poll cycle error', err instanceof Error ? err.stack : String(err));
    }
  }

  private async handle(job: TdrExportJob): Promise<void> {
    const filter = job.filterConfig as ExportFilter;
    const rowLimit = job.rowLimit ?? DEFAULT_EXPORT_ROW_LIMIT;

    const heartbeatTimer = setInterval(
      () => void this.orchestrator.heartbeat(job.id, this.workerInstanceId),
      QUALITY_HEARTBEAT_INTERVAL_MS,
    );

    // Write to a unique temp file
    const tmpPath = path.join(os.tmpdir(), `tdr-export-${job.id}.csv.tmp`);
    let rowCount = 0;
    const hashStream = createHash('sha256');

    try {
      const writeStream = fs.createWriteStream(tmpPath, { encoding: 'utf8' });

      // Write header row
      const headerLine = EXPORT_COLUMNS.map(csvEscape).join(',') + '\r\n';
      writeStream.write(headerLine);
      hashStream.update(headerLine);

      // Stream records in keyset-paged chunks, capped at rowLimit (sample behavior).
      // rowLimit is a cap — never a rejection threshold.
      let lastBatchId: string | null = null;
      let lastSrcRowNum: number | null = null;
      let remainingRows = rowLimit;

      while (remainingRows > 0) {
        const owned = await this.orchestrator.isLeaseOwned(job.id, this.workerInstanceId);
        if (!owned) {
          writeStream.destroy();
          this.logger.warn(`Export job ${job.id}: lease lost — aborting`);
          throw new Error('Lease lost during export generation');
        }

        const take = Math.min(EXPORT_CHUNK_SIZE, remainingRows);
        const rows = await this.fetchExportChunk(job.tenantId, filter, lastBatchId, lastSrcRowNum, take);
        if (rows.length === 0) break;

        for (const row of rows) {
          const line = EXPORT_COLUMNS.map((col) => csvEscape(formatField(row, col))).join(',') + '\r\n';
          writeStream.write(line);
          hashStream.update(line);
          rowCount++;
          remainingRows--;
        }

        lastBatchId = rows[rows.length - 1].batch_id as string;
        lastSrcRowNum = rows[rows.length - 1].source_row_number as number;
        if (rows.length < take) break;
      }

      await closeStream(writeStream);
      const contentHash = hashStream.digest('hex');

      // Persist to permanent export storage
      const storageKey = `exports/${job.tenantId}/${job.id}.csv`;
      await this.storage.persist(tmpPath, storageKey);

      await this.orchestrator.completeJob(job.id, storageKey, rowCount, contentHash);

      await this.audit.recordEvent({
        action: 'tdr.export.completed',
        actorUserId: job.requestedById,
        tenantId: job.tenantId,
        entityType: 'TdrExportJob',
        entityId: job.id,
        metadata: { jobId: job.id, rowCount, storageKey: '[REDACTED]' },
      });

      this.logger.log(`Export job ${job.id} complete: ${rowCount} rows`);
    } catch (err) {
      await cleanTempFile(tmpPath);
      throw err;
    } finally {
      clearInterval(heartbeatTimer);
    }
  }

  private async fetchExportChunk(
    tenantId: string,
    filter: ExportFilter,
    lastBatchId: string | null,
    lastSrcRowNum: number | null,
    take: number,
  ): Promise<Array<Record<string, unknown>>> {
    const conditions: Prisma.Sql[] = [
      Prisma.sql`r.tenant_id = ${tenantId}`,
      Prisma.sql`r.row_disposition = 'ACCEPTED'`,
      Prisma.sql`r.export_eligible = TRUE`,
    ];

    // Composite keyset: ORDER BY (batch_id, source_row_number) — deterministic source-row order.
    if (lastBatchId !== null && lastSrcRowNum !== null) {
      conditions.push(
        Prisma.sql`(r.batch_id > ${lastBatchId} OR (r.batch_id = ${lastBatchId} AND r.source_row_number > ${lastSrcRowNum}))`,
      );
    }

    if (filter.batchId) conditions.push(Prisma.sql`r.batch_id = ${filter.batchId}`);
    if (filter.tradeDirection) conditions.push(Prisma.sql`r.trade_direction = ${filter.tradeDirection}::"TradeDirection"`);
    if (filter.dateFrom) conditions.push(Prisma.sql`r.trade_date >= ${new Date(filter.dateFrom)}`);
    if (filter.dateTo) conditions.push(Prisma.sql`r.trade_date <= ${new Date(filter.dateTo)}`);
    if (filter.hsChapter) conditions.push(Prisma.sql`r.hs_chapter = ${filter.hsChapter}`);
    if (filter.hsCode) conditions.push(Prisma.sql`r.hs_code_normalized = ${filter.hsCode}`);
    if (filter.foreignPartyCountryCode) {
      conditions.push(Prisma.sql`(r.importer_country_code = ${filter.foreignPartyCountryCode} OR r.foreign_party_country_code = ${filter.foreignPartyCountryCode})`);
    }
    if (filter.exporterCountryCode) conditions.push(Prisma.sql`r.exporter_country_code = ${filter.exporterCountryCode}`);
    if (filter.importerCountryCode) conditions.push(Prisma.sql`r.importer_country_code = ${filter.importerCountryCode}`);

    const where = Prisma.join(conditions, ' AND ');

    // rowOffset skips N rows on the first chunk (no keyset yet) for pagination.
    const offsetSql = (lastBatchId === null && filter.rowOffset && filter.rowOffset > 0)
      ? Prisma.sql`OFFSET ${filter.rowOffset}`
      : Prisma.sql``;

    return this.prisma.$queryRaw<Array<Record<string, unknown>>>(Prisma.sql`
      SELECT
        r.id,
        r.batch_id,
        r.source_row_number,
        r.trade_date,
        r.hs_chapter,
        r.hs_code_normalized                                                    AS hs_code,
        COALESCE(r.product_description_normalized, r.product_description_raw)   AS product_description,
        r.exporter_id_raw                                                       AS exporter_id,
        COALESCE(r.exporter_name_normalized, r.local_party_name_normalized)     AS exporter_name,
        r.exporter_address_raw                                                  AS exporter_address,
        COALESCE(r.exporter_country_code, r.local_party_country_code)           AS exporter_country,
        COALESCE(r.port_of_loading_normalized, r.origin_port_normalized)        AS port_of_loading,
        r.importer_id_raw                                                       AS importer_id,
        COALESCE(r.importer_name_normalized, r.foreign_party_name_normalized)   AS importer_name,
        r.importer_address_raw                                                  AS importer_address,
        COALESCE(r.importer_country_code, r.foreign_party_country_code)         AS importer_country,
        r.port_of_discharge_normalized                                          AS port_of_discharge,
        r.quantity_normalized                                                   AS quantity,
        r.quantity_unit_code                                                    AS quantity_unit,
        r.unit_price_normalized                                                 AS unit_price,
        r.currency_code,
        COALESCE(r.data_source_normalized, r.data_source_raw)                   AS data_source
      FROM tdr_records r
      WHERE ${where}
      ORDER BY r.batch_id ASC, r.source_row_number ASC
      LIMIT ${take}
      ${offsetSql}
    `);
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

interface ExportFilter {
  batchId?: string;
  tradeDirection?: string;
  dateFrom?: string;
  dateTo?: string;
  hsChapter?: string;
  hsCode?: string;
  /** Legacy filter — matches foreign_party_country_code OR importer_country_code */
  foreignPartyCountryCode?: string;
  /** Canonical exporter country filter (exporter_country_code column) */
  exporterCountryCode?: string;
  /** Canonical importer country filter (importer_country_code column) */
  importerCountryCode?: string;
  /** Skip first N matching rows — enables page-based pagination for large batches */
  rowOffset?: number;
}


function csvEscape(value: string): string {
  if (value === null || value === undefined || value === '') return '';
  let v = String(value);

  // Formula injection protection: prefix with ' to neutralize
  if (FORMULA_INJECTION_CHARS.test(v)) v = "'" + v;

  // CSV quoting
  if (v.includes('"') || v.includes(',') || v.includes('\n') || v.includes('\r')) {
    return '"' + v.replace(/"/g, '""') + '"';
  }
  return v;
}

function formatField(row: Record<string, unknown>, col: string): string {
  const v = row[col];
  if (v === null || v === undefined) return '';
  if (v instanceof Date) return v.toISOString().split('T')[0];
  return String(v);
}

function closeStream(ws: fs.WriteStream): Promise<void> {
  return new Promise((resolve, reject) => {
    ws.end((err: Error | null | undefined) => (err ? reject(err) : resolve()));
  });
}

async function cleanTempFile(tmpPath: string): Promise<void> {
  try {
    if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
  } catch { /* best effort */ }
}

function tempKeyFor(jobId: string): string {
  return path.join(os.tmpdir(), `tdr-export-${jobId}.csv.tmp`);
}
