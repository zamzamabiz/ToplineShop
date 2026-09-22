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
import { QUALITY_ERROR } from '../../quality/constants/quality-error.codes';

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

    // Pre-count rows to enforce limit
    const estimatedCount = await this.countExportRows(job.tenantId, filter);
    if (estimatedCount > rowLimit) {
      await this.orchestrator.failJob(
        job.id,
        this.workerInstanceId,
        `Export would return ${estimatedCount} rows, exceeding limit of ${rowLimit}`,
        QUALITY_ERROR.EXPORT_LIMIT_EXCEEDED,
      );
      return;
    }

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

      // Stream records in keyset-paged chunks
      let lastId: string | null = null;

      while (true) {
        const owned = await this.orchestrator.isLeaseOwned(job.id, this.workerInstanceId);
        if (!owned) {
          writeStream.destroy();
          this.logger.warn(`Export job ${job.id}: lease lost — aborting`);
          throw new Error('Lease lost during export generation');
        }

        const rows = await this.fetchExportChunk(job.tenantId, filter, lastId, EXPORT_CHUNK_SIZE);
        if (rows.length === 0) break;

        for (const row of rows) {
          const line = EXPORT_COLUMNS.map((col) => csvEscape(formatField(row, col))).join(',') + '\r\n';
          writeStream.write(line);
          hashStream.update(line);
          rowCount++;
        }

        lastId = rows[rows.length - 1].id as string;
        if (rows.length < EXPORT_CHUNK_SIZE) break;
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

  private async countExportRows(tenantId: string, filter: ExportFilter): Promise<number> {
    const conditions: Prisma.Sql[] = [
      Prisma.sql`tenant_id = ${tenantId}`,
      Prisma.sql`row_disposition = 'ACCEPTED'`,
      Prisma.sql`export_eligible = TRUE`,
    ];
    if (filter.batchId) conditions.push(Prisma.sql`batch_id = ${filter.batchId}`);
    if (filter.tradeDirection) conditions.push(Prisma.sql`trade_direction = ${filter.tradeDirection}`);
    if (filter.dateFrom) conditions.push(Prisma.sql`trade_date >= ${new Date(filter.dateFrom)}`);
    if (filter.dateTo) conditions.push(Prisma.sql`trade_date <= ${new Date(filter.dateTo)}`);
    if (filter.hsChapter) conditions.push(Prisma.sql`hs_chapter = ${filter.hsChapter}`);
    if (filter.hsCode) conditions.push(Prisma.sql`hs_code_normalized = ${filter.hsCode}`);
    if (filter.foreignPartyCountryCode) {
      conditions.push(Prisma.sql`(importer_country_code = ${filter.foreignPartyCountryCode} OR foreign_party_country_code = ${filter.foreignPartyCountryCode})`);
    }
    if (filter.exporterCountryCode) conditions.push(Prisma.sql`exporter_country_code = ${filter.exporterCountryCode}`);
    if (filter.importerCountryCode) conditions.push(Prisma.sql`importer_country_code = ${filter.importerCountryCode}`);

    const where = Prisma.join(conditions, ' AND ');
    const result = await this.prisma.$queryRaw<[{ count: bigint }]>(
      Prisma.sql`SELECT COUNT(*)::bigint AS count FROM tdr_records WHERE ${where}`,
    );
    return Number(result[0].count);
  }

  private async fetchExportChunk(
    tenantId: string,
    filter: ExportFilter,
    lastId: string | null,
    take: number,
  ): Promise<Array<Record<string, unknown>>> {
    const conditions: Prisma.Sql[] = [
      Prisma.sql`r.tenant_id = ${tenantId}`,
      Prisma.sql`r.row_disposition = 'ACCEPTED'`,
      Prisma.sql`r.export_eligible = TRUE`,
    ];

    if (lastId) conditions.push(Prisma.sql`r.id > ${lastId}`);
    if (filter.batchId) conditions.push(Prisma.sql`r.batch_id = ${filter.batchId}`);
    if (filter.tradeDirection) conditions.push(Prisma.sql`r.trade_direction = ${filter.tradeDirection}`);
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

    return this.prisma.$queryRaw<Array<Record<string, unknown>>>(Prisma.sql`
      SELECT
        r.id,
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
        r.data_source_raw                                                       AS data_source
      FROM tdr_records r
      WHERE ${where}
      ORDER BY r.id ASC
      LIMIT ${take}
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
