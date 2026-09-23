import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma, TradeDirection } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { success } from '../../common/api-response';
import {
  AnalyticsFilterDto,
  BreakdownDimension,
  TrendGranularity,
} from './dto/analytics-filter.dto';

// Maps to Prisma model field names — never exposed to clients as strings.
const BREAKDOWN_FIELD_MAP: Record<BreakdownDimension, string> = {
  [BreakdownDimension.TRADE_DIRECTION]: 'tradeDirection',
  [BreakdownDimension.HS_CHAPTER]: 'hsChapter',
  [BreakdownDimension.FOREIGN_COUNTRY]: 'foreignPartyCountryCode',
  [BreakdownDimension.CURRENCY_CODE]: 'currencyCode',
  [BreakdownDimension.QUANTITY_UNIT]: 'quantityUnitCode',
};

// §74 — canonical direction-aware counterparty country SQL expression.
// EXPORT records: the importer is the foreign party → importer_country_code.
// IMPORT records: the exporter is the foreign party → exporter_country_code.
// Falls back to foreign_party_country_code for legacy-mapped records (62 rows).
// Used in: BREAKDOWN_COLUMN_MAP, buildRawConditions, getFilterOptions.
const DIRECTION_AWARE_COUNTRY_SQL =
  `CASE WHEN trade_direction = 'EXPORT'` +
  ` THEN COALESCE(importer_country_code, foreign_party_country_code)` +
  ` WHEN trade_direction = 'IMPORT'` +
  ` THEN COALESCE(exporter_country_code, foreign_party_country_code)` +
  ` ELSE foreign_party_country_code END`;

// Maps to database column names for $queryRaw — never from client input.
const BREAKDOWN_COLUMN_MAP: Record<BreakdownDimension, string> = {
  [BreakdownDimension.TRADE_DIRECTION]: 'trade_direction',
  [BreakdownDimension.HS_CHAPTER]: 'hs_chapter',
  [BreakdownDimension.FOREIGN_COUNTRY]: DIRECTION_AWARE_COUNTRY_SQL,
  [BreakdownDimension.CURRENCY_CODE]: 'currency_code',
  [BreakdownDimension.QUANTITY_UNIT]: 'quantity_unit_code',
};

const TREND_PG_GRANULARITY: Record<TrendGranularity, string> = {
  [TrendGranularity.DAY]: 'day',
  [TrendGranularity.MONTH]: 'month',
  [TrendGranularity.YEAR]: 'year',
};

