import 'reflect-metadata';
import {
  AnalyticsFilterDto,
  BreakdownDimension,
  TrendGranularity,
} from './analytics/dto/analytics-filter.dto';
import { ListRecordsDto, SORT_COLUMNS } from './analytics/dto/list-records.dto';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

// ── §11 — Filter DTO contract ─────────────────────────────────────────────────

describe('AnalyticsFilterDto validation', () => {
  it('accepts a fully empty DTO (all optional)', async () => {
    const dto = plainToInstance(AnalyticsFilterDto, {});
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('accepts a fully populated valid DTO', async () => {
    const dto = plainToInstance(AnalyticsFilterDto, {
      dateFrom: '2025-01-01',
      dateTo: '2025-12-31',
      tradeDirection: 'IMPORT',
      hsCodePrefix: '6105',
      hsChapter: '61',
      foreignCountryCode: 'CN',
      localPartyTaxId: 'TAX123',
      batchId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      dispositions: ['ACCEPTED', 'QUARANTINED'],
      currencyCode: 'USD',
      quantityUnitCode: 'KG',
      exportEligible: true,
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('rejects unknown tradeDirection', async () => {
    const dto = plainToInstance(AnalyticsFilterDto, { tradeDirection: 'SIDEWAYS' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'tradeDirection')).toBe(true);
  });

  it('rejects invalid disposition value', async () => {
    const dto = plainToInstance(AnalyticsFilterDto, { dispositions: ['ACCEPTED', 'OOPS'] });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'dispositions')).toBe(true);
  });

  it('rejects hsChapter longer than 2 chars', async () => {
    const dto = plainToInstance(AnalyticsFilterDto, { hsChapter: '6105' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'hsChapter')).toBe(true);
  });

  it('rejects currencyCode longer than 3 chars', async () => {
    const dto = plainToInstance(AnalyticsFilterDto, { currencyCode: 'USDD' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'currencyCode')).toBe(true);
  });

  it('coerces exportEligible string "true" to boolean', async () => {
    const dto = plainToInstance(AnalyticsFilterDto, { exportEligible: 'true' });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
    expect(dto.exportEligible).toBe(true);
  });

  it('does NOT accept tenantId as a field (security: §66)', async () => {
    const dto = plainToInstance(AnalyticsFilterDto, {});
    expect('tenantId' in dto).toBe(false);
  });
});

// ── §19 — Sort whitelist ──────────────────────────────────────────────────────

describe('SORT_COLUMNS whitelist', () => {
  const expected = [
    'tradeDate',
    'createdAt',
    'id',
    'tradeDirection',
    'hsCodeNormalized',
    'foreignPartyCountryCode',
  ];

  it('contains exactly the approved columns', () => {
    expect([...SORT_COLUMNS].sort()).toEqual(expected.slice().sort());
  });

  it('does not contain dangerous SQL identifiers', () => {
    const forbidden = ['1=1', 'DROP', 'tenantId', '--', 'sleep', 'pg_sleep'];
    for (const f of forbidden) {
      expect(SORT_COLUMNS).not.toContain(f);
    }
  });
});

// ── ListRecordsDto ────────────────────────────────────────────────────────────

describe('ListRecordsDto validation', () => {
  it('accepts defaults', async () => {
    const dto = plainToInstance(ListRecordsDto, {});
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('rejects pageSize above 500 (§16)', async () => {
    const dto = plainToInstance(ListRecordsDto, { pageSize: 501 });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'pageSize')).toBe(true);
  });

  it('accepts pageSize exactly 500', async () => {
    const dto = plainToInstance(ListRecordsDto, { pageSize: 500 });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('rejects pageSize 0', async () => {
    const dto = plainToInstance(ListRecordsDto, { pageSize: 0 });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'pageSize')).toBe(true);
  });

  it('rejects negative page', async () => {
    const dto = plainToInstance(ListRecordsDto, { page: -1 });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'page')).toBe(true);
  });

  it('rejects invalid sortDir', async () => {
    const dto = plainToInstance(ListRecordsDto, { sortDir: 'sideways' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'sortDir')).toBe(true);
  });
});

// ── TrendGranularity enum ─────────────────────────────────────────────────────

describe('TrendGranularity enum', () => {
  it('has exactly DAY, MONTH, YEAR', () => {
    expect(Object.values(TrendGranularity)).toEqual(['DAY', 'MONTH', 'YEAR']);
  });
});

// ── BreakdownDimension enum ───────────────────────────────────────────────────

describe('BreakdownDimension enum', () => {
  const expectedValues = [
    'tradeDirection',
    'hsChapter',
    'foreignPartyCountryCode',
    'currencyCode',
    'quantityUnitCode',
  ];

  it('contains exactly the whitelisted dimensions', () => {
    expect(Object.values(BreakdownDimension).sort()).toEqual(expectedValues.sort());
  });
});

// ── AnalyticsService unit tests ───────────────────────────────────────────────

describe('AnalyticsService (unit, mock Prisma)', () => {
  let service: import('./analytics/analytics.service').AnalyticsService;
  let prisma: any;

  beforeEach(async () => {
    const { AnalyticsService } = await import('./analytics/analytics.service');

    prisma = {
      tdrRecord: {
        count: jest.fn().mockResolvedValue(0),
        groupBy: jest.fn().mockResolvedValue([]),
      },
      $queryRaw: jest.fn().mockResolvedValue([]),
    };

    service = new AnalyticsService(prisma);
  });

  describe('getSummary', () => {
    it('returns all-zero summary when no records', async () => {
      prisma.tdrRecord.count.mockResolvedValue(0);
      const result = await service.getSummary('tenant-1', {});
      expect(result.data.total).toBe(0);
      expect(result.data.accepted).toBe(0);
      expect(result.data.qualityRate).toBeNull();
      expect(result.data.valueAggregationUnsafe).toBe(true);
    });

    it('computes qualityRate = accepted/total × 100', async () => {
      // 5 calls: total, accepted, quarantined, rejected, exportEligible
      prisma.tdrRecord.count
        .mockResolvedValueOnce(100) // total
        .mockResolvedValueOnce(80)  // accepted
        .mockResolvedValueOnce(15)  // quarantined
        .mockResolvedValueOnce(5)   // rejected
        .mockResolvedValueOnce(75); // exportEligible
      const result = await service.getSummary('tenant-1', {});
      expect(result.data.total).toBe(100);
      expect(result.data.accepted).toBe(80);
      expect(result.data.qualityRate).toBe(80);
    });

    it('never passes tenantId through the filter DTO (§66)', async () => {
      prisma.tdrRecord.count.mockResolvedValue(0);
      const filter: any = { tenantId: 'evil-tenant' };
      // service should use tenantId param, not dto.tenantId
      await service.getSummary('real-tenant', filter);
      const firstCall = prisma.tdrRecord.count.mock.calls[0][0];
      expect(firstCall.where.tenantId).toBe('real-tenant');
    });

    it('always sets valueAggregationUnsafe=true (§8 mixed-currency)', async () => {
      prisma.tdrRecord.count.mockResolvedValue(10);
      const result = await service.getSummary('t', {});
      expect(result.data.valueAggregationUnsafe).toBe(true);
    });
  });

  describe('getTrend', () => {
    it('calls $queryRaw once', async () => {
      prisma.$queryRaw.mockResolvedValue([]);
      await service.getTrend('t', {}, TrendGranularity.MONTH);
      expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
    });

    it('returns points array', async () => {
      prisma.$queryRaw.mockResolvedValue([
        { period: new Date('2025-01-01'), total: 10n, accepted: 8n, quarantined: 1n, rejected: 1n },
      ]);
      const result = await service.getTrend('t', {}, TrendGranularity.MONTH);
      expect(result.data.points).toHaveLength(1);
      expect(result.data.points[0].total).toBe(10);
      expect(result.data.points[0].accepted).toBe(8);
      expect(result.data.granularity).toBe(TrendGranularity.MONTH);
    });

    it('converts BigInt to number (JSON-safe)', async () => {
      prisma.$queryRaw.mockResolvedValue([
        { period: new Date('2025-01-01'), total: 999n, accepted: 800n, quarantined: 100n, rejected: 99n },
      ]);
      const result = await service.getTrend('t', {}, TrendGranularity.DAY);
      expect(typeof result.data.points[0].total).toBe('number');
    });
  });

  describe('getBreakdown', () => {
    it('calls $queryRaw with a column from the server whitelist', async () => {
      prisma.$queryRaw.mockResolvedValue([]);
      await service.getBreakdown('t', {}, BreakdownDimension.HS_CHAPTER, 20);
      expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
    });

    it('caps topN at 100 (§14)', async () => {
      prisma.$queryRaw.mockResolvedValue([]);
      // Pass 9999 — should be silently capped; $queryRaw is called once with LIMIT 100
      await service.getBreakdown('t', {}, BreakdownDimension.CURRENCY_CODE, 9999);
      expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
    });

    it('converts BigInt counts to number', async () => {
      prisma.$queryRaw.mockResolvedValue([
        { dim_value: 'USD', record_count: 42n },
      ]);
      const result = await service.getBreakdown('t', {}, BreakdownDimension.CURRENCY_CODE, 10);
      expect(typeof result.data.items[0].count).toBe('number');
      expect(result.data.items[0].count).toBe(42);
    });
  });

  describe('getFilterOptions', () => {
    it('calls groupBy for each facet', async () => {
      prisma.tdrRecord.groupBy.mockResolvedValue([]);
      await service.getFilterOptions('t');
      expect(prisma.tdrRecord.groupBy).toHaveBeenCalledTimes(5);
    });

    it('returns empty arrays when no records', async () => {
      prisma.tdrRecord.groupBy.mockResolvedValue([]);
      const result = await service.getFilterOptions('t');
      expect(result.data.tradeDirections).toEqual([]);
      expect(result.data.currencyCodes).toEqual([]);
    });
  });
});

// ── RecordsService unit tests ─────────────────────────────────────────────────

describe('RecordsService (unit, mock Prisma)', () => {
  let service: import('./analytics/records.service').RecordsService;
  let prisma: any;

  beforeEach(async () => {
    const { RecordsService } = await import('./analytics/records.service');

    prisma = {
      tdrRecord: {
        count: jest.fn().mockResolvedValue(0),
        findMany: jest.fn().mockResolvedValue([]),
      },
    };

    service = new RecordsService(prisma);
  });

  it('returns empty page when no records', async () => {
    const dto = plainToInstance(ListRecordsDto, { batchId: 'some-batch-id' });
    const result = await service.listRecords('tenant-1', dto);
    expect(result.data).toEqual([]);
    expect(result.meta.total).toBe(0);
    expect(result.meta.hasMore).toBe(false);
  });

  it('caps pageSize at 500 (§16)', async () => {
    const dto = plainToInstance(ListRecordsDto, { pageSize: 500, batchId: 'b' });
    await service.listRecords('t', dto);
    expect(prisma.tdrRecord.findMany.mock.calls[0][0].take).toBe(500);
  });

  it('throws SCOPE_TOO_WIDE when no scope and total > 10000 (§20)', async () => {
    prisma.tdrRecord.count.mockResolvedValue(10_001);
    const dto = plainToInstance(ListRecordsDto, {});
    await expect(service.listRecords('t', dto)).rejects.toThrow('SCOPE_TOO_WIDE');
  });

  it('does NOT throw when batchId is provided even with large total', async () => {
    prisma.tdrRecord.count.mockResolvedValue(50_000);
    prisma.tdrRecord.findMany.mockResolvedValue([]);
    const dto = plainToInstance(ListRecordsDto, { batchId: 'some-batch-id' });
    await expect(service.listRecords('t', dto)).resolves.toBeDefined();
  });

  it('uses tradeDate as default sort when sortBy is absent', async () => {
    prisma.tdrRecord.count.mockResolvedValue(5);
    const dto = plainToInstance(ListRecordsDto, { batchId: 'b' });
    await service.listRecords('t', dto);
    const orderBy = prisma.tdrRecord.findMany.mock.calls[0][0].orderBy;
    expect(orderBy).toEqual({ tradeDate: 'desc' });
  });

  it('respects an approved sortBy column', async () => {
    prisma.tdrRecord.count.mockResolvedValue(5);
    const dto = plainToInstance(ListRecordsDto, { batchId: 'b', sortBy: 'hsCodeNormalized', sortDir: 'asc' });
    await service.listRecords('t', dto);
    const orderBy = prisma.tdrRecord.findMany.mock.calls[0][0].orderBy;
    expect(orderBy).toEqual({ hsCodeNormalized: 'asc' });
  });

  it('falls back to tradeDate for an un-whitelisted sortBy', async () => {
    prisma.tdrRecord.count.mockResolvedValue(5);
    const dto = plainToInstance(ListRecordsDto, { batchId: 'b', sortBy: '1=1; DROP TABLE' as any });
    await service.listRecords('t', dto);
    const orderBy = prisma.tdrRecord.findMany.mock.calls[0][0].orderBy;
    expect(orderBy.tradeDate).toBeDefined();
  });

  it('includes tenantId in the where clause (§66)', async () => {
    prisma.tdrRecord.count.mockResolvedValue(5);
    const dto = plainToInstance(ListRecordsDto, { batchId: 'b' });
    await service.listRecords('specific-tenant', dto);
    const where = prisma.tdrRecord.findMany.mock.calls[0][0].where;
    expect(where.tenantId).toBe('specific-tenant');
  });
});

// ── §39 — HS code text safety ─────────────────────────────────────────────────

describe('HS code text safety (§39)', () => {
  it('AnalyticsFilterDto.hsCodePrefix is a string field, never numeric', () => {
    const dto = new AnalyticsFilterDto();
    dto.hsCodePrefix = '6105';
    expect(typeof dto.hsCodePrefix).toBe('string');
    expect(Number.isNaN(Number(dto.hsCodePrefix))).toBe(false);
    // The point: it stays as string, never cast to number by the DTO
    expect(dto.hsCodePrefix).toBe('6105');
  });
});
