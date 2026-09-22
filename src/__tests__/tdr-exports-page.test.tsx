/**
 * TDR-MVP-EXPORT-INTEGRATION-MEGA-CLOSE-001
 * TDR-EXPORT-RUNTIME-ROWCOUNT-CORRECTION-001
 * TdrExportsPage — export workflow tests.
 *
 * Verifies:
 *  §1  Loading form renders (batchId, tradeDirection, rowLimit, submit button)
 *  §2  tradeDirection select has correct options (All/IMPORT/EXPORT)
 *  §3  createExport called with correct args on form submit (no direction)
 *  §4  createExport called with tradeDirection when selected
 *  §5  New job appears in table after creation
 *  §6  LEASED status badge renders with correct class (not missing/fallback)
 *  §7  COMPLETED status badge renders; Download button shown
 *  §8  FAILED status badge renders; error message shown
 *  §9  LEASED job triggers polling (getExportStatus called after delay)
 * §10  COMPLETED job does NOT trigger polling
 * §11  Error message shown when createExport rejects
 * §12  Download button calls downloadExport
 * §13  rowCount undefined/null/zero regression — no TypeError on Create Export
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import React from 'react';

// ── Module mocks ──────────────────────────────────────────────────────────────

vi.mock('@/lib/tdr-api', () => ({
  createExport: vi.fn(),
  getExportStatus: vi.fn(),
  downloadExport: vi.fn(),
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
} from '@/lib/tdr-api';
import TdrExportsPage from '@/app/tdr/exports/page';

const mockCreateExport = createExport as ReturnType<typeof vi.fn>;
const mockGetExportStatus = getExportStatus as ReturnType<typeof vi.fn>;
const mockDownloadExport = downloadExport as ReturnType<typeof vi.fn>;

function pendingJob(override: object = {}) {
  return {
    id: 'job-pending-1',
    status: 'PENDING',
    rowCount: null,
    rowLimit: 100_000,
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
    rowLimit: 100_000,
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
    rowLimit: 100_000,
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
});

// ── §1 Form renders ───────────────────────────────────────────────────────────

describe('§1 Form renders', () => {
  it('renders batch ID input, direction select, row limit input and submit button', () => {
    render(<TdrExportsPage />);
    expect(screen.getByPlaceholderText(/Leave blank/i)).toBeDefined();
    expect(screen.getByTestId('trade-direction-select')).toBeDefined();
    expect(screen.getByRole('spinbutton')).toBeDefined();
    expect(screen.getByRole('button', { name: /Create Export/i })).toBeDefined();
  });
});

// ── §2 tradeDirection select options ─────────────────────────────────────────

describe('§2 tradeDirection select options', () => {
  it('has All directions, IMPORT, and EXPORT options', () => {
    render(<TdrExportsPage />);
    const select = screen.getByTestId('trade-direction-select') as HTMLSelectElement;
    const options = Array.from(select.options).map((o) => o.value);
    expect(options).toContain('');
    expect(options).toContain('IMPORT');
    expect(options).toContain('EXPORT');
  });
});

// ── §3 createExport called without direction ──────────────────────────────────

describe('§3 createExport — no direction', () => {
  it('calls createExport with batchId and rowLimit only when direction is "All"', async () => {
    mockCreateExport.mockResolvedValueOnce(pendingJob());
    render(<TdrExportsPage />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Create Export/i }));
    });
    expect(mockCreateExport).toHaveBeenCalledWith(
      'test-token',
      expect.not.objectContaining({ tradeDirection: expect.anything() }),
    );
  });
});

// ── §4 createExport called with tradeDirection ────────────────────────────────

describe('§4 createExport — with direction', () => {
  it('includes tradeDirection=IMPORT in the request when selected', async () => {
    mockCreateExport.mockResolvedValueOnce(pendingJob());
    render(<TdrExportsPage />);
    fireEvent.change(screen.getByTestId('trade-direction-select'), { target: { value: 'IMPORT' } });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Create Export/i }));
    });
    expect(mockCreateExport).toHaveBeenCalledWith(
      'test-token',
      expect.objectContaining({ tradeDirection: 'IMPORT' }),
    );
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

// ── §6 LEASED status badge ────────────────────────────────────────────────────

describe('§6 LEASED status badge', () => {
  it('renders LEASED badge for a leased job', async () => {
    const job = leasedJob();
    mockCreateExport.mockResolvedValueOnce(job);
    render(<TdrExportsPage />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Create Export/i }));
    });
    await waitFor(() => {
      const badge = screen.getByText('LEASED');
      expect(badge).toBeDefined();
      // Must have themed class (not the fallback gray)
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
// Owner-observed: Create Export → TypeError: Cannot read properties of undefined
// Root cause: createExport API response omits rowCount (undefined), !==null guard passes → crash.

describe('§13 rowCount undefined/null/zero regression', () => {
  it('§13.1 freshly-created PENDING job with rowCount=undefined does not crash', async () => {
    // Simulates exact owner crash: createExport returns rowCount absent (undefined)
    const fresh = { ...pendingJob(), rowCount: undefined };
    mockCreateExport.mockResolvedValueOnce(fresh);
    render(<TdrExportsPage />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Create Export/i }));
    });
    await waitFor(() => expect(screen.getByText('PENDING')).toBeDefined());
    // Dash rendered for unavailable rowCount
    expect(screen.getAllByText(/—/).length).toBeGreaterThan(0);
  });

  it('§13.2 PENDING job with rowCount=null does not crash', async () => {
    const job = pendingJob({ rowCount: null });
    mockCreateExport.mockResolvedValueOnce(job);
    render(<TdrExportsPage />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Create Export/i }));
    });
    await waitFor(() => expect(screen.getByText('PENDING')).toBeDefined());
    expect(screen.getAllByText(/—/).length).toBeGreaterThan(0);
  });

  it('§13.3 COMPLETED job with numeric rowCount renders formatted value', async () => {
    const job = completedJob({ rowCount: 16 });
    mockCreateExport.mockResolvedValueOnce(job);
    render(<TdrExportsPage />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Create Export/i }));
    });
    // rowCount=16 appears in "16 / 100,000 limit" cell — no dash for available count
    await waitFor(() => {
      const tds = Array.from(document.querySelectorAll('td'));
      expect(tds.some((td) => /^\d+ \/ \d/.test(td.textContent?.trim() ?? ''))).toBe(true);
    });
  });

  it('§13.4 rowCount=0 renders "0" not dash', async () => {
    const job = completedJob({ rowCount: 0 });
    mockCreateExport.mockResolvedValueOnce(job);
    render(<TdrExportsPage />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Create Export/i }));
    });
    // rowCount=0 must render "0 / ..." not "—" (blank≠zero)
    await waitFor(() => {
      const tds = Array.from(document.querySelectorAll('td'));
      expect(tds.some((td) => td.textContent?.trim().startsWith('0 /'))).toBe(true);
    });
  });

  it('§13.5 rowLimit renders correctly from createExport response', async () => {
    const job = { ...pendingJob(), rowCount: undefined, rowLimit: 50_000 };
    mockCreateExport.mockResolvedValueOnce(job);
    render(<TdrExportsPage />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Create Export/i }));
    });
    await waitFor(() => expect(screen.getByText(/50,000 limit/i)).toBeDefined());
  });

  it('§13.6 Create Export → immediate render does not throw', async () => {
    // Reproduces the exact owner sequence: click Create Export, job appears immediately
    const fresh = { id: 'rc-001', status: 'PENDING', rowCount: undefined, rowLimit: 100_000, createdAt: new Date().toISOString() };
    mockCreateExport.mockResolvedValueOnce(fresh);
    expect(() => {
      render(<TdrExportsPage />);
    }).not.toThrow();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Create Export/i }));
    });
    // No unhandled exception — job row renders
    await waitFor(() => expect(screen.getByText('PENDING')).toBeDefined());
  });

  it('§13.7 LEASED job with undefined rowCount renders safely', async () => {
    const job = { ...leasedJob(), rowCount: undefined };
    mockCreateExport.mockResolvedValueOnce(job);
    render(<TdrExportsPage />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Create Export/i }));
    });
    await waitFor(() => expect(screen.getByText('LEASED')).toBeDefined());
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
    // After click, button should be disabled while request is in flight
    await waitFor(() => expect(btn.disabled).toBe(true));

    // Resolve the promise to finish
    await act(async () => { resolveFn(pendingJob()); });
    await waitFor(() => expect(btn.disabled).toBe(false));
  });

  it('createExport is called exactly once even if button is clicked twice rapidly', async () => {
    mockCreateExport.mockResolvedValue(pendingJob());
    render(<TdrExportsPage />);
    const btn = screen.getByRole('button', { name: /Create Export/i });
    await act(async () => {
      fireEvent.click(btn);
      fireEvent.click(btn);  // Second click before state update
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
    mockGetExportStatus.mockResolvedValue(job);  // Always returns PENDING
    render(<TdrExportsPage />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Create Export/i }));
    });
    // Advance 9 seconds → 3 poll cycles (at 3s, 6s, 9s)
    await act(async () => { vi.advanceTimersByTime(9100); });
    expect(mockGetExportStatus.mock.calls.length).toBeGreaterThanOrEqual(3);
  });

  it('stops polling once job reaches COMPLETED', async () => {
    vi.useFakeTimers();
    const job = leasedJob();
    const done = completedJob({ id: job.id });
    mockCreateExport.mockResolvedValueOnce(job);
    mockGetExportStatus.mockResolvedValueOnce(done);  // First poll → COMPLETED
    mockGetExportStatus.mockResolvedValue(done);
    render(<TdrExportsPage />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Create Export/i }));
    });
    await act(async () => { vi.advanceTimersByTime(3100); });
    const callsAfterFirst = mockGetExportStatus.mock.calls.length;
    await act(async () => { vi.advanceTimersByTime(6100); });
    // Should not poll again after reaching COMPLETED
    expect(mockGetExportStatus.mock.calls.length).toBe(callsAfterFirst);
  });
});

// ── §17 rowLimit=100 sample export ───────────────────────────────────────────

describe('§17 Sample export — rowLimit=100', () => {
  it('creates export with rowLimit=100 when input is set to 100', async () => {
    mockCreateExport.mockResolvedValueOnce(pendingJob({ rowLimit: 100 }));
    render(<TdrExportsPage />);
    const limitInput = screen.getByRole('spinbutton') as HTMLInputElement;
    fireEvent.change(limitInput, { target: { value: '100' } });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Create Export/i }));
    });
    expect(mockCreateExport).toHaveBeenCalledWith(
      'test-token',
      expect.objectContaining({ rowLimit: 100 }),
    );
  });

  it('row limit input accepts values up to 1,000,000', () => {
    render(<TdrExportsPage />);
    const input = screen.getByRole('spinbutton') as HTMLInputElement;
    expect(Number(input.max)).toBe(1_000_000);
  });
});