// §15 — aggregate point budget.
const AGGREGATE_POINT_BUDGET = 5_000;
// §14 — top-N max.
const TOP_N_MAX = 100;

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Summary ───────────────────────────────────────────────────────────────

  async getSummary(tenantId: string, filter: AnalyticsFilterDto) {
    // Summary counts ignore the dispositions filter so all 4 KPIs are always shown.
    const baseWhere = buildWhere(tenantId, filter, { skipDispositions: true });

    const [total, accepted, quarantined, rejected, exportEligibleCount] =
      await Promise.all([
        this.prisma.tdrRecord.count({ where: baseWhere }),
        this.prisma.tdrRecord.count({
          where: { ...baseWhere, rowDisposition: 'ACCEPTED' },
        }),
        this.prisma.tdrRecord.count({
          where: { ...baseWhere, rowDisposition: 'QUARANTINED' },
        }),
        this.prisma.tdrRecord.count({
          where: { ...baseWhere, rowDisposition: 'REJECTED' },
        }),
        this.prisma.tdrRecord.count({
          where: { ...baseWhere, exportEligible: true },
        }),
      ]);

    // §69 — quality rate: ACCEPTED / (ACCEPTED + QUARANTINED + REJECTED) × 100
    const qualityRate =
      total > 0 ? Math.round((accepted / total) * 10_000) / 100 : null;

    return success({
      total,
      accepted,
      quarantined,
      rejected,
      qualityRate,
      exportEligibleCount,
      // §8 — always flag: values are not aggregated due to mixed-currency risk.
      valueAggregationUnsafe: true,
    });
  }

  // ── Trend ─────────────────────────────────────────────────────────────────

  async getTrend(
    tenantId: string,
    filter: AnalyticsFilterDto,
    granularity: TrendGranularity,
  ) {
    const pgGranularity = TREND_PG_GRANULARITY[granularity];
    const conditions = buildRawConditions(tenantId, filter);

    type TrendRow = {
      period: Date;
      total: bigint;
      accepted: bigint;
      quarantined: bigint;
      rejected: bigint;
    };

    const rows = await this.prisma.$queryRaw<TrendRow[]>`
      SELECT
        DATE_TRUNC(${pgGranularity}, trade_date::timestamp)::date AS period,
        COUNT(*)::bigint                                          AS total,
        COUNT(*) FILTER (WHERE row_disposition = 'ACCEPTED')::bigint   AS accepted,
        COUNT(*) FILTER (WHERE row_disposition = 'QUARANTINED')::bigint AS quarantined,
        COUNT(*) FILTER (WHERE row_disposition = 'REJECTED')::bigint   AS rejected
      FROM tdr_records
      WHERE ${Prisma.join(conditions, ' AND ')}
        AND trade_date IS NOT NULL
      GROUP BY 1
      ORDER BY 1
      LIMIT ${AGGREGATE_POINT_BUDGET}
    `;

    return success({
      granularity,
      points: rows.map((r) => ({
        period: r.period?.toISOString().split('T')[0] ?? null,
        total: Number(r.total),
        accepted: Number(r.accepted),
        quarantined: Number(r.quarantined),
        rejected: Number(r.rejected),
      })),
    });
  }

  // ── Breakdown ─────────────────────────────────────────────────────────────

  async getBreakdown(
    tenantId: string,
    filter: AnalyticsFilterDto,
    dimension: BreakdownDimension,
    topN: number,
  ) {
    const safeTopN = Math.min(Math.max(1, topN), TOP_N_MAX);
    const col = BREAKDOWN_COLUMN_MAP[dimension]; // from enum whitelist, never user input
    const conditions = buildRawConditions(tenantId, filter);

    type BreakdownRow = { dim_value: string | null; record_count: bigint };

    // §65 — parameterized SQL only. Column name from server-side whitelist.
    // We use raw SQL here because Prisma groupBy can't express dynamic column selection cleanly.
    const rows = await this.prisma.$queryRaw<BreakdownRow[]>`
      SELECT
        ${Prisma.raw(col)} AS dim_value,
        COUNT(*)::bigint AS record_count
      FROM tdr_records
      WHERE ${Prisma.join(conditions, ' AND ')}
      GROUP BY 1
      ORDER BY 2 DESC
      LIMIT ${safeTopN}
    `;

    return success({
      dimension,
      items: rows.map((r) => ({
        value: r.dim_value,
        count: Number(r.record_count),
      })),
    });
  }

  // ── Filter options ────────────────────────────────────────────────────────

  async getFilterOptions(tenantId: string) {
    // §22 — max 50-100 per facet.
    const FACET_LIMIT = 100;

    const [directions, chapters, countries, currencies, units] =
      await Promise.all([
        this.prisma.tdrRecord.groupBy({
          by: ['tradeDirection'],
          where: { tenantId },
          _count: { id: true },
          orderBy: { _count: { id: 'desc' } },
          take: FACET_LIMIT,
        }),
        this.prisma.tdrRecord.groupBy({
          by: ['hsChapter'],
          where: { tenantId, hsChapter: { not: null } },
          _count: { id: true },
          orderBy: { _count: { id: 'desc' } },
          take: FACET_LIMIT,
        }),
        // §74 — direction-aware counterparty country: uses DIRECTION_AWARE_COUNTRY_SQL constant.
        // Cannot use Prisma groupBy for a computed column; $queryRaw used instead.
        this.prisma.$queryRaw<Array<{ country_code: string | null }>>`
          SELECT DISTINCT
            ${Prisma.raw(DIRECTION_AWARE_COUNTRY_SQL)} AS country_code
          FROM tdr_records
          WHERE tenant_id = ${tenantId}
            AND (importer_country_code IS NOT NULL
                 OR exporter_country_code IS NOT NULL
                 OR foreign_party_country_code IS NOT NULL)
          ORDER BY 1
          LIMIT ${FACET_LIMIT}
        `,
        this.prisma.tdrRecord.groupBy({
          by: ['currencyCode'],
          where: { tenantId, currencyCode: { not: null } },
          _count: { id: true },
          orderBy: { _count: { id: 'desc' } },
          take: FACET_LIMIT,
        }),
        this.prisma.tdrRecord.groupBy({
          by: ['quantityUnitCode'],
          where: { tenantId, quantityUnitCode: { not: null } },
          _count: { id: true },
          orderBy: { _count: { id: 'desc' } },
          take: FACET_LIMIT,
        }),
      ]);

    return success({
      tradeDirections: directions.map((r) => r.tradeDirection),
      hsChapters: chapters.map((r) => r.hsChapter).filter(Boolean),
      foreignCountryCodes: countries
        .map((r) => r.country_code)
        .filter(Boolean) as string[],
      currencyCodes: currencies.map((r) => r.currencyCode).filter(Boolean),
      quantityUnitCodes: units.map((r) => r.quantityUnitCode).filter(Boolean),
    });
  }
}

