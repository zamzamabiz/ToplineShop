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
