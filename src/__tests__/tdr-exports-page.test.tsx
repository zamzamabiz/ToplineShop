/**
 * TDR-MVP-EXPORT-INTEGRATION-MEGA-CLOSE-001
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
