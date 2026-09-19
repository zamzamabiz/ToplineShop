/**
 * Frontend analytics types and safety contract tests.
 * Verifies shape correctness and key safety invariants without network calls.
 */

import { describe, it, expect } from 'vitest';
import type {
  AnalyticsFilter,
  AnalyticsSummary,
  TrendPoint,
  BreakdownItem,
  RowDisposition,
  TradeDirection,
} from '@/types/tdr';

// ── AnalyticsSummary shape ─────────────────────────────────────────────────────

describe('AnalyticsSummary contract', () => {
  it('valueAggregationUnsafe is always true (§8)', () => {
    const summary: AnalyticsSummary = {
      total: 100,
      accepted: 80,
      quarantined: 15,
      rejected: 5,
      qualityRate: 80,
      exportEligibleCount: 75,
      valueAggregationUnsafe: true,
    };
    expect(summary.valueAggregationUnsafe).toBe(true);
    // TypeScript would fail to compile if valueAggregationUnsafe were false — test that the type is `true` not `boolean`.
    const onlyTrue: true = summary.valueAggregationUnsafe;
    expect(onlyTrue).toBe(true);
  });

  it('qualityRate can be null when no records', () => {
    const summary: AnalyticsSummary = {
      total: 0,
      accepted: 0,
      quarantined: 0,
      rejected: 0,
      qualityRate: null,
      exportEligibleCount: 0,
      valueAggregationUnsafe: true,
    };
    expect(summary.qualityRate).toBeNull();
  });
});

// ── AnalyticsFilter shape ─────────────────────────────────────────────────────

describe('AnalyticsFilter contract', () => {
  it('does not include tenantId field (§66)', () => {
    const filter: AnalyticsFilter = {
      dateFrom: '2025-01-01',
      dateTo: '2025-12-31',
      tradeDirection: 'IMPORT',
    };
    expect('tenantId' in filter).toBe(false);
  });

  it('all fields are optional', () => {
    const emptyFilter: AnalyticsFilter = {};
    expect(emptyFilter.dateFrom).toBeUndefined();
    expect(emptyFilter.tradeDirection).toBeUndefined();
    expect(emptyFilter.dispositions).toBeUndefined();
  });

  it('dispositions accepts only known RowDisposition values', () => {
    const validDispositions: RowDisposition[] = ['ACCEPTED', 'QUARANTINED', 'REJECTED'];
    const filter: AnalyticsFilter = { dispositions: validDispositions };
    expect(filter.dispositions).toEqual(['ACCEPTED', 'QUARANTINED', 'REJECTED']);
  });

  it('tradeDirection is typed as IMPORT | EXPORT, never a number', () => {
    const dir: TradeDirection = 'IMPORT';
    expect(typeof dir).toBe('string');
    expect(dir).not.toBe(0);
  });
});

// ── TrendPoint shape ──────────────────────────────────────────────────────────

describe('TrendPoint shape', () => {
  it('period is a string, not a Date (§70)', () => {
    const point: TrendPoint = {
      period: '2025-01',
      total: 100,
      accepted: 80,
      quarantined: 15,
      rejected: 5,
    };
    expect(typeof point.period).toBe('string');
  });

  it('all counts are numbers, not BigInts', () => {
    const point: TrendPoint = {
      period: '2025-01',
      total: 100,
      accepted: 80,
      quarantined: 15,
      rejected: 5,
    };
    expect(typeof point.total).toBe('number');
    expect(typeof point.accepted).toBe('number');
    expect(Number.isFinite(point.total)).toBe(true);
  });
});

// ── BreakdownItem safety ──────────────────────────────────────────────────────

describe('BreakdownItem safety', () => {
  it('value can be null (null partition in DB)', () => {
    const item: BreakdownItem = { value: null, count: 42 };
    expect(item.value).toBeNull();
    expect(item.count).toBe(42);
  });

  it('count is a number, not a BigInt (JSON-safe)', () => {
    const item: BreakdownItem = { value: 'USD', count: 999 };
    expect(typeof item.count).toBe('number');
    expect(Number.isFinite(item.count)).toBe(true);
  });
});

// ── HS code text safety (§39) ─────────────────────────────────────────────────

describe('HS code text safety (§39)', () => {
  it('hsCodePrefix in AnalyticsFilter is string, never forced to number', () => {
    const filter: AnalyticsFilter = { hsCodePrefix: '6105' };
    expect(typeof filter.hsCodePrefix).toBe('string');
    // Specifically: HS code '6105' looks numeric but must stay a string.
    expect(filter.hsCodePrefix).toBe('6105');
    expect(filter.hsCodePrefix).not.toBe(6105);
  });

  it('hsChapter is string (2 chars), not a number', () => {
    const filter: AnalyticsFilter = { hsChapter: '61' };
    expect(typeof filter.hsChapter).toBe('string');
    expect(filter.hsChapter).toBe('61');
  });
});
