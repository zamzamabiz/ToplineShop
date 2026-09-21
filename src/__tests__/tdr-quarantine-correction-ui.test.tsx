/**
 * TDR-QUARANTINE-CORRECTION-UI-001
 * TdrQualityDetailPanel — quarantine review and governed correction workflow tests.
 *
 * Verifies:
 *  §1 Loading state while fetching quality detail
 *  §2 Record identity rendered after load
 *  §3 SOURCE VALUE / NORMALIZED VALUE columns present
 *  §4 CORRECTED badge shown for corrected fields
 *  §5 Open validation issues displayed
 *  §6 Correction history displayed
 *  §7 Correction form with CORRECTABLE_FIELDS selector
 *  §8 Role: IMPORT_MANAGER read-only on EXPORT records
 *  §9 Role: TENANT_ADMIN can correct any direction
 * §10 Duplicate field warning when field already CORRECTED
 * §11 Confirm step shows current/new values before/after
 * §12 Successful correction → applyCorrection then reEvaluateRecord called in sequence
 * §13 Result banner shows new disposition after correction
 * §14 Error state shown on correction submission failure
 * §15 Panel closes on Escape key
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import React from 'react';

// ── Module mocks ──────────────────────────────────────────────────────────────

vi.mock('@/lib/tdr-api', () => ({
  getQualityDetail: vi.fn(),
  applyCorrection: vi.fn(),
  reEvaluateRecord: vi.fn(),
  setAuthCallbacks: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useSearchParams: () => ({ get: (_k: string) => 'batch-001' }),
  useParams: () => ({}),
  useRouter: () => ({ push: vi.fn() }),
}));

// ── Auth mock — configurable per-test ─────────────────────────────────────────

const mockUseAuth = vi.fn();
vi.mock('@/lib/auth-context', () => ({
  useAuth: () => mockUseAuth(),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// ── Import the module under test AFTER mocks ──────────────────────────────────

import { getQualityDetail, applyCorrection, reEvaluateRecord } from '@/lib/tdr-api';
import { TdrQualityDetailPanel } from '@/components/tdr/TdrQualityDetailPanel';

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeDetail(overrides: Record<string, unknown> = {}) {
  return {
    id: 'rec-001',
    sourceRowNumber: 15,
    rowDisposition: 'QUARANTINED',
    exportEligible: false,
    quarantineReviewRequired: true,
    tradeDate: '2025-01-15',
    tradeDirection: 'IMPORT',
    hsCodeRaw: '1234.56',
    hsCodeNormalized: '123456',
    hsChapter: '12',
    productDescriptionRaw: 'Raw cotton',
    productDescriptionNormalized: null,
    localPartyTaxIdRaw: null,
    localPartyTaxIdNormalized: null,
    localPartyNameRaw: 'ACME',
    localPartyNameNormalized: 'ACME Corp',
    localPartyAddressRaw: null,
    localPartyCountryCode: 'PK',
    foreignPartyNameRaw: 'ForeignCo',
    foreignPartyNameNormalized: 'ForeignCo Ltd',
    foreignPartyAddressRaw: null,
    foreignPartyCountryRaw: 'CN',
    foreignPartyCountryCode: 'CN',
    originPortRaw: null,
    originPortNormalized: null,
    quantityRaw: '',
    quantityNormalized: null,
    quantityUnitRaw: 'KG',
    quantityUnitCode: 'KG',
    unitPriceRaw: '10.5',
    unitPriceNormalized: 10.5,
    currencyRaw: 'USD',
    currencyCode: 'USD',
    valueTreatmentMeta: {},
    validationIssues: [
      {
        id: 'iss-001',
        fieldName: 'quantityRaw',
        ruleCode: 'REQUIRED_FIELD_MISSING',
        severity: 'ERROR',
        message: 'Quantity is required',
        status: 'OPEN',
        createdAt: '2025-01-01T00:00:00Z',
      },
    ],
    quarantineReviews: [],
    ...overrides,
  };
}

function makeAdminAuth(roles = ['TENANT_ADMIN']) {
  return {
    accessToken: 'tok-admin',
    user: { userId: 'u1', tenantId: 't1', roles },
    isAuthenticated: true,
  };
}

function renderPanel(props?: Partial<React.ComponentProps<typeof TdrQualityDetailPanel>>) {
  const onClose = vi.fn();
  const onCorrected = vi.fn();
  const result = render(
    <TdrQualityDetailPanel
      batchId="batch-001"
      recordId="rec-001"
      onClose={onClose}
      onCorrected={onCorrected}
      {...props}
    />,
  );
  return { onClose, onCorrected, ...result };
}

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  mockUseAuth.mockReturnValue(makeAdminAuth());
  vi.mocked(getQualityDetail).mockResolvedValue(makeDetail() as never);
  vi.mocked(applyCorrection).mockResolvedValue({
    reviewId: 'rev-001',
    recordId: 'rec-001',
    fieldName: 'quantityNormalized',
    newDisposition: 'ACCEPTED',
    exportEligible: true,
  } as never);
  vi.mocked(reEvaluateRecord).mockResolvedValue({
    rowDisposition: 'ACCEPTED',
    exportEligible: true,
    newIssueCount: 0,
  } as never);
});

afterEach(() => {
  vi.clearAllMocks();
});

// ── §1 Loading state ──────────────────────────────────────────────────────────

describe('§1 Loading state', () => {
  it('shows loading skeleton while getQualityDetail is in flight', async () => {
    vi.mocked(getQualityDetail).mockImplementation(() => new Promise(() => {})); // never resolves
    renderPanel();
    expect(screen.getByTestId('quality-detail-loading')).toBeTruthy();
  });
});

// ── §2 Record identity ────────────────────────────────────────────────────────

describe('§2 Record identity', () => {
  it('shows row number and disposition after load', async () => {
    renderPanel();
    await waitFor(() => expect(screen.getByTestId('record-identity')).toBeTruthy());
    expect(screen.getByText(/Row 15/)).toBeTruthy();
    expect(screen.getByTestId('disposition-badge').textContent).toBe('QUARANTINED');
  });
});

// ── §3 Source / Normalized columns ───────────────────────────────────────────

describe('§3 Source / Normalized columns', () => {
  it('renders Source Value and Normalized Value column headers', async () => {
    renderPanel();
    await waitFor(() => expect(screen.getByTestId('field-values-table')).toBeTruthy());
    expect(screen.getByText('Source Value')).toBeTruthy();
    expect(screen.getByText('Normalized Value')).toBeTruthy();
  });

  it('shows raw and normalized values for HS Code row', async () => {
    renderPanel();
    await waitFor(() => expect(screen.getByTestId('src-hsCodeNormalized')).toBeTruthy());
    expect(screen.getByTestId('src-hsCodeNormalized').textContent).toBe('1234.56');
    expect(screen.getByTestId('norm-hsCodeNormalized').textContent).toContain('123456');
  });
});

// ── §4 CORRECTED badge ────────────────────────────────────────────────────────

describe('§4 CORRECTED badge', () => {
  it('shows CORRECTED badge when valueTreatmentMeta marks field as CORRECTED', async () => {
    vi.mocked(getQualityDetail).mockResolvedValue(
      makeDetail({ valueTreatmentMeta: { quantityNormalized: 'CORRECTED' }, quantityNormalized: 100 }) as never,
    );
    renderPanel();
    await waitFor(() =>
      expect(screen.getByTestId('corrected-badge-quantityNormalized')).toBeTruthy(),
    );
    expect(screen.getByTestId('corrected-badge-quantityNormalized').textContent).toBe('CORRECTED');
  });

  it('does NOT show CORRECTED badge for fields not in valueTreatmentMeta', async () => {
    renderPanel();
    await waitFor(() => expect(screen.getByTestId('field-values-table')).toBeTruthy());
    expect(screen.queryByTestId('corrected-badge-quantityNormalized')).toBeNull();
  });
});

// ── §5 Open issues ────────────────────────────────────────────────────────────

describe('§5 Open issues', () => {
  it('displays open validation issues section', async () => {
    renderPanel();
    await waitFor(() => expect(screen.getByTestId('open-issues')).toBeTruthy());
    expect(screen.getByText(/Quantity is required/)).toBeTruthy();
    expect(screen.getByText('REQUIRED_FIELD_MISSING')).toBeTruthy();
  });

  it('shows no-open-issues banner when all issues resolved', async () => {
    vi.mocked(getQualityDetail).mockResolvedValue(
      makeDetail({ validationIssues: [] }) as never,
    );
    renderPanel();
    await waitFor(() => expect(screen.getByText(/No open issues/)).toBeTruthy());
  });
});

// ── §6 Correction history ─────────────────────────────────────────────────────

describe('§6 Correction history', () => {
  it('shows correction history when quarantineReviews present', async () => {
    vi.mocked(getQualityDetail).mockResolvedValue(
      makeDetail({
        quarantineReviews: [
          {
            id: 'rev-aaa00001',
            action: 'CORRECT',
            correctionFieldName: 'quantityNormalized',
            correctionNote: 'Supplied missing qty',
            appliedAt: '2025-01-01T10:00:00Z',
            createdAt: '2025-01-01T10:00:00Z',
          },
        ],
      }) as never,
    );
    renderPanel();
    await waitFor(() => expect(screen.getByTestId('correction-history')).toBeTruthy());
    expect(screen.getByText(/CORRECT/)).toBeTruthy();
    expect(screen.getByText(/Supplied missing qty/)).toBeTruthy();
  });
});

// ── §7 Correction form field selector ────────────────────────────────────────

describe('§7 Correction form field selector', () => {
  it('renders correction form with correctable field options for admin', async () => {
    renderPanel();
    await waitFor(() => expect(screen.getByTestId('correction-form')).toBeTruthy());
    const select = screen.getByLabelText('Field to correct') as HTMLSelectElement;
    const options = Array.from(select.options).map(o => o.value);
    expect(options).toContain('quantityNormalized');
    expect(options).toContain('hsCodeNormalized');
    expect(options).toContain('currencyCode');
  });
});

// ── §8 Role: IMPORT_MANAGER cannot correct EXPORT record ─────────────────────

describe('§8 Role: IMPORT_MANAGER on EXPORT record', () => {
  it('shows read-only notice instead of correction form', async () => {
    mockUseAuth.mockReturnValue(makeAdminAuth(['IMPORT_MANAGER']));
    vi.mocked(getQualityDetail).mockResolvedValue(
      makeDetail({ tradeDirection: 'EXPORT' }) as never,
    );
    renderPanel();
    await waitFor(() => expect(screen.getByTestId('no-rights-notice')).toBeTruthy());
    expect(screen.queryByTestId('correction-form')).toBeNull();
    expect(screen.getByText(/Read-only/)).toBeTruthy();
  });
});

// ── §9 Role: TENANT_ADMIN can correct any direction ──────────────────────────

describe('§9 Role: TENANT_ADMIN can correct any direction', () => {
  it('shows correction form for EXPORT record', async () => {
    mockUseAuth.mockReturnValue(makeAdminAuth(['TENANT_ADMIN']));
    vi.mocked(getQualityDetail).mockResolvedValue(
      makeDetail({ tradeDirection: 'EXPORT' }) as never,
    );
    renderPanel();
    await waitFor(() => expect(screen.getByTestId('correction-form')).toBeTruthy());
    expect(screen.queryByTestId('no-rights-notice')).toBeNull();
  });
});

// ── §10 Duplicate warning ─────────────────────────────────────────────────────

describe('§10 Duplicate field warning', () => {
  it('shows warning when selected field is already CORRECTED', async () => {
    vi.mocked(getQualityDetail).mockResolvedValue(
      makeDetail({
        valueTreatmentMeta: { quantityNormalized: 'CORRECTED' },
        quantityNormalized: 100,
      }) as never,
    );
    renderPanel();
    await waitFor(() => expect(screen.getByTestId('correction-form')).toBeTruthy());
    const select = screen.getByLabelText('Field to correct') as HTMLSelectElement;
    fireEvent.change(select, { target: { value: 'quantityNormalized' } });
    await waitFor(() => expect(screen.getByTestId('duplicate-warning')).toBeTruthy());
    expect(screen.getByText(/previously corrected/)).toBeTruthy();
  });
});

// ── §11 Confirm step shows before/after values ────────────────────────────────

describe('§11 Confirm step', () => {
  it('shows current and new value in confirm step', async () => {
    vi.mocked(getQualityDetail).mockResolvedValue(
      makeDetail({ hsCodeNormalized: '123456' }) as never,
    );
    renderPanel();
    await waitFor(() => expect(screen.getByTestId('correction-form')).toBeTruthy());

    const select = screen.getByLabelText('Field to correct') as HTMLSelectElement;
    fireEvent.change(select, { target: { value: 'hsCodeNormalized' } });

    const valueInput = screen.getByLabelText('Corrected value') as HTMLInputElement;
    fireEvent.change(valueInput, { target: { value: '654321' } });

    fireEvent.click(screen.getByTestId('review-changes-btn'));

    await waitFor(() => expect(screen.getByTestId('confirm-step')).toBeTruthy());
    expect(screen.getByTestId('confirm-current-value').textContent).toBe('123456');
    expect(screen.getByTestId('confirm-new-value').textContent).toBe('654321');
  });
});

// ── §12 Successful correction sequence ────────────────────────────────────────

describe('§12 Successful correction sequence', () => {
  it('calls applyCorrection then reEvaluateRecord in order', async () => {
    const callOrder: string[] = [];
    vi.mocked(applyCorrection).mockImplementation(async (..._args) => {
      callOrder.push('applyCorrection');
      return { reviewId: 'rev-001', recordId: 'rec-001', fieldName: 'quantityNormalized', newDisposition: 'ACCEPTED', exportEligible: true };
    });
    vi.mocked(reEvaluateRecord).mockImplementation(async (..._args) => {
      callOrder.push('reEvaluateRecord');
      return { rowDisposition: 'ACCEPTED', exportEligible: true, newIssueCount: 0 };
    });

    renderPanel();
    await waitFor(() => expect(screen.getByTestId('correction-form')).toBeTruthy());

    const select = screen.getByLabelText('Field to correct') as HTMLSelectElement;
    fireEvent.change(select, { target: { value: 'quantityNormalized' } });

    const valueInput = screen.getByLabelText('Corrected value') as HTMLInputElement;
    fireEvent.change(valueInput, { target: { value: '100' } });

    fireEvent.click(screen.getByTestId('review-changes-btn'));
    await waitFor(() => expect(screen.getByTestId('confirm-step')).toBeTruthy());

    await act(async () => {
      fireEvent.click(screen.getByTestId('confirm-apply-btn'));
    });

    await waitFor(() => expect(callOrder).toEqual(['applyCorrection', 'reEvaluateRecord']));

    expect(vi.mocked(applyCorrection)).toHaveBeenCalledWith(
      'tok-admin',
      'batch-001',
      'rec-001',
      expect.objectContaining({ fieldName: 'quantityNormalized', correctedValue: '100' }),
    );
    expect(vi.mocked(reEvaluateRecord)).toHaveBeenCalledWith('tok-admin', 'batch-001', 'rec-001');
  });
});

// ── §13 Result banner shows new disposition ───────────────────────────────────

describe('§13 Result banner', () => {
  it('shows new disposition in correction result banner', async () => {
    vi.mocked(reEvaluateRecord).mockResolvedValue({
      rowDisposition: 'ACCEPTED',
      exportEligible: true,
      newIssueCount: 0,
    });

    renderPanel();
    await waitFor(() => expect(screen.getByTestId('correction-form')).toBeTruthy());

    const select = screen.getByLabelText('Field to correct') as HTMLSelectElement;
    fireEvent.change(select, { target: { value: 'quantityNormalized' } });
    const valueInput = screen.getByLabelText('Corrected value') as HTMLInputElement;
    fireEvent.change(valueInput, { target: { value: '100' } });
    fireEvent.click(screen.getByTestId('review-changes-btn'));
    await waitFor(() => expect(screen.getByTestId('confirm-step')).toBeTruthy());

    await act(async () => {
      fireEvent.click(screen.getByTestId('confirm-apply-btn'));
    });

    await waitFor(() => expect(screen.getByTestId('correction-result')).toBeTruthy());
    expect(screen.getByTestId('new-disposition').textContent).toBe('ACCEPTED');
    expect(screen.getByText(/Correction applied/)).toBeTruthy();
  });
});

// ── §14 Error state on correction failure ─────────────────────────────────────

describe('§14 Correction error state', () => {
  it('shows error message when applyCorrection rejects', async () => {
    vi.mocked(applyCorrection).mockRejectedValue(
      Object.assign(new Error('Field not correctable: rejected value'), { status: 400 }),
    );

    renderPanel();
    await waitFor(() => expect(screen.getByTestId('correction-form')).toBeTruthy());

    const select = screen.getByLabelText('Field to correct') as HTMLSelectElement;
    fireEvent.change(select, { target: { value: 'quantityNormalized' } });
    const valueInput = screen.getByLabelText('Corrected value') as HTMLInputElement;
    fireEvent.change(valueInput, { target: { value: 'INVALID' } });
    fireEvent.click(screen.getByTestId('review-changes-btn'));
    await waitFor(() => expect(screen.getByTestId('confirm-step')).toBeTruthy());

    await act(async () => {
      fireEvent.click(screen.getByTestId('confirm-apply-btn'));
    });

    await waitFor(() => expect(screen.getByTestId('submit-error')).toBeTruthy());
    expect(screen.getByTestId('submit-error').textContent).toContain('Field not correctable');
  });
});

// ── §15 Escape key closes panel ───────────────────────────────────────────────

describe('§15 Escape key', () => {
  it('calls onClose when Escape is pressed', async () => {
    const { onClose } = renderPanel();
    await waitFor(() => expect(screen.getByTestId('record-identity')).toBeTruthy());
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
