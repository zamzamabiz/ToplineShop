/**
 * TDR-MVP-FRONTEND-001-CORRECTION-001
 * Login gate and auth flow unit tests.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { authLogin } from '@/lib/tdr-api';
import type { AuthLoginRequest, AuthLoginResponse } from '@/types/tdr';

const API_BASE = 'http://localhost:4000';

function makeLoginResp(overrides?: Partial<AuthLoginResponse>): AuthLoginResponse {
  return {
    accessToken: 'test-access-token',
    refreshToken: 'test-refresh-token',
    expiresIn: 900,
    user: {
      userId: 'user-uuid-1',
      email: 'admin@toplineshop.dev',
      tenantId: 'tenant-uuid-1',
      roles: [],
    },
    ...overrides,
  };
}

describe('authLogin — request contract', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('posts to /auth/login', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, data: makeLoginResp() }),
    });
    await authLogin({ email: 'admin@toplineshop.dev', password: 'test-password' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url] = fetchMock.mock.calls[0];
    expect(url).toBe(`${API_BASE}/auth/login`);
  });

  it('sends exactly { email, password } — no tenantId or extra fields', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, data: makeLoginResp() }),
    });
    await authLogin({ email: 'admin@toplineshop.dev', password: 'pass' });
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body).toHaveProperty('email', 'admin@toplineshop.dev');
    expect(body).toHaveProperty('password', 'pass');
    expect(body).not.toHaveProperty('tenantId');
    expect(Object.keys(body)).toHaveLength(2);
  });

  it('sends method POST with Content-Type application/json', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, data: makeLoginResp() }),
    });
    await authLogin({ email: 'e@example.com', password: 'p' });
    const opts = fetchMock.mock.calls[0][1];
    expect(opts.method).toBe('POST');
    expect(opts.headers['Content-Type']).toBe('application/json');
  });

  it('sends no Authorization header (public endpoint)', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, data: makeLoginResp() }),
    });
    await authLogin({ email: 'e@example.com', password: 'p' });
    const opts = fetchMock.mock.calls[0][1];
    expect(opts.headers).not.toHaveProperty('Authorization');
  });
});

describe('authLogin — response parsing', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns body.data (accessToken, refreshToken, expiresIn, user) from success response', async () => {
    const resp = makeLoginResp();
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, data: resp }),
    });
    const result = await authLogin({ email: 'admin@toplineshop.dev', password: 'pass' });
    expect(result.accessToken).toBe('test-access-token');
    expect(result.refreshToken).toBe('test-refresh-token');
    expect(result.expiresIn).toBe(900);
    expect(result.user.email).toBe('admin@toplineshop.dev');
    expect(result.user.tenantId).toBe('tenant-uuid-1');
    expect(Array.isArray(result.user.roles)).toBe(true);
  });

  it('throws with backend error message on 401', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ ok: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }),
    });
    await expect(authLogin({ email: 'bad@example.com', password: 'wrong' }))
      .rejects.toThrow('Authentication required');
  });

  it('throws fallback error when body has no error.message', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({}),
    });
    // authLogin fallback is 'Login failed' (not HTTP 500 — see tdr-api.ts)
    await expect(authLogin({ email: 'e@example.com', password: 'p' }))
      .rejects.toThrow('Login failed');
  });

  it('propagates network errors', async () => {
    fetchMock.mockRejectedValue(new Error('Network failure'));
    await expect(authLogin({ email: 'e@example.com', password: 'p' }))
      .rejects.toThrow('Network failure');
  });
});

describe('authLogin — no localStorage usage', () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  let setItemSpy: ReturnType<typeof vi.spyOn>;
  let getItemSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
    getItemSpy = vi.spyOn(Storage.prototype, 'getItem');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('does not write token to localStorage', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, data: makeLoginResp() }),
    });
    await authLogin({ email: 'admin@toplineshop.dev', password: 'pass' });
    expect(setItemSpy).not.toHaveBeenCalled();
  });

  it('does not read token from localStorage', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, data: makeLoginResp() }),
    });
    await authLogin({ email: 'admin@toplineshop.dev', password: 'pass' });
    expect(getItemSpy).not.toHaveBeenCalled();
  });
});

describe('AuthLoginRequest type contract', () => {
  it('has exactly email and password fields — matches backend LoginDto', () => {
    const req: AuthLoginRequest = {
      email: 'user@example.com',
      password: 'secure123',
    };
    expect(req).toHaveProperty('email');
    expect(req).toHaveProperty('password');
    expect(Object.keys(req)).toHaveLength(2);
  });
});

describe('AuthLoginResponse type contract', () => {
  it('has accessToken, refreshToken, expiresIn, user with userId/email/tenantId/roles', () => {
    const resp: AuthLoginResponse = makeLoginResp();
    expect(typeof resp.accessToken).toBe('string');
    expect(typeof resp.refreshToken).toBe('string');
    expect(typeof resp.expiresIn).toBe('number');
    expect(typeof resp.user.userId).toBe('string');
    expect(typeof resp.user.email).toBe('string');
    expect(typeof resp.user.tenantId).toBe('string');
    expect(Array.isArray(resp.user.roles)).toBe(true);
  });

  it('user object does not include a raw password or token', () => {
    const resp: AuthLoginResponse = makeLoginResp();
    const userKeys = Object.keys(resp.user);
    expect(userKeys).not.toContain('password');
    expect(userKeys).not.toContain('passwordHash');
    expect(userKeys).not.toContain('accessToken');
  });
});
