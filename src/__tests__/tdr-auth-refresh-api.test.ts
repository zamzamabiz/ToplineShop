/**
 * TDR-AUTH-SESSION-LIFECYCLE-CORRECTION-001
 * API-layer 401 refresh-and-retry tests (no vi.mock of tdr-api — uses real module).
 *
 * Verifies:
 *  - succeeds without refresh on valid token
 *  - 401 without registered callbacks → throws immediately
 *  - 401 with null refreshToken → throws immediately
 *  - 401 with valid refreshToken → calls /auth/refresh, retries with new token
 *  - failed refresh → onAuthFailed called, throws 401
 *  - simultaneous 401s trigger exactly one refresh (storm protection)
 *  - 403 does not trigger refresh
 *  - 500 does not trigger refresh
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// No vi.mock('@/lib/tdr-api') — tests use the real module with fetch mocked

function jsonResp(data: unknown, status = 200) {
  return new Response(JSON.stringify({ ok: true, data }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function errResp(message: string, status: number) {
  return new Response(
    JSON.stringify({ ok: false, error: { message, code: `HTTP_${status}` } }),
    { status, headers: { 'Content-Type': 'application/json' } },
  );
}

describe('tdr-api — 401 refresh-and-retry', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let setAuthCallbacks: (cb: any) => void;
  let getTdrStatus: (token: string, signal?: AbortSignal) => Promise<unknown>;

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    const mod = await import('@/lib/tdr-api');
    setAuthCallbacks = mod.setAuthCallbacks;
    getTdrStatus = mod.getTdrStatus as (token: string, signal?: AbortSignal) => Promise<unknown>;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('succeeds without refresh when token is valid', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResp({ moduleEnabled: true }));
    vi.stubGlobal('fetch', fetchMock);

    const result = await getTdrStatus('good-token');
    expect(result).toEqual({ moduleEnabled: true });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('throws 401 and does not refresh when no callbacks are registered', async () => {
    const fetchMock = vi.fn().mockResolvedValue(errResp('Authentication required', 401));
    vi.stubGlobal('fetch', fetchMock);

    await expect(getTdrStatus('expired-token')).rejects.toMatchObject({ status: 401 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('calls onAuthFailed and throws 401 when refresh endpoint fails (cookie absent/expired)', async () => {
    // PM-005: cookie-based refresh — getRefreshToken is always null (cookie is the authority).
    // When the refresh endpoint itself returns 401 (no valid cookie), onAuthFailed is called.
    const onRefreshSuccess = vi.fn();
    const onAuthFailed = vi.fn();
    setAuthCallbacks({ getRefreshToken: () => null, onRefreshSuccess, onAuthFailed });

    // Both the original call and the /auth/refresh call return 401
    const fetchMock = vi.fn().mockResolvedValue(errResp('Authentication required', 401));
    vi.stubGlobal('fetch', fetchMock);

    await expect(getTdrStatus('expired-token')).rejects.toMatchObject({ status: 401 });
    expect(onAuthFailed).toHaveBeenCalledTimes(1);
    expect(onRefreshSuccess).not.toHaveBeenCalled();
    // Two calls: original request (401) + refresh attempt (401)
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('refreshes once and retries original request on 401', async () => {
    const onRefreshSuccess = vi.fn();
    const onAuthFailed = vi.fn();
    setAuthCallbacks({ getRefreshToken: () => 'rt-original', onRefreshSuccess, onAuthFailed });

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(errResp('Authentication required', 401))
      .mockResolvedValueOnce(jsonResp({ accessToken: 'new-access', refreshToken: 'new-refresh' }))
      .mockResolvedValueOnce(jsonResp({ moduleEnabled: true }));

    vi.stubGlobal('fetch', fetchMock);

    const result = await getTdrStatus('expired-token');

    expect(result).toEqual({ moduleEnabled: true });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect((fetchMock.mock.calls[1][0] as string)).toContain('/auth/refresh');
    const retryHeaders = fetchMock.mock.calls[2][1].headers as Record<string, string>;
    expect(retryHeaders.Authorization).toBe('Bearer new-access');
    expect(onRefreshSuccess).toHaveBeenCalledWith({ accessToken: 'new-access', refreshToken: 'new-refresh' });
    expect(onAuthFailed).not.toHaveBeenCalled();
  });

  it('calls onAuthFailed and throws when refresh fails', async () => {
    const onRefreshSuccess = vi.fn();
    const onAuthFailed = vi.fn();
    setAuthCallbacks({ getRefreshToken: () => 'rt-revoked', onRefreshSuccess, onAuthFailed });

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(errResp('Authentication required', 401))
      .mockResolvedValueOnce(errResp('Authentication required', 401));

    vi.stubGlobal('fetch', fetchMock);

    await expect(getTdrStatus('expired-token')).rejects.toMatchObject({ status: 401 });
    expect(onAuthFailed).toHaveBeenCalledTimes(1);
    expect(onRefreshSuccess).not.toHaveBeenCalled();
  });

  it('simultaneous 401s trigger exactly one refresh (storm protection)', async () => {
    let refreshCallCount = 0;

    setAuthCallbacks({
      getRefreshToken: () => 'rt-storm',
      onRefreshSuccess: vi.fn(),
      onAuthFailed: vi.fn(),
    });

    const fetchMock = vi.fn((url: string, init?: RequestInit) => {
      const auth = ((init?.headers ?? {}) as Record<string, string>).Authorization ?? '';
      if ((url as string).includes('/auth/refresh')) {
        refreshCallCount++;
        return Promise.resolve(
          jsonResp({ accessToken: 'new-access', refreshToken: 'new-refresh' }),
        );
      }
      if (auth === 'Bearer new-access') {
        return Promise.resolve(jsonResp({ moduleEnabled: true }));
      }
      return Promise.resolve(errResp('Authentication required', 401));
    });

    vi.stubGlobal('fetch', fetchMock);

    await Promise.all([
      getTdrStatus('expired-token'),
      getTdrStatus('expired-token'),
      getTdrStatus('expired-token'),
    ]);

    expect(refreshCallCount).toBe(1);
  });

  it('does not retry on 403 (permission error)', async () => {
    const onRefreshSuccess = vi.fn();
    setAuthCallbacks({ getRefreshToken: () => 'rt-valid', onRefreshSuccess, onAuthFailed: vi.fn() });

    const fetchMock = vi.fn().mockResolvedValue(errResp('Forbidden', 403));
    vi.stubGlobal('fetch', fetchMock);

    await expect(getTdrStatus('good-token')).rejects.toMatchObject({ status: 403 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(onRefreshSuccess).not.toHaveBeenCalled();
  });

  it('does not retry on 500 (server error)', async () => {
    const onRefreshSuccess = vi.fn();
    setAuthCallbacks({ getRefreshToken: () => 'rt-valid', onRefreshSuccess, onAuthFailed: vi.fn() });

    const fetchMock = vi.fn().mockResolvedValue(errResp('Internal error', 500));
    vi.stubGlobal('fetch', fetchMock);

    await expect(getTdrStatus('good-token')).rejects.toMatchObject({ status: 500 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(onRefreshSuccess).not.toHaveBeenCalled();
  });
});
