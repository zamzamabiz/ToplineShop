/**
 * TDR-CORRECTION-FINALIZATION-CORRECTION-001
 *
 * Verifies two finalization defects:
 *   §A  Batch status recomputation — REVIEW_REQUIRED → READY when
 *       the last quarantined record is accepted via correction/re-evaluation
 *   §B  Correction idempotency — backend is command-history preserving
 *       (intentionally non-idempotent); helper script must be restart-safe
 */

import 'reflect-metadata';

import { determineBatchStatus } from './quality/decision/quality-decision.service';
import { isValidTransition } from './types/batch-transition';
import { CorrectionService } from './quality/correction/correction.service';
import { MappingConfigV1 } from './quality/types/mapping-config.types';
import { normalizeRowV1 } from './quality/normalization/normalizer.service';
import { validateRowV1 } from './quality/validation/validator.service';
import { filterCorrectedRequiredIssues, buildRevalidationRow } from './quality/correction/correction.service';
import { RULE_CODE } from './quality/constants/validation-rule.catalog';

// ── §1 determineBatchStatus ───────────────────────────────────────────────────

describe('determineBatchStatus', () => {
  it('returns READY when accepted = total, quarantined = 0, rejected = 0, pending = 0', () => {
    expect(determineBatchStatus(16, 0, 0, 0)).toBe('READY');
  });

  it('returns REVIEW_REQUIRED when quarantined > 0', () => {
    expect(determineBatchStatus(15, 1, 0, 0)).toBe('REVIEW_REQUIRED');
  });

  it('returns PARTIAL when rejected > 0 and quarantined = 0', () => {
    expect(determineBatchStatus(14, 0, 2, 0)).toBe('PARTIAL');
  });

  it('returns QUALITY_PENDING when pendingQuality > 0', () => {
    expect(determineBatchStatus(10, 0, 0, 6)).toBe('QUALITY_PENDING');
  });

  it('QUARANTINED takes precedence over REJECTED when both non-zero', () => {
    expect(determineBatchStatus(10, 2, 4, 0)).toBe('REVIEW_REQUIRED');
  });
});

// ── §2 state machine: REVIEW_REQUIRED → READY is a valid transition ───────────

describe('isValidTransition — batch status state machine', () => {
  it('REVIEW_REQUIRED → READY is valid', () => {
    expect(isValidTransition('REVIEW_REQUIRED', 'READY')).toBe(true);
  });

  it('READY → REVIEW_REQUIRED is NOT valid (no regression)', () => {
    expect(isValidTransition('READY', 'REVIEW_REQUIRED')).toBe(false);
  });

  it('REVIEW_REQUIRED → PARTIAL is valid', () => {
    expect(isValidTransition('REVIEW_REQUIRED', 'PARTIAL')).toBe(true);
  });
});

// ── §3 reEvaluateRecord — Prisma mock integration ────────────────────────────

function makeMinimalConfig(): MappingConfigV1 {
  return {
    version: 'v1',
    columnMappings: [
      {
        sourceColumnName: 'DATE',
        canonicalField: 'tradeDate',
        sourceDatatype: 'DATE',
        transformationRule: 'DATE_PARSE_DMY',
        requiredPolicy: 'REQUIRED',
        validationRules: [],
      },
      {
        sourceColumnName: 'Quantity',
        canonicalField: 'quantityRaw',
        sourceDatatype: 'DECIMAL',
        requiredPolicy: 'REQUIRED',
        validationRules: [],
      },
    ],
  };
}

function makeRecord(overrides: object = {}) {
  return {
    id: 'rec-1',
    batchId: 'batch-1',
    tenantId: 'tenant-1',
    tradeDate: new Date(Date.UTC(2025, 0, 13)),
    quantityRaw: '',
    quantityNormalized: '100',
    rowDisposition: 'QUARANTINED',
    exportEligible: false,
    quarantineReviewRequired: true,
    valueTreatmentMeta: { quantityNormalized: 'CORRECTED' },
    batch: { mappingId: 'map-1', status: 'REVIEW_REQUIRED' },
    ...overrides,
  };
}

