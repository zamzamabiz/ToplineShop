/**
 * TDR-AUTH-SESSION-LIFECYCLE-CORRECTION-001
 * TdrLoginGate + AuthProvider integration tests for session-expired state
 * and storage safety.
 *
 * Verifies:
 *  - sessionExpired banner shown when onAuthFailed is triggered
 *  - no "Session expired" banner on normal load
 *  - clearAuth() (logout path) does NOT show session expired banner
 *  - no localStorage / sessionStorage writes on mount or auth failure
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import React from 'react';

vi.mock('@/lib/tdr-api', () => ({
  authLogin: vi.fn(),
  authLogout: vi.fn(),
  authRefresh: vi.fn(),
  setAuthCallbacks: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  usePathname: () => '/tdr',
}));

async function importComponents() {
  const { TdrLoginGate } = await import('@/app/tdr/layout');
  const { AuthProvider } = await import('@/lib/auth-context');
  return { TdrLoginGate, AuthProvider };
}

// ── sessionExpired banner ─────────────────────────────────────────────────────

describe('TdrLoginGate — sessionExpired banner', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('does not show session expired banner on normal load (fresh state)', async () => {
    const { TdrLoginGate, AuthProvider } = await importComponents();

    render(
      <AuthProvider>
        <TdrLoginGate>
          <div data-testid="protected">Protected</div>
        </TdrLoginGate>
      </AuthProvider>,
    );

    expect(screen.queryByText(/session expired/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('shows "Session expired — please sign in again" when onAuthFailed is triggered', async () => {
    const { setAuthCallbacks } = await import('@/lib/tdr-api');
    const { TdrLoginGate, AuthProvider } = await importComponents();

    let capturedOnAuthFailed: (() => void) | null = null;
    vi.mocked(setAuthCallbacks).mockImplementation((cb: any) => {
      if (cb) capturedOnAuthFailed = cb.onAuthFailed;
    });

    render(
      <AuthProvider>
        <TdrLoginGate>
          <div data-testid="protected">Protected</div>
        </TdrLoginGate>
      </AuthProvider>,
    );

    await act(async () => {
      capturedOnAuthFailed?.();
    });

    await waitFor(() => {
      expect(
        screen.getByText(/session expired — please sign in again/i),
      ).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.queryByTestId('protected')).not.toBeInTheDocument();
  });

  it('clearAuth() (logout) does not set sessionExpired — no "Session expired" banner', async () => {
    const { setAuthCallbacks } = await import('@/lib/tdr-api');
    const { TdrLoginGate, AuthProvider } = await importComponents();
    const { useAuth } = await import('@/lib/auth-context');

    let capturedClearAuth: (() => void) | null = null;

    vi.mocked(setAuthCallbacks).mockImplementation((_cb: any) => {});

    function Capture() {
      const { clearAuth } = useAuth();
      capturedClearAuth = clearAuth;
      return null;
    }

    render(
      <AuthProvider>
        <TdrLoginGate>
          <Capture />
          <div data-testid="protected">Protected</div>
        </TdrLoginGate>
      </AuthProvider>,
    );

    await act(async () => {
      capturedClearAuth?.();
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });
    expect(screen.queryByText(/session expired/i)).not.toBeInTheDocument();
  });
});

// ── No storage usage ──────────────────────────────────────────────────────────

describe('auth — no localStorage / sessionStorage usage', () => {
  let setItemSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('AuthProvider + TdrLoginGate do not write to localStorage on mount', async () => {
    const { TdrLoginGate, AuthProvider } = await importComponents();

    render(
      <AuthProvider>
        <TdrLoginGate>
          <div>child</div>
        </TdrLoginGate>
      </AuthProvider>,
    );

    expect(setItemSpy).not.toHaveBeenCalled();
  });

  it('onAuthFailed callback does not write to localStorage', async () => {
    const { setAuthCallbacks } = await import('@/lib/tdr-api');
    const { TdrLoginGate, AuthProvider } = await importComponents();

    let capturedOnAuthFailed: (() => void) | null = null;
    vi.mocked(setAuthCallbacks).mockImplementation((cb: any) => {
      if (cb) capturedOnAuthFailed = cb.onAuthFailed;
    });

    render(
      <AuthProvider>
        <TdrLoginGate>
          <div>child</div>
        </TdrLoginGate>
      </AuthProvider>,
    );

    await act(async () => {
      capturedOnAuthFailed?.();
    });

    expect(setItemSpy).not.toHaveBeenCalled();
  });
});
