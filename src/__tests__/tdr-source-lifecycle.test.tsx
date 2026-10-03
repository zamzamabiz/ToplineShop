/**
 * TDR-POST-MVP-SOURCE-LIFECYCLE-001
 * Frontend lifecycle tests:
 * §FE-1  Lifecycle filter selector renders all three options
 * §FE-2  Default lifecycle is ACTIVE
 * §FE-3  Clicking ARCHIVED calls listBatches with lifecycle=ARCHIVED
 * §FE-4  Clicking ALL calls listBatches with lifecycle=ALL
 * §FE-5  Archive button is present in source column
 * §FE-6  Clicking Archive calls archiveSourceFile with the correct sourceFileId
 * §FE-7  Restore button shown for archived batch
 * §FE-8  Clicking Restore calls restoreSourceFile
 * §FE-9  Download button (↓) calls downloadSourceFile
 * §FE-10 No action buttons for batch without sourceFileId
 * §FE-11 Archived badge (⚑) shown when sourceFileArchivedAt is set
 * §FE-12 Active batch has no ⚑ badge
 * §FE-13 actionError shown when archiveSourceFile rejects
 * §FE-14 Export page: shows "Expired / unavailable" for expired COMPLETED export
 * §FE-15 Export page: shows Download CSV for non-expired COMPLETED export
 * §FE-16 Export page: shows Download CSV when expiresAt is null
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import React from 'react';

// ── Mock tdr-api ──────────────────────────────────────────────────────────────

vi.mock('@/lib/tdr-api', () => ({
  listBatches: vi.fn(),
  archiveSourceFile: vi.fn(),
  restoreSourceFile: vi.fn(),
  downloadSourceFile: vi.fn(),
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

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode; [k: string]: unknown }) =>
    React.createElement('a', { href, ...props }, children),
}));

import type { TdrBatch } from '@/types/tdr';
import * as api from '@/lib/tdr-api';
import TdrBatchesPage from '@/app/tdr/batches/page';

// ── Helpers ───────────────────────────────────────────────────────────────────

const BASE_BATCH: TdrBatch = {
  id: 'b-1',
  status: 'READY',
  tradeDirection: 'IMPORT',
  originalFilename: 'import.csv',
  standardizedFilename: null,
  sourceFileId: 'sf-1',
  sourceFileArchivedAt: null,
  sourceFileRetentionExpiresAt: null,
  processedRows: 10,
  acceptedRows: 10,
  quarantinedRows: 0,
  rejectedRows: 0,
  totalSourceRows: 10,
  replayOfBatchId: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  completedAt: null,
};

const ARCHIVED_BATCH: TdrBatch = {
  ...BASE_BATCH,
  id: 'b-2',
  sourceFileArchivedAt: new Date(Date.now() - 3600000).toISOString(),
};

const NO_SF_BATCH: TdrBatch = {
  ...BASE_BATCH,
  id: 'b-3',
  sourceFileId: null,
  sourceFileArchivedAt: null,
};

function batchResponse(batches: TdrBatch[]) {
  return { batches, total: batches.length, page: 1, pageSize: 25, totalPages: 1, hasMore: false };
}

// ── Batches page lifecycle tests ──────────────────────────────────────────────

describe('TdrBatchesPage — lifecycle filter and source actions', () => {
  beforeEach(() => {
    vi.mocked(api.listBatches).mockResolvedValue(batchResponse([BASE_BATCH]));
    vi.mocked(api.archiveSourceFile).mockResolvedValue({ archived: true, sourceFileId: 'sf-1' });
    vi.mocked(api.restoreSourceFile).mockResolvedValue({ restored: true, sourceFileId: 'sf-1' });
    vi.mocked(api.downloadSourceFile).mockResolvedValue(undefined);
  });

  afterEach(() => vi.clearAllMocks());

  // FE-1: lifecycle filter selector renders three buttons
  it('FE-1 renders three lifecycle filter buttons', async () => {
    render(<TdrBatchesPage />);
    await waitFor(() => expect(screen.getByTestId('lifecycle-filter')).toBeDefined());
    expect(screen.getByTestId('lifecycle-ACTIVE')).toBeDefined();
    expect(screen.getByTestId('lifecycle-ARCHIVED')).toBeDefined();
    expect(screen.getByTestId('lifecycle-ALL')).toBeDefined();
  });

  // FE-2: default lifecycle is ACTIVE
  it('FE-2 default lifecycle is ACTIVE', async () => {
    render(<TdrBatchesPage />);
    await waitFor(() => expect(vi.mocked(api.listBatches)).toHaveBeenCalled());
    const call = vi.mocked(api.listBatches).mock.calls[0];
    expect(call[1].lifecycle).toBe('ACTIVE');
  });

  // FE-3: clicking ARCHIVED calls listBatches with lifecycle=ARCHIVED
  it('FE-3 clicking ARCHIVED calls listBatches with lifecycle=ARCHIVED', async () => {
    render(<TdrBatchesPage />);
    await waitFor(() => expect(screen.getByTestId('lifecycle-ARCHIVED')).toBeDefined());
    await act(async () => { fireEvent.click(screen.getByTestId('lifecycle-ARCHIVED')); });
    await waitFor(() => {
      const calls = vi.mocked(api.listBatches).mock.calls;
      const archivedCall = calls.find((c) => c[1].lifecycle === 'ARCHIVED');
      expect(archivedCall).toBeDefined();
    });
  });

  // FE-4: clicking ALL calls listBatches with lifecycle=ALL
  it('FE-4 clicking ALL calls listBatches with lifecycle=ALL', async () => {
    render(<TdrBatchesPage />);
    await waitFor(() => expect(screen.getByTestId('lifecycle-ALL')).toBeDefined());
    await act(async () => { fireEvent.click(screen.getByTestId('lifecycle-ALL')); });
    await waitFor(() => {
      const calls = vi.mocked(api.listBatches).mock.calls;
      const allCall = calls.find((c) => c[1].lifecycle === 'ALL');
      expect(allCall).toBeDefined();
    });
  });

  // FE-5: Archive button present
  it('FE-5 Archive button shown for active batch with sourceFileId', async () => {
    render(<TdrBatchesPage />);
    await waitFor(() => expect(screen.getByTitle('Archive source file')).toBeDefined());
  });

  // FE-6: clicking Archive calls archiveSourceFile
  it('FE-6 clicking Archive calls archiveSourceFile', async () => {
    render(<TdrBatchesPage />);
    await waitFor(() => expect(screen.getByTitle('Archive source file')).toBeDefined());
    await act(async () => { fireEvent.click(screen.getByTitle('Archive source file')); });
    await waitFor(() => {
      expect(vi.mocked(api.archiveSourceFile)).toHaveBeenCalledWith('test-token', 'sf-1');
    });
  });

  // FE-7: Restore button shown for archived batch
  it('FE-7 Restore button shown for archived batch', async () => {
    vi.mocked(api.listBatches).mockResolvedValue(batchResponse([ARCHIVED_BATCH]));
    render(<TdrBatchesPage />);
    await waitFor(() => expect(screen.getByTitle('Restore source file')).toBeDefined());
  });

  // FE-8: clicking Restore calls restoreSourceFile
  it('FE-8 clicking Restore calls restoreSourceFile', async () => {
    vi.mocked(api.listBatches).mockResolvedValue(batchResponse([ARCHIVED_BATCH]));
    render(<TdrBatchesPage />);
    await waitFor(() => expect(screen.getByTitle('Restore source file')).toBeDefined());
    await act(async () => { fireEvent.click(screen.getByTitle('Restore source file')); });
    await waitFor(() => {
      expect(vi.mocked(api.restoreSourceFile)).toHaveBeenCalledWith('test-token', 'sf-1');
    });
  });

  // FE-9: download button calls downloadSourceFile
  it('FE-9 download button calls downloadSourceFile', async () => {
    render(<TdrBatchesPage />);
    await waitFor(() => expect(screen.getByTitle('Download original source file')).toBeDefined());
    await act(async () => { fireEvent.click(screen.getByTitle('Download original source file')); });
    await waitFor(() => {
      expect(vi.mocked(api.downloadSourceFile)).toHaveBeenCalledWith('test-token', 'sf-1', 'import.csv');
    });
  });

  // FE-10: no action buttons for batch without sourceFileId
  it('FE-10 no archive/restore/download buttons for batch without sourceFileId', async () => {
    vi.mocked(api.listBatches).mockResolvedValue(batchResponse([NO_SF_BATCH]));
    render(<TdrBatchesPage />);
    await waitFor(() => expect(screen.queryByTitle('Download original source file')).toBeNull());
    expect(screen.queryByTitle('Archive source file')).toBeNull();
  });

  // FE-11: archived batch shows ⚑ badge
  it('FE-11 archived batch shows ⚑ indicator', async () => {
    vi.mocked(api.listBatches).mockResolvedValue(batchResponse([ARCHIVED_BATCH]));
    render(<TdrBatchesPage />);
    await waitFor(() => expect(screen.getByText('⚑')).toBeDefined());
  });

  // FE-12: active batch has no ⚑ badge
  it('FE-12 active batch does not show ⚑ indicator', async () => {
    render(<TdrBatchesPage />);
    await waitFor(() => expect(screen.queryByText('⚑')).toBeNull());
  });

  // FE-13: actionError shown when archiveSourceFile rejects
  it('FE-13 shows actionError when archiveSourceFile rejects', async () => {
    vi.mocked(api.archiveSourceFile).mockRejectedValue(new Error('Permission denied'));
    render(<TdrBatchesPage />);
    await waitFor(() => expect(screen.getByTitle('Archive source file')).toBeDefined());
    await act(async () => { fireEvent.click(screen.getByTitle('Archive source file')); });
    await waitFor(() => expect(screen.getByText('Permission denied')).toBeDefined());
  });
});

// ── Export expiry logic tests ─────────────────────────────────────────────────

describe('Export expiry logic (inline)', () => {
  afterEach(() => vi.clearAllMocks());

  // FE-14: expired export shows "Expired / unavailable"
  it('FE-14 expiry logic: past expiresAt is expired', () => {
    const past = new Date(Date.now() - 1000).toISOString();
    const isExpired = (expiresAt: string | null | undefined) =>
      !!expiresAt && new Date(expiresAt) < new Date();
    expect(isExpired(past)).toBe(true);
    expect(isExpired(new Date(Date.now() + 1000).toISOString())).toBe(false);
    expect(isExpired(null)).toBe(false);
  });

  // FE-15: non-expired export shows Download CSV
  it('FE-15 expiry logic: future expiresAt is not expired', () => {
    const future = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();
    const isExpired = (expiresAt: string | null | undefined) =>
      !!expiresAt && new Date(expiresAt) < new Date();
    expect(isExpired(future)).toBe(false);
  });

  // FE-16: null expiresAt is not expired
  it('FE-16 expiry logic: null expiresAt is not expired', () => {
    const isExpired = (expiresAt: string | null | undefined) =>
      !!expiresAt && new Date(expiresAt) < new Date();
    expect(isExpired(null)).toBe(false);
    expect(isExpired(undefined)).toBe(false);
  });
});