// ── WHERE builder (Prisma ORM) ────────────────────────────────────────────────

function buildWhere(
  tenantId: string,
  filter: AnalyticsFilterDto,
  opts: { skipDispositions?: boolean } = {},
): Prisma.TdrRecordWhereInput {
  const where: Prisma.TdrRecordWhereInput = { tenantId };

  if (filter.dateFrom || filter.dateTo) {
    where.tradeDate = {};
    if (filter.dateFrom) where.tradeDate.gte = new Date(filter.dateFrom);
    if (filter.dateTo) where.tradeDate.lte = new Date(filter.dateTo);
  }

  if (filter.tradeDirection) {
    where.tradeDirection = filter.tradeDirection as TradeDirection;
  }

  if (filter.hsCodePrefix) {
    where.hsCodeNormalized = { startsWith: filter.hsCodePrefix };
  }

  if (filter.hsChapter) where.hsChapter = filter.hsChapter;
  if (filter.foreignCountryCode) {
    const v = filter.foreignCountryCode;
    // §74 — direction-aware OR: mirrors DIRECTION_AWARE_COUNTRY_SQL for Prisma ORM.
    // EXPORT: COALESCE(importer_country_code, foreign_party_country_code)
    // IMPORT: COALESCE(exporter_country_code, foreign_party_country_code)
    where.OR = [
      { tradeDirection: TradeDirection.EXPORT, importerCountryCode: v },
      { tradeDirection: TradeDirection.EXPORT, importerCountryCode: null, foreignPartyCountryCode: v },
      { tradeDirection: TradeDirection.IMPORT, exporterCountryCode: v },
      { tradeDirection: TradeDirection.IMPORT, exporterCountryCode: null, foreignPartyCountryCode: v },
    ];
  }
  if (filter.localPartyTaxId) {
    where.localPartyTaxIdNormalized = filter.localPartyTaxId;
  }
  if (filter.batchId) where.batchId = filter.batchId;
  if (filter.exportEligible !== undefined) {
    where.exportEligible = filter.exportEligible;
  }

  if (!opts.skipDispositions && filter.dispositions?.length) {
    where.rowDisposition = { in: filter.dispositions as any };
  }

  return where;
}

// ── WHERE builder ($queryRaw conditions) ─────────────────────────────────────

function buildRawConditions(
  tenantId: string,
  filter: AnalyticsFilterDto,
): Prisma.Sql[] {
  // tenant_id is stored as text (Prisma String maps to text without @db.Uuid)
  const conditions: Prisma.Sql[] = [
    Prisma.sql`tenant_id = ${tenantId}`,
  ];

  if (filter.dateFrom) {
    conditions.push(Prisma.sql`trade_date >= ${filter.dateFrom}::date`);
  }
  if (filter.dateTo) {
    conditions.push(Prisma.sql`trade_date <= ${filter.dateTo}::date`);
  }
  if (filter.tradeDirection) {
    conditions.push(
      Prisma.sql`trade_direction = ${filter.tradeDirection}::"TradeDirection"`,
    );
  }
  if (filter.hsCodePrefix) {
    conditions.push(
      Prisma.sql`hs_code_normalized LIKE ${filter.hsCodePrefix + '%'}`,
    );
  }
  if (filter.hsChapter) {
    conditions.push(Prisma.sql`hs_chapter = ${filter.hsChapter}`);
  }
  if (filter.foreignCountryCode) {
    // §74 — direction-aware filter using DIRECTION_AWARE_COUNTRY_SQL (server-side whitelist).
    conditions.push(
      Prisma.sql`(${Prisma.raw(DIRECTION_AWARE_COUNTRY_SQL)}) = ${filter.foreignCountryCode}`,
    );
  }
  if (filter.localPartyTaxId) {
    conditions.push(
      Prisma.sql`local_party_tax_id_normalized = ${filter.localPartyTaxId}`,
    );
  }
  if (filter.batchId) {
    conditions.push(Prisma.sql`batch_id = ${filter.batchId}`);
  }
  if (filter.exportEligible !== undefined) {
    conditions.push(Prisma.sql`export_eligible = ${filter.exportEligible}`);
  }
  if (filter.dispositions?.length) {
    // Cast each disposition value to the enum type.
    const dispSql = filter.dispositions.map(
      (d) => Prisma.sql`${d}::"RowDisposition"`,
    );
    conditions.push(
      Prisma.sql`row_disposition IN (${Prisma.join(dispSql, ', ')})`,
    );
  }

  return conditions;
}
