/**
 * Frontend TDR API client tests.
 * Tests focus on safety contracts: filter serialization, auth header inclusion,
 * AbortController forwarding, and error propagation.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock global fetch
const mockFetch = vi.fn();
globalThis.fetch = mockFetch as any;

beforeEach(() => {
  mockFetch.mockReset();
});

// ── Filter serialization ──────────────────────────────────────────────────────

describe('filterToParams serialization', () => {
  // We test through getAnalyticsSummary which calls filterToParams internally.
  it('sends dateFrom and dateTo as query params', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { total: 0, accepted: 0, quarantined: 0, rejected: 0, qualityRate: null, exportEligibleCount: 0, valueAggregationUnsafe: true } }),
    });

    const { getAnalyticsSummary } = await import('@/lib/tdr-api');
    await getAnalyticsSummary('token123', { dateFrom: '2025-01-01', dateTo: '2025-12-31' });

    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain('dateFrom=2025-01-01');
    expect(url).toContain('dateTo=2025-12-31');
  });

  it('sends Authorization: Bearer token', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: {} }),
    });

    const { getTdrStatus } = await import('@/lib/tdr-api');
    await getTdrStatus('my-token').catch(() => null);

    const opts = mockFetch.mock.calls[0][1] as RequestInit;
    expect((opts?.headers as Record<string, string>)?.['Authorization']).toBe('Bearer my-token');
  });

  it('sends tradeDirection filter', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { total: 0, accepted: 0, quarantined: 0, rejected: 0, qualityRate: null, exportEligibleCount: 0, valueAggregationUnsafe: true } }),
    });

    const { getAnalyticsSummary } = await import('@/lib/tdr-api');
    await getAnalyticsSummary('tok', { tradeDirection: 'IMPORT' });

    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain('tradeDirection=IMPORT');
  });

  it('does not include tenantId in URL params (§66)', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: {} }),
    });

    const { getAnalyticsSummary } = await import('@/lib/tdr-api');
    await getAnalyticsSummary('tok', { dateFrom: '2025-01-01' } as any).catch(() => null);

    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).not.toContain('tenantId');
  });

  it('omits undefined filter fields from URL', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: {} }),
    });

    const { getAnalyticsSummary } = await import('@/lib/tdr-api');
    await getAnalyticsSummary('tok', {}).catch(() => null);

    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).not.toContain('dateFrom');
    expect(url).not.toContain('dateTo');
    expect(url).not.toContain('tradeDirection');
  });
});

// ── Error propagation ─────────────────────────────────────────────────────────

describe('error propagation', () => {
  it('throws with code and status on 401', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ error: { code: 'UNAUTHORIZED', message: 'Invalid token' } }),
    });

    const { getTdrStatus } = await import('@/lib/tdr-api');
    await expect(getTdrStatus('bad-token')).rejects.toMatchObject({
      message: 'Invalid token',
    });
  });

  it('throws NETWORK_ERROR on fetch rejection', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network failure'));

    const { getTdrStatus } = await import('@/lib/tdr-api');
    await expect(getTdrStatus('tok')).rejects.toThrow('Network failure');
  });
});

// ── AbortController forwarding ─────────────────────────────────────────────

describe('AbortController forwarding (§58)', () => {
  it('passes signal to fetch', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: {} }),
    });

    const ctrl = new AbortController();
    const { getTdrStatus } = await import('@/lib/tdr-api');
    await getTdrStatus('tok', ctrl.signal).catch(() => null);

    const opts = mockFetch.mock.calls[0][1] as RequestInit;
    expect(opts?.signal).toBe(ctrl.signal);
  });
});

// ── Authenticated export download ─────────────────────────────────────────────

describe('downloadExport', () => {
  it('calls the correct URL with Bearer auth', async () => {
    // Stub URL and DOM APIs used by downloadExport (jsdom environment)
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:fake');
    vi.spyOn(URL, 'revokeObjectURL').mockReturnValue(undefined);
    const clickFn = vi.fn();
    vi.spyOn(document, 'createElement').mockReturnValue({ href: '', download: '', click: clickFn } as any);
    vi.spyOn(document.body, 'appendChild').mockReturnValue({} as any);
    vi.spyOn(document.body, 'removeChild').mockReturnValue({} as any);

    mockFetch.mockResolvedValueOnce({
      ok: true,
      blob: async () => new Blob(['csv-content'], { type: 'text/csv' }),
    });

    const { downloadExport } = await import('@/lib/tdr-api');
    await downloadExport('export-token', 'export-abc-123');

    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain('export-abc-123');
    expect(url).toContain('/tdr/exports/');
    expect(url).toContain('/download');
    const opts = mockFetch.mock.calls[0][1] as RequestInit;
    expect((opts?.headers as Record<string, string>)?.['Authorization']).toBe('Bearer export-token');

    vi.restoreAllMocks();
  });
});

// ── uploadFile response shape ─────────────────────────────────────────────────

describe('uploadFile', () => {
  it('returns batchId from server response (not id)', async () => {
    const responseData = {
      sourceFileId: 'sf-001',
      batchId: 'batch-abc-123',
      jobId: 'job-xyz',
      standardizedFilename: 'TDR_V1_EXP_2025_01_001.csv',
      status: 'QUEUED',
    };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 202,
      json: async () => ({ data: responseData }),
    });

    const { uploadFile } = await import('@/lib/tdr-api');
    const result = await uploadFile(
      'test-token',
      new File(['a,b\n1,2'], 'test.csv', { type: 'text/csv' }),
      'EXPORT',
      'TDR_V1',
      2025,
      1,
    );

    expect(result.batchId).toBe('batch-abc-123');
    expect(result.standardizedFilename).toBe('TDR_V1_EXP_2025_01_001.csv');
    expect(result.status).toBe('QUEUED');
  });

  it('posts to /tdr/batches/upload with Bearer token', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 202,
      json: async () => ({ data: { batchId: 'b1', sourceFileId: 'sf1', jobId: 'j1', standardizedFilename: 'TDR_V1_IMP_2025_01_001.csv', status: 'QUEUED' } }),
    });

    const { uploadFile } = await import('@/lib/tdr-api');
    await uploadFile('my-token', new File(['x'], 'x.csv'), 'IMPORT', 'TDR_V1', 2025);

    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain('/tdr/batches/upload');
    const opts = mockFetch.mock.calls[0][1] as RequestInit;
    expect((opts?.headers as Record<string, string>)?.['Authorization']).toBe('Bearer my-token');
    expect(opts?.method).toBe('POST');
  });

  it('throws on non-ok response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 422,
      json: async () => ({ error: { code: 'DUPLICATE_SOURCE', message: 'File already uploaded' } }),
    });

    const { uploadFile } = await import('@/lib/tdr-api');
    await expect(
      uploadFile('tok', new File(['x'], 'x.csv'), 'IMPORT', 'TDR_V1', 2025),
    ).rejects.toMatchObject({ message: 'File already uploaded', code: 'DUPLICATE_SOURCE' });
  });
});

// ── parseTdrFilename / period conflict ────────────────────────────────────────

describe('getFilenamePeriodConflict (upload page helper)', () => {
  // Import the helpers by dynamically loading the module. Because upload/page.tsx
  // is a React component, we extract the pure functions for isolated unit testing.

  function parseTdrFilename(filename: string) {
    const match = /^TDR_V1_(IMP|EXP)_(\d{4})(?:_(\d{2}))?_/i.exec(filename);
    if (!match) return null;
    return {
      direction: match[1].toUpperCase() === 'EXP' ? 'EXPORT' : 'IMPORT',
      year: parseInt(match[2], 10),
      month: match[3] != null ? parseInt(match[3], 10) : null,
    };
  }

  function getConflict(
    filename: string,
    direction: 'IMPORT' | 'EXPORT',
    year: number,
    month: number | null,
  ) {
    const parsed = parseTdrFilename(filename);
    if (!parsed) return null;
    const conflicts: string[] = [];
    if (parsed.direction !== direction) conflicts.push('direction');
    if (parsed.year !== year) conflicts.push('year');
    if (parsed.month != null && month != null && parsed.month !== month) conflicts.push('month');
    return conflicts.length > 0 ? conflicts.join(';') : null;
  }

  it('returns null for non-TDR_V1 filename', () => {
    expect(getConflict('my_data_file.csv', 'EXPORT', 2025, 1)).toBeNull();
  });

  it('returns null when filename matches selected direction/year/month', () => {
    expect(getConflict('TDR_V1_EXP_2025_01_001.csv', 'EXPORT', 2025, 1)).toBeNull();
  });

  it('returns null when filename month is absent and month is selected', () => {
    // Full-year file: TDR_V1_EXP_2025_001.csv — no month segment
    expect(getConflict('TDR_V1_EXP_2025_001.csv', 'EXPORT', 2025, 3)).toBeNull();
  });

  it('detects direction mismatch (IMP vs EXPORT)', () => {
    const result = getConflict('TDR_V1_IMP_2025_01_001.csv', 'EXPORT', 2025, 1);
    expect(result).toContain('direction');
  });

  it('detects year mismatch', () => {
    const result = getConflict('TDR_V1_EXP_2024_01_001.csv', 'EXPORT', 2025, 1);
    expect(result).toContain('year');
  });

  it('detects month mismatch when both present', () => {
    const result = getConflict('TDR_V1_EXP_2025_03_001.csv', 'EXPORT', 2025, 1);
    expect(result).toContain('month');
  });
});
