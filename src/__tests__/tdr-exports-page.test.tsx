/**
 * TDR-MVP-EXPORT-INTEGRATION-MEGA-CLOSE-001
 * TDR-EXPORT-RUNTIME-ROWCOUNT-CORRECTION-001
 * TDR-EXPORT-LIMIT-FIX-001
 * TdrExportsPage — simplified export workflow tests.
 *
 * Verifies:
 *  §1  Form renders with scope selector; no legacy batchId input / direction select / row-limit spinbutton
 *  §2  Switching to Specific batch scope shows batch selector
 *  §3  createExport called with no batchId when scope is All accepted records
 *  §4  createExport called with batchId + auto-tradeDirection for Specific batch scope
 *  §5  New job appears in table after creation
 *  §6  PROCESSING (LEASED) status badge renders with correct class
 *  §7  COMPLETED status badge renders; Download button shown
 *  §8  FAILED status badge renders; error message shown
 *  §9  LEASED job triggers polling (getExportStatus called after delay)
 * §10  COMPLETED job does NOT trigger polling
 * §11  Error message shown when createExport rejects
 * §12  Download button calls downloadExport
 * §13  rowCount undefined/null/zero regression — no TypeError on Create Export
 * §14  FAILED with errorCode display
 * §15  Duplicate-click prevention
 * §16  Continuous polling (not one-shot)
 * §17  createExport payload omits rowLimit — backend handles ceiling
 * §18  Batch selector populated from listBatches API
 * §19  Estimate count shown for All accepted records scope
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import React from 'react';

// ── Module mocks ──────────────────────────────────────────────────────────────

vi.mock('@/lib/tdr-api', () => ({
  createExport: vi.fn(),
  getExportStatus: vi.fn(),
  downloadExport: vi.fn(),
  estimateExport: vi.fn(),
  listBatches: vi.fn(),
  getBatch: vi.fn(),
  setAuthCallbacks: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useSearchParams: () => ({ get: () => null }),
}));

vi.mock('@/lib/auth-context', () => ({
  useAuth: () => ({ accessToken: 'test-token' }),
}));

import {
  createExport,
  getExportStatus,
  downloadExport,
  estimateExport,
  listBatches,
  getBatch,
} from '@/lib/tdr-api';
import TdrExportsPage from '@/app/tdr/exports/page';

const mockCreateExport = createExport as ReturnType<typeof vi.fn>;
const mockGetExportStatus = getExportStatus as ReturnType<typeof vi.fn>;
const mockDownloadExport = downloadExport as ReturnType<typeof vi.fn>;
const mockEstimateExport = estimateExport as ReturnType<typeof vi.fn>;
const mockListBatches = listBatches as ReturnType<typeof vi.fn>;
const mockGetBatch = getBatch as ReturnType<typeof vi.fn>;

function mockBatch(override: object = {}) {
  return {
    id: 'batch-001',
    tradeDirection: 'IMPORT',
    standardizedFilename: 'TDR_V1_IMP_2025_01_TEST.csv',
    originalFilename: 'imports_jan_2025.csv',
    status: 'READY',
    acceptedRows: 177_077,
    quarantinedRows: 0,
    rejectedRows: 0,
    processedRows: 177_077,
    totalSourceRows: 177_077,
    sourceFileId: 'sf-001',
    sourceFileArchivedAt: null,
    sourceFileRetentionExpiresAt: null,
    replayOfBatchId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    ...override,
  };
}

function emptyBatchList() {
  return { batches: [], total: 0, page: 1, pageSize: 100, totalPages: 0, hasMore: false };
}

function batchList(batches: object[]) {
  return { batches, total: batches.length, page: 1, pageSize: 100, totalPages: 1, hasMore: false };
}

function pendingJob(override: object = {}) {
  return {
    id: 'job-pending-1',
    status: 'PENDING',
    rowCount: null,
    rowLimit: 1_000_000,
    contentHash: null,
    errorMessage: null,
    createdAt: new Date().toISOString(),
    completedAt: null,
    ...override,
  };
}

function completedJob(override: object = {}) {
  return {
    id: 'job-done-1',
    status: 'COMPLETED',
    rowCount: 16,
    rowLimit: 1_000_000,
    contentHash: 'abc123',
    errorMessage: null,
    createdAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    ...override,
  };
}

function leasedJob(override: object = {}) {
  return { ...pendingJob({ id: 'job-leased-1', status: 'LEASED' }), ...override };
}

function failedJob(override: object = {}) {
  return {
    id: 'job-failed-1',
    status: 'FAILED',
    rowCount: null,
    rowLimit: 1_000_000,
    contentHash: null,
    errorMessage: 'Export limit exceeded',
    createdAt: new Date().toISOString(),
    completedAt: null,
    ...override,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockCreateExport.mockResolvedValue(pendingJob());
  mockGetExportStatus.mockResolvedValue(pendingJob());
  mockDownloadExport.mockResolvedValue(undefined);
  mockEstimateExport.mockResolvedValue({ count: 0 });
  mockListBatches.mockResolvedValue(emptyBatchList());
  mockGetBatch.mockRejectedValue(new Error('not found'));
});

// ── §1 Form renders with simplified UI ───────────────────────────────────────

describe('§1 Form renders simplified UI', () => {
  it('renders scope radio buttons and Create Export; no legacy batchId input, direction select, or row-limit spinbutton', () => {
    render(<TdrExportsPage />);
    // Scope radio options present
    expect(screen.getByRole('radio', { name: /All accepted records/i })).toBeDefined();
    expect(screen.getByRole('radio', { name: /Specific batch/i })).toBeDefined();
    // Create Export button present
    expect(screen.getByRole('button', { name: /Create Export/i })).toBeDefined();
    // Legacy fields absent
    expect(screen.queryByPlaceholderText(/Leave blank/i)).toBeNull();
    expect(screen.queryByTestId('trade-direction-select')).toBeNull();
    expect(screen.queryByRole('spinbutton')).toBeNull();
  });
});

// ── §2 Specific batch scope shows batch selector ──────────────────────────────

describe('§2 Specific batch scope shows batch selector', () => {
  it('shows batch selector dropdown when Specific batch radio is selected', async () => {
    render(<TdrExportsPage />);
    fireEvent.click(screen.getByRole('radio', { name: /Specific batch/i }));
    await waitFor(() => expect(screen.getByTestId('batch-select')).toBeDefined());
  });

  it('Create Export button is disabled when batch scope selected but no batch chosen', async () => {
    render(<TdrExportsPage />);
    fireEvent.click(screen.getByRole('radio', { name: /Specific batch/i }));
    const btn = screen.getByRole('button', { name: /Create Export/i }) as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });
});

// ── §3 createExport — All accepted records (no batchId, no tradeDirection) ───

describe('§3 createExport — All accepted records scope', () => {
  it('calls createExport with no batchId or tradeDirection when scope is All', async () => {
    mockCreateExport.mockResolvedValueOnce(pendingJob());
    render(<TdrExportsPage />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Create Export/i }));
    });
    expect(mockCreateExport).toHaveBeenCalledWith(
      'test-token',
      expect.not.objectContaining({ batchId: expect.anything() }),
    );
    expect(mockCreateExport).toHaveBeenCalledWith(
      'test-token',
      expect.not.objectContaining({ tradeDirection: expect.anything() }),
    );
  });
});

// ── §4 createExport — Specific batch scope auto-includes tradeDirection ───────

describe('§4 createExport — Specific batch scope with auto-direction', () => {
  it('sends batchId and tradeDirection from selected batch automatically', async () => {
    const batch = mockBatch({ id: 'batch-abc', tradeDirection: 'EXPORT', standardizedFilename: 'TDR_V1_EXP_2025_01_TEST.csv' });
    mockListBatches.mockResolvedValueOnce(batchList([batch]));
    mockCreateExport.mockResolvedValueOnce(pendingJob());
    render(<TdrExportsPage />);

    // Switch to batch scope
    fireEvent.click(screen.getByRole('radio', { name: /Specific batch/i }));

    // Wait for batch selector to populate
    await waitFor(() => {
      const select = screen.getByTestId('batch-select') as HTMLSelectElement;
      // Should have the placeholder option + 1 batch option
      expect(select.options.length).toBeGreaterThan(1);
    });

    // Select the batch
    fireEvent.change(screen.getByTestId('batch-select'), { target: { value: 'batch-abc' } });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Create Export/i }));
    });

    expect(mockCreateExport).toHaveBeenCalledWith('test-token', {
      batchId: 'batch-abc',
      tradeDirection: 'EXPORT',
    });
  });
});

// ── §5 Job appears in table ───────────────────────────────────────────────────

describe('§5 Job appears in table after creation', () => {
  it('shows the new job ID prefix in the table', async () => {
    const job = pendingJob({ id: 'aaaa-bbbb-cccc' });
    mockCreateExport.mockResolvedValueOnce(job);
    render(<TdrExportsPage />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Create Export/i }));
    });
    await waitFor(() => expect(screen.getByText(/aaaa-bbb/i)).toBeDefined());
  });
});

// ── §6 PROCESSING (LEASED) status badge ──────────────────────────────────────

describe('§6 PROCESSING badge for LEASED job', () => {
  it('renders PROCESSING badge for a leased job with blue styling', async () => {
    const job = leasedJob();
    mockCreateExport.mockResolvedValueOnce(job);
    render(<TdrExportsPage />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Create Export/i }));
    });
    await waitFor(() => {
      const badge = screen.getByText('PROCESSING');
      expect(badge).toBeDefined();
      expect(badge.className).toContain('blue');
    });
  });
});

// ── §7 COMPLETED badge + Download button ──────────────────────────────────────

describe('§7 COMPLETED job shows download button', () => {
  it('renders Download CSV button for a completed job', async () => {
    const job = completedJob();
    mockCreateExport.mockResolvedValueOnce(job);
    render(<TdrExportsPage />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Create Export/i }));
    });
    await waitFor(() => expect(screen.getByText(/Download CSV/i)).toBeDefined());
    await waitFor(() => expect(screen.getByText('COMPLETED')).toBeDefined());
  });
});

// ── §8 FAILED badge + error message ──────────────────────────────────────────

describe('§8 FAILED job shows error', () => {
  it('renders FAILED badge and error message text', async () => {
    const job = failedJob();
    mockCreateExport.mockResolvedValueOnce(job);
    render(<TdrExportsPage />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Create Export/i }));
    });
    await waitFor(() => expect(screen.getByText('FAILED')).toBeDefined());
    await waitFor(() => expect(screen.getByText(/Export limit exceeded/i)).toBeDefined());
  });
});

// ── §9 LEASED job triggers polling ────────────────────────────────────────────

describe('§9 LEASED job triggers polling', () => {
  afterEach(() => vi.useRealTimers());

  it('calls getExportStatus after 3 seconds for a LEASED job', async () => {
    vi.useFakeTimers();
    const job = leasedJob();
    mockCreateExport.mockResolvedValueOnce(job);
    mockGetExportStatus.mockResolvedValue(job);
    render(<TdrExportsPage />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Create Export/i }));
    });
    await act(async () => {
      vi.advanceTimersByTime(3100);
    });
    expect(mockGetExportStatus).toHaveBeenCalledWith('test-token', 'job-leased-1');
  });
});

// ── §10 COMPLETED job does not trigger polling ────────────────────────────────

describe('§10 COMPLETED job stops polling', () => {
  afterEach(() => vi.useRealTimers());

  it('does not call getExportStatus for a completed job', async () => {
    vi.useFakeTimers();
    const job = completedJob();
    mockCreateExport.mockResolvedValueOnce(job);
    render(<TdrExportsPage />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Create Export/i }));
    });
    await act(async () => {
      vi.advanceTimersByTime(3100);
    });
    expect(mockGetExportStatus).not.toHaveBeenCalled();
  });
});

// ── §11 Error message on createExport failure ─────────────────────────────────

describe('§11 Error shown on createExport failure', () => {
  it('displays error message when createExport rejects', async () => {
    mockCreateExport.mockRejectedValueOnce({ message: 'Not authorized to create exports' });
    render(<TdrExportsPage />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Create Export/i }));
    });
    await waitFor(() => expect(screen.getByText(/Not authorized to create exports/i)).toBeDefined());
  });
});

// ── §12 Download button calls downloadExport ──────────────────────────────────

describe('§12 Download button triggers download', () => {
  it('calls downloadExport with correct token and jobId on click', async () => {
    const job = completedJob({ id: 'job-dl-001' });
    mockCreateExport.mockResolvedValueOnce(job);
    render(<TdrExportsPage />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Create Export/i }));
    });
    await waitFor(() => screen.getByText(/Download CSV/i));
    await act(async () => {
      fireEvent.click(screen.getByText(/Download CSV/i));
    });
    expect(mockDownloadExport).toHaveBeenCalledWith('test-token', 'job-dl-001');
  });
});

// ── §13 rowCount undefined/null/zero regression ───────────────────────────────
// TDR-EXPORT-RUNTIME-ROWCOUNT-CORRECTION-001

describe('§13 rowCount undefined/null/zero regression', () => {
  it('§13.1 freshly-created PENDING job with rowCount=undefined does not crash', async () => {
    const fresh = { ...pendingJob(), rowCount: undefined };
    mockCreateExport.mockResolvedValueOnce(fresh);
    render(<TdrExportsPage />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Create Export/i }));
    });
    await waitFor(() => expect(screen.getByText('QUEUED')).toBeDefined());
    expect(screen.getAllByText(/—/).length).toBeGreaterThan(0);
  });

  it('§13.2 PENDING job with rowCount=null does not crash', async () => {
    const job = pendingJob({ rowCount: null });
    mockCreateExport.mockResolvedValueOnce(job);
    render(<TdrExportsPage />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Create Export/i }));
    });
    await waitFor(() => expect(screen.getByText('QUEUED')).toBeDefined());
    expect(screen.getAllByText(/—/).length).toBeGreaterThan(0);
  });

  it('§13.3 COMPLETED job with numeric rowCount renders formatted value', async () => {
    const job = completedJob({ rowCount: 16 });
    mockCreateExport.mockResolvedValueOnce(job);
    render(<TdrExportsPage />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Create Export/i }));
    });
    await waitFor(() => {
      const tds = Array.from(document.querySelectorAll('td'));
      expect(tds.some((td) => td.textContent?.trim() === '16')).toBe(true);
    });
  });

  it('§13.4 rowCount=0 renders "0" not dash', async () => {
    const job = completedJob({ rowCount: 0 });
    mockCreateExport.mockResolvedValueOnce(job);
    render(<TdrExportsPage />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Create Export/i }));
    });
    await waitFor(() => {
      const tds = Array.from(document.querySelectorAll('td'));
      expect(tds.some((td) => td.textContent?.trim() === '0')).toBe(true);
    });
  });

  it('§13.5 rowLimit is not shown — backend limit not exposed to users', async () => {
    const job = { ...pendingJob(), rowCount: undefined, rowLimit: 50_000 };
    mockCreateExport.mockResolvedValueOnce(job);
    render(<TdrExportsPage />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Create Export/i }));
    });
    await waitFor(() => expect(screen.getByText('QUEUED')).toBeDefined());
    // rowLimit must not be visible — backend ceiling is not exposed to users
    expect(screen.queryByText(/50,000 limit/i)).toBeNull();
  });

  it('§13.6 Create Export → immediate render does not throw', async () => {
    const fresh = { id: 'rc-001', status: 'PENDING', rowCount: undefined, rowLimit: 1_000_000, createdAt: new Date().toISOString() };
    mockCreateExport.mockResolvedValueOnce(fresh);
    expect(() => {
      render(<TdrExportsPage />);
    }).not.toThrow();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Create Export/i }));
    });
    await waitFor(() => expect(screen.getByText('QUEUED')).toBeDefined());
  });

  it('§13.7 LEASED job with undefined rowCount renders safely as PROCESSING', async () => {
    const job = { ...leasedJob(), rowCount: undefined };
    mockCreateExport.mockResolvedValueOnce(job);
    render(<TdrExportsPage />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Create Export/i }));
    });
    await waitFor(() => expect(screen.getByText('PROCESSING')).toBeDefined());
    expect(screen.getAllByText(/—/).length).toBeGreaterThan(0);
  });

  it('§13.8 FAILED job still renders after fix', async () => {
    const job = failedJob();
    mockCreateExport.mockResolvedValueOnce(job);
    render(<TdrExportsPage />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Create Export/i }));
    });
    await waitFor(() => expect(screen.getByText('FAILED')).toBeDefined());
    await waitFor(() => expect(screen.getByText(/Export limit exceeded/i)).toBeDefined());
  });
});

// ── §14 FAILED with errorCode display ────────────────────────────────────────

describe('§14 FAILED status shows errorCode and errorMessage', () => {
  it('renders [ERROR_CODE] prefix when errorCode is present', async () => {
    const job = failedJob({ errorCode: 'EXPORT_LIMIT_EXCEEDED', errorMessage: 'Too many rows' });
    mockCreateExport.mockResolvedValueOnce(job);
    render(<TdrExportsPage />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Create Export/i }));
    });
    await waitFor(() => {
      const failedCell = screen.getByText(/EXPORT_LIMIT_EXCEEDED/);
      expect(failedCell).toBeDefined();
    });
    await waitFor(() => expect(screen.getByText(/Too many rows/i)).toBeDefined());
  });

  it('renders errorMessage without prefix when errorCode is absent', async () => {
    const job = failedJob({ errorCode: null, errorMessage: 'Internal error' });
    mockCreateExport.mockResolvedValueOnce(job);
    render(<TdrExportsPage />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Create Export/i }));
    });
    await waitFor(() => expect(screen.getByText('Internal error')).toBeDefined());
  });

  it('renders "Failed" fallback when both errorCode and errorMessage are absent', async () => {
    const job = failedJob({ errorCode: null, errorMessage: null });
    mockCreateExport.mockResolvedValueOnce(job);
    render(<TdrExportsPage />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Create Export/i }));
    });
    await waitFor(() => expect(screen.getByText('Failed')).toBeDefined());
  });
});

// ── §15 Duplicate-click prevention ───────────────────────────────────────────

describe('§15 Duplicate-click prevention', () => {
  it('disables Create Export button while submission is in flight', async () => {
    let resolveFn!: (v: object) => void;
    mockCreateExport.mockReturnValueOnce(new Promise((r) => { resolveFn = r; }));
    render(<TdrExportsPage />);
    const btn = screen.getByRole('button', { name: /Create Export/i }) as HTMLButtonElement;
    expect(btn.disabled).toBe(false);

    fireEvent.click(btn);
    await waitFor(() => expect(btn.disabled).toBe(true));

    await act(async () => { resolveFn(pendingJob()); });
    await waitFor(() => expect(btn.disabled).toBe(false));
  });

  it('createExport is called exactly once even if button is clicked twice rapidly', async () => {
    mockCreateExport.mockResolvedValue(pendingJob());
    render(<TdrExportsPage />);
    const btn = screen.getByRole('button', { name: /Create Export/i });
    await act(async () => {
      fireEvent.click(btn);
      fireEvent.click(btn);
    });
    expect(mockCreateExport).toHaveBeenCalledTimes(1);
  });
});

// ── §16 Continuous polling (not one-shot) ────────────────────────────────────

describe('§16 Continuous polling for active jobs', () => {
  afterEach(() => vi.useRealTimers());

  it('polls multiple times while status stays PENDING', async () => {
    vi.useFakeTimers();
    const job = pendingJob();
    mockCreateExport.mockResolvedValueOnce(job);
    mockGetExportStatus.mockResolvedValue(job);
    render(<TdrExportsPage />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Create Export/i }));
    });
    await act(async () => { vi.advanceTimersByTime(9100); });
    expect(mockGetExportStatus.mock.calls.length).toBeGreaterThanOrEqual(3);
  });

  it('stops polling once job reaches COMPLETED', async () => {
    vi.useFakeTimers();
    const job = leasedJob();
    const done = completedJob({ id: job.id });
    mockCreateExport.mockResolvedValueOnce(job);
    mockGetExportStatus.mockResolvedValueOnce(done);
    mockGetExportStatus.mockResolvedValue(done);
    render(<TdrExportsPage />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Create Export/i }));
    });
    await act(async () => { vi.advanceTimersByTime(3100); });
    const callsAfterFirst = mockGetExportStatus.mock.calls.length;
    await act(async () => { vi.advanceTimersByTime(6100); });
    expect(mockGetExportStatus.mock.calls.length).toBe(callsAfterFirst);
  });
});

// ── §17 Export uses backend default row limit (no rowLimit in payload) ────────

describe('§17 Export payload omits rowLimit — backend handles ceiling', () => {
  it('createExport payload has no rowLimit field (backend defaults to MAX)', async () => {
    mockCreateExport.mockResolvedValueOnce(pendingJob());
    render(<TdrExportsPage />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Create Export/i }));
    });
    expect(mockCreateExport).toHaveBeenCalledWith(
      'test-token',
      expect.not.objectContaining({ rowLimit: expect.anything() }),
    );
  });

  it('no row-limit spinbutton is rendered (field removed from UI)', () => {
    render(<TdrExportsPage />);
    expect(screen.queryByRole('spinbutton')).toBeNull();
  });
});

// ── §18 Batch selector populated from listBatches ────────────────────────────

describe('§18 Batch selector populated from listBatches API', () => {
  it('shows batch options in the selector after batches load', async () => {
    const batch = mockBatch({ id: 'batch-load-test', standardizedFilename: 'TDR_V1_EXP_2025_03_TEST.csv' });
    mockListBatches.mockResolvedValueOnce(batchList([batch]));
    render(<TdrExportsPage />);
    fireEvent.click(screen.getByRole('radio', { name: /Specific batch/i }));
    await waitFor(() => {
      const select = screen.getByTestId('batch-select') as HTMLSelectElement;
      const options = Array.from(select.options).map((o) => o.value);
      expect(options).toContain('batch-load-test');
    });
  });

  it('batch label includes standardized filename and trade direction', async () => {
    const batch = mockBatch({ id: 'batch-label-test', tradeDirection: 'EXPORT', standardizedFilename: 'TDR_V1_EXP_2025_03_TEST.csv' });
    mockListBatches.mockResolvedValueOnce(batchList([batch]));
    render(<TdrExportsPage />);
    fireEvent.click(screen.getByRole('radio', { name: /Specific batch/i }));
    await waitFor(() => {
      const select = screen.getByTestId('batch-select') as HTMLSelectElement;
      const labelText = Array.from(select.options)
        .map((o) => o.text)
        .find((t) => t.includes('TDR_V1_EXP'));
      expect(labelText).toBeDefined();
      expect(labelText).toContain('EXPORT');
    });
  });
});

// ── §19 Estimate count shown for All accepted records scope ───────────────────

describe('§19 Estimate count displayed for All accepted records scope', () => {
  it('shows estimated record count when scope is All accepted records', async () => {
    mockEstimateExport.mockResolvedValueOnce({ count: 177_077 });
    render(<TdrExportsPage />);
    // Default scope is 'all' — estimate should load automatically
    await waitFor(() => {
      expect(screen.getByText(/177,077 accepted records ready to export/i)).toBeDefined();
    });
  });

  it('calls estimateExport with no batchId for All accepted records scope', async () => {
    render(<TdrExportsPage />);
    await waitFor(() => expect(mockEstimateExport).toHaveBeenCalled());
    expect(mockEstimateExport).toHaveBeenCalledWith('test-token', {});
  });
});
