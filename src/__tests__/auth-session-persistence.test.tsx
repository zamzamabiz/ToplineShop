/**
 * TDR-POST-MVP-PROD-SECURITY-FOUNDATION-001
 * PM-005 session persistence tests.
 *
 * Covers:
 *   §P.1  Login does not store refresh token in JS storage (localStorage/sessionStorage)
 *   §P.2  AuthProvider restores session via cookie on mount
 *   §P.3  authRefresh() sends credentials: 'include' (cookie forwarded)
 *   §P.4  Page reload path: restoring=true → restoring=false after attempt
 *   §P.5  Failed restore leaves component unauthenticated (no retry loop)
 *   §P.6  Successful restore sets accessToken in state
 *   §P.7  authLogin() sends credentials: 'include'
 *   §P.8  authLogout() sends credentials: 'include'
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, act, waitFor } from '@testing-library/react';
import React, { useEffect, useRef } from 'react';
import { AuthProvider, useAuth } from '@/lib/auth-context';

// ── Helpers ─────────────────────────────────────────────────────────────────

function jsonResp(data: unknown, status = 200) {
  return new Response(
    JSON.stringify({ ok: true, data }),
    { status, headers: { 'Content-Type': 'application/json' } },
  );
}

function errResp(message: string, status: number) {
  return new Response(
    JSON.stringify({ ok: false, error: { message, code: `HTTP_${status}` } }),
    { status, headers: { 'Content-Type': 'application/json' } },
  );
}

// Captures calls to authRefresh from the auth context
function AuthStateCapture({ onState }: { onState: (s: ReturnType<typeof useAuth>) => void }) {
  const state = useAuth();
  const countRef = useRef(0);
  useEffect(() => {
    countRef.current += 1;
    onState(state);
  });
  return null;
}

// ── Test suite ───────────────────────────────────────────────────────────────

describe('PM-005 auth session persistence', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  // §P.1 — No refresh token in JS storage
  it('P.1 login does not write refresh token to localStorage', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResp({ accessToken: 'access-1', refreshToken: 'refresh-1', user: { id: '1', email: 'a@b.com', role: 'ADMIN' } }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const { authLogin } = await import('@/lib/tdr-api');
    await authLogin({ email: 'a@b.com', password: 'pass' });

    const allKeys = Object.keys(localStorage);
    for (const key of allKeys) {
      const val = localStorage.getItem(key) ?? '';
      expect(val).not.toContain('refresh-1');
    }
  });

  it('P.1b login does not write refresh token to sessionStorage', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResp({ accessToken: 'access-1', refreshToken: 'refresh-1', user: { id: '1', email: 'a@b.com', role: 'ADMIN' } }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const { authLogin } = await import('@/lib/tdr-api');
    await authLogin({ email: 'a@b.com', password: 'pass' });

    const allKeys = Object.keys(sessionStorage);
    for (const key of allKeys) {
      const val = sessionStorage.getItem(key) ?? '';
      expect(val).not.toContain('refresh-1');
    }
  });

  // §P.3 — credentials: 'include' on refresh
  it('P.3 authRefresh sends credentials: include', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResp({ accessToken: 'new-access', refreshToken: 'new-refresh' }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const { authRefresh } = await import('@/lib/tdr-api');
    await authRefresh();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0];
    expect(init?.credentials).toBe('include');
  });

  // §P.7 — credentials: 'include' on login
  it('P.7 authLogin sends credentials: include', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResp({ accessToken: 'a', refreshToken: 'r', user: { id: '1', email: 'a@b.com', role: 'ADMIN' } }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const { authLogin } = await import('@/lib/tdr-api');
    await authLogin({ email: 'a@b.com', password: 'pass' });

    const [, init] = fetchMock.mock.calls[0];
    expect(init?.credentials).toBe('include');
  });

  // §P.8 — credentials: 'include' on logout
  it('P.8 authLogout sends credentials: include', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const { authLogout } = await import('@/lib/tdr-api');
    await authLogout('some-access-token');

    const [, init] = fetchMock.mock.calls[0];
    expect(init?.credentials).toBe('include');
  });

  // §P.2 / §P.6 — Successful restore from cookie
  it('P.2/P.6 AuthProvider restores session from cookie on mount (successful restore)', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResp({ accessToken: 'restored-access', refreshToken: 'restored-refresh' }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const states: ReturnType<typeof useAuth>[] = [];
    const onState = (s: ReturnType<typeof useAuth>) => states.push({ ...s });

    await act(async () => {
      render(
        <AuthProvider>
          <AuthStateCapture onState={onState} />
        </AuthProvider>,
      );
    });

    await waitFor(() => {
      const last = states[states.length - 1];
      expect(last?.restoring).toBe(false);
    });

    const finalState = states[states.length - 1];
    expect(finalState?.accessToken).toBe('restored-access');
    expect(finalState?.isAuthenticated).toBe(true);
    expect(finalState?.restoring).toBe(false);

    // verify the restore call sent credentials:include
    const [, init] = fetchMock.mock.calls[0];
    expect(init?.credentials).toBe('include');
  });

  // §P.4 — restoring flag starts true, resolves after attempt
  it('P.4 restoring starts true and transitions to false after failed restore', async () => {
    const fetchMock = vi.fn().mockResolvedValue(errResp('Unauthorized', 401));
    vi.stubGlobal('fetch', fetchMock);

    const states: ReturnType<typeof useAuth>[] = [];
    const onState = (s: ReturnType<typeof useAuth>) => states.push({ ...s });

    await act(async () => {
      render(
        <AuthProvider>
          <AuthStateCapture onState={onState} />
        </AuthProvider>,
      );
    });

    await waitFor(() => {
      const last = states[states.length - 1];
      expect(last?.restoring).toBe(false);
    });

    // At some early point restoring should have been true
    const hadRestoringTrue = states.some((s) => s.restoring === true);
    expect(hadRestoringTrue).toBe(true);

    const finalState = states[states.length - 1];
    expect(finalState?.accessToken).toBeNull();
    expect(finalState?.isAuthenticated).toBe(false);
  });

  // §P.5 — No infinite loop: only one refresh attempt on mount
  it('P.5 failed restore does not trigger infinite retry loop', async () => {
    const fetchMock = vi.fn().mockResolvedValue(errResp('Unauthorized', 401));
    vi.stubGlobal('fetch', fetchMock);

    await act(async () => {
      render(
        <AuthProvider>
          <div />
        </AuthProvider>,
      );
    });

    await waitFor(() => expect(fetchMock.mock.calls.length).toBeGreaterThan(0));

    // Wait a full tick to ensure no additional calls are scheduled
    await new Promise((r) => setTimeout(r, 50));

    // Only one /auth/refresh call on mount — no loop
    const refreshCalls = fetchMock.mock.calls.filter(([url]) =>
      typeof url === 'string' && url.includes('/auth/refresh'),
    );
    expect(refreshCalls.length).toBe(1);
  });
});