function makePrismaMock(record: ReturnType<typeof makeRecord>, batchCounts = { acceptedRows: 16, quarantinedRows: 0, rejectedRows: 0 }) {
  const tx = {
    tdrValidationIssue: {
      updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      createMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
    tdrRecord: {
      count: jest.fn().mockResolvedValue(0), // PENDING_QUALITY = 0
      update: jest.fn().mockResolvedValue({}),
    },
    tdrBatch: {
      update: jest.fn().mockResolvedValue({}),
      findUnique: jest.fn().mockResolvedValue(batchCounts),
    },
  };
  return {
    tdrRecord: {
      findFirst: jest.fn().mockResolvedValue(record),
    },
    tdrSchemaMapping: {
      findUnique: jest.fn().mockResolvedValue({ mappingConfig: makeMinimalConfig() }),
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  $transaction: jest.fn().mockImplementation(async (fn: (tx: any) => Promise<unknown>) => fn(tx)),
    _tx: tx,
  };
}

describe('reEvaluateRecord — batch status recomputation', () => {
  it('transitions batch REVIEW_REQUIRED → READY when re-eval produces ACCEPTED disposition', async () => {
    const record = makeRecord();
    const prisma = makePrismaMock(record);
    const svc = new CorrectionService(prisma as never, { recordEvent: jest.fn() } as never);

    const result = await svc.reEvaluateRecord('batch-1', 'rec-1', 'tenant-1');

    expect(result.rowDisposition).toBe('ACCEPTED');
    expect(result.exportEligible).toBe(true);
    expect(result.newIssueCount).toBe(0);

    // Verify batch status was updated
    const batchUpdates = prisma._tx.tdrBatch.update.mock.calls;
    const statusUpdate = batchUpdates.find((call: unknown[]) => {
      const args = call[0] as { data: { status?: string } };
      return args.data.status === 'READY';
    });
    expect(statusUpdate).toBeDefined();
  });

  it('does NOT update batch status when disposition does not change', async () => {
    const alreadyAccepted = makeRecord({ rowDisposition: 'ACCEPTED', exportEligible: true, quarantineReviewRequired: false, batch: { mappingId: 'map-1', status: 'READY' } });
    const prisma = makePrismaMock(alreadyAccepted, { acceptedRows: 16, quarantinedRows: 0, rejectedRows: 0 });
    const svc = new CorrectionService(prisma as never, { recordEvent: jest.fn() } as never);

    await svc.reEvaluateRecord('batch-1', 'rec-1', 'tenant-1');

    // No batch update with a status field should have been called
    const batchUpdates = prisma._tx.tdrBatch.update.mock.calls;
    const statusUpdate = batchUpdates.find((call: unknown[]) => {
      const args = call[0] as { data: { status?: string } };
      return args.data.status !== undefined;
    });
    expect(statusUpdate).toBeUndefined();
  });

  it('preserves REVIEW_REQUIRED when quarantinedRows remain > 0 after re-eval', async () => {
    const record = makeRecord();
    // Simulate batch still has quarantined rows after update
    const prisma = makePrismaMock(record, { acceptedRows: 15, quarantinedRows: 1, rejectedRows: 0 });
    const svc = new CorrectionService(prisma as never, { recordEvent: jest.fn() } as never);

    await svc.reEvaluateRecord('batch-1', 'rec-1', 'tenant-1');

    const batchUpdates = prisma._tx.tdrBatch.update.mock.calls;
    const statusUpdate = batchUpdates.find((call: unknown[]) => {
      const args = call[0] as { data: { status?: string } };
      return args.data.status === 'READY';
    });
    expect(statusUpdate).toBeUndefined();
  });
});

// ── §4 determineBatchStatus edge cases from task §6 ──────────────────────────

describe('batch invariant: 16/0/0 → READY', () => {
  it('Pakistan Customs Imp batch final state resolves to READY', () => {
    expect(determineBatchStatus(16, 0, 0, 0)).toBe('READY');
  });

  it('not READY when any quarantined rows remain', () => {
    expect(determineBatchStatus(16, 1, 0, 0)).not.toBe('READY');
  });

  it('PARTIAL for mixed accepted/rejected with no quarantined', () => {
    expect(determineBatchStatus(14, 0, 2, 0)).toBe('PARTIAL');
  });
});

// ── §5 Correction idempotency — backend is command-history preserving ─────────

describe('correction backend semantics — command-history preserving', () => {
  it('filterCorrectedRequiredIssues still suppresses on a re-evaluation call (safe to re-run pipeline)', () => {
    // Simulates the pipeline running again on the same corrected record — should produce same result
    const config = makeMinimalConfig();
    const record: Record<string, unknown> = {
      tradeDate: new Date(Date.UTC(2025, 0, 13)),
      quantityRaw: '',
      quantityNormalized: '100',
      valueTreatmentMeta: { quantityNormalized: 'CORRECTED' },
    };

    const revalidationRow = buildRevalidationRow(record, config);
    const normalized = normalizeRowV1(revalidationRow, config);
    const rawIssues = validateRowV1(normalized, config);
    const meta = record.valueTreatmentMeta as Record<string, string>;
    const filtered = filterCorrectedRequiredIssues(rawIssues, meta, record);

    expect(filtered).toHaveLength(0);
  });

  it('REQUIRED_FIELD_MISSING not suppressed when quantityNormalized is NOT marked CORRECTED (idempotency guard: no false-positive suppression)', () => {
    const config = makeMinimalConfig();
    const record: Record<string, unknown> = {
      tradeDate: new Date(Date.UTC(2025, 0, 13)),
      quantityRaw: '',
      quantityNormalized: '100',
      valueTreatmentMeta: {}, // not marked CORRECTED
    };

    const revalidationRow = buildRevalidationRow(record, config);
    const normalized = normalizeRowV1(revalidationRow, config);
    const rawIssues = validateRowV1(normalized, config);
    const meta = record.valueTreatmentMeta as Record<string, string>;
    const filtered = filterCorrectedRequiredIssues(rawIssues, meta, record);

    const qtyMissing = filtered.find(
      (i) => i.ruleCode === RULE_CODE.REQUIRED_FIELD_MISSING && i.fieldName === 'quantityRaw',
    );
    expect(qtyMissing).toBeDefined();
  });
});
