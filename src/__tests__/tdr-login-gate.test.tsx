/**
 * TDR-MVP-FINAL-AUDIT-001-CORRECTION-001
 * TdrLoginGate component — button state and auth-flow behavioral tests.
 *
 * Verifies:
 *  - empty fields → button disabled
 *  - valid email + password → button enabled
 *  - loading state → button disabled
 *  - successful submit invokes authLogin
 *  - button carries bg-accent-primary (visible enabled styling)
 *  - login gate disappears on successful auth
 *  - no localStorage usage on successful login
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import React from 'react';

// ── Module mocks ──────────────────────────────────────────────────────────────

vi.mock('@/lib/tdr-api', () => ({
  authLogin: vi.fn(),
  authLogout: vi.fn(),
  authRefresh: vi.fn(),
  setAuthCallbacks: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  usePathname: () => '/tdr',
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

async function importComponents() {
  const { TdrLoginGate } = await import('@/app/tdr/layout');
  const { AuthProvider } = await import('@/lib/auth-context');
  return { TdrLoginGate, AuthProvider };
}

function makeLoginResp() {
  return {
    accessToken: 'tok-abc',
    refreshToken: 'ref-xyz',
    expiresIn: 900,
    user: { userId: 'u1', email: 'admin@toplineshop.dev', tenantId: 't1', roles: ['TENANT_ADMIN'] },
  };
}

async function renderLoginGate(child?: React.ReactNode) {
  const { TdrLoginGate, AuthProvider } = await importComponents();
  return render(
    <AuthProvider>
      <TdrLoginGate>{child ?? <div data-testid="protected">Protected</div>}</TdrLoginGate>
    </AuthProvider>,
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('TdrLoginGate — button disabled state', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('button is disabled when both fields are empty', async () => {
    await renderLoginGate();
    const btn = screen.getByRole('button', { name: /sign in/i });
    expect(btn).toBeDisabled();
  });

  it('button is disabled when email is filled but password is empty', async () => {
    await renderLoginGate();
    const emailInput = screen.getByPlaceholderText(/email/i);
    fireEvent.change(emailInput, { target: { value: 'admin@toplineshop.dev' } });
    const btn = screen.getByRole('button', { name: /sign in/i });
    expect(btn).toBeDisabled();
  });

  it('button is disabled when password is filled but email is empty', async () => {
    await renderLoginGate();
    const pwInput = screen.getByPlaceholderText(/password/i);
    fireEvent.change(pwInput, { target: { value: 'secret' } });
    const btn = screen.getByRole('button', { name: /sign in/i });
    expect(btn).toBeDisabled();
  });

  it('button is disabled when email is only whitespace', async () => {
    await renderLoginGate();
    const emailInput = screen.getByPlaceholderText(/email/i);
    const pwInput = screen.getByPlaceholderText(/password/i);
    fireEvent.change(emailInput, { target: { value: '   ' } });
    fireEvent.change(pwInput, { target: { value: 'secret' } });
    const btn = screen.getByRole('button', { name: /sign in/i });
    expect(btn).toBeDisabled();
  });

  it('button is enabled when both email and password are non-empty', async () => {
    await renderLoginGate();
    const emailInput = screen.getByPlaceholderText(/email/i);
    const pwInput = screen.getByPlaceholderText(/password/i);
    fireEvent.change(emailInput, { target: { value: 'admin@toplineshop.dev' } });
    fireEvent.change(pwInput, { target: { value: 'secret' } });
    const btn = screen.getByRole('button', { name: /sign in/i });
    expect(btn).not.toBeDisabled();
  });
});

describe('TdrLoginGate — button styling', () => {
  it('button has bg-accent-primary class (visible green background)', async () => {
    await renderLoginGate();
    const btn = screen.getByRole('button', { name: /sign in/i });
    expect(btn.className).toContain('bg-accent-primary');
  });

  it('button has text-white class (white text for contrast)', async () => {
    await renderLoginGate();
    const btn = screen.getByRole('button', { name: /sign in/i });
    expect(btn.className).toContain('text-white');
  });

  it('button has disabled:opacity-50 class (clearly different disabled state)', async () => {
    await renderLoginGate();
    const btn = screen.getByRole('button', { name: /sign in/i });
    expect(btn.className).toContain('disabled:opacity-50');
  });

  it('button has cursor-pointer class when enabled', async () => {
    await renderLoginGate();
    const btn = screen.getByRole('button', { name: /sign in/i });
    expect(btn.className).toContain('cursor-pointer');
  });
});

describe('TdrLoginGate — submit invokes authLogin', () => {
  let tdrApiModule: typeof import('@/lib/tdr-api');

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    tdrApiModule = await import('@/lib/tdr-api');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('calls authLogin with email and password on form submit', async () => {
    vi.mocked(tdrApiModule.authLogin).mockResolvedValue(makeLoginResp());
    await renderLoginGate();

    fireEvent.change(screen.getByPlaceholderText(/email/i), {
      target: { value: 'admin@toplineshop.dev' },
    });
    fireEvent.change(screen.getByPlaceholderText(/password/i), {
      target: { value: 'Pakistan92' },
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    });

    expect(tdrApiModule.authLogin).toHaveBeenCalledTimes(1);
    expect(tdrApiModule.authLogin).toHaveBeenCalledWith({
      email: 'admin@toplineshop.dev',
      password: 'Pakistan92',
    });
  });

  it('button shows "Signing in…" label while loading', async () => {
    let resolveLogin!: (v: any) => void;
    vi.mocked(tdrApiModule.authLogin).mockReturnValue(
      new Promise((res) => { resolveLogin = res; }),
    );

    await renderLoginGate();
    fireEvent.change(screen.getByPlaceholderText(/email/i), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: 'pw' } });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    });

    expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled();

    await act(async () => { resolveLogin(makeLoginResp()); });
  });

  it('login gate disappears and protected content renders on success', async () => {
    vi.mocked(tdrApiModule.authLogin).mockResolvedValue(makeLoginResp());
    await renderLoginGate(<div data-testid="protected">Protected Content</div>);

    fireEvent.change(screen.getByPlaceholderText(/email/i), {
      target: { value: 'admin@toplineshop.dev' },
    });
    fireEvent.change(screen.getByPlaceholderText(/password/i), {
      target: { value: 'secret' },
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    });

    await waitFor(() => {
      expect(screen.getByTestId('protected')).toBeInTheDocument();
    });
    expect(screen.queryByRole('button', { name: /sign in/i })).not.toBeInTheDocument();
  });

  it('shows error message and keeps gate visible on login failure', async () => {
    vi.mocked(tdrApiModule.authLogin).mockRejectedValue(
      Object.assign(new Error('Authentication required'), { code: 'UNAUTHORIZED' }),
    );
    await renderLoginGate();

    fireEvent.change(screen.getByPlaceholderText(/email/i), { target: { value: 'x@y.com' } });
    fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: 'bad' } });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    });

    await waitFor(() => {
      expect(screen.getByText('Authentication required')).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });
});

describe('TdrLoginGate — no localStorage usage', () => {
  let setItemSpy: ReturnType<typeof vi.spyOn>;
  let getItemSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    const tdrApiModule = await import('@/lib/tdr-api');
    vi.mocked(tdrApiModule.authLogin).mockResolvedValue(makeLoginResp());
    setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
    getItemSpy = vi.spyOn(Storage.prototype, 'getItem');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('does not write to localStorage on successful login', async () => {
    await renderLoginGate();
    fireEvent.change(screen.getByPlaceholderText(/email/i), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: 'pw' } });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    });

    await waitFor(() => expect(screen.getByTestId('protected')).toBeInTheDocument());
    expect(setItemSpy).not.toHaveBeenCalled();
  });

  it('does not read from localStorage during gate render', async () => {
    await renderLoginGate();
    expect(getItemSpy).not.toHaveBeenCalled();
  });
});
