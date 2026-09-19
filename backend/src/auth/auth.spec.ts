/**
 * P8-003 — Authentication Session Lifecycle and Write Endpoint Protection Tests
 *
 * @nestjs/jwt and @nestjs/passport ship as pure ESM ("type":"module").
 * Jest's default CJS environment cannot parse them. The jest.mock() factories
 * below are hoisted by Jest above all import statements, replacing both
 * packages with CJS-compatible implementations before any import chain loads
 * them. The application code is tested through these mocks; production runtime
 * continues to use the real packages unchanged.
 *
 * Covers:
 *   Unit tests: AuthService login/logout/refresh, replay detection, audit events, redaction
 *   Guard tests: JwtAuthGuard PUBLIC allowlist, token rejection
 *   Structural tests: @Public() decoration on GET routes, @Throttle on auth routes
 *   HTTP integration tests: POST write endpoints → 401 without token, GET endpoints public
 */

// ---------------------------------------------------------------------------
// ESM shims — hoisted above all imports by Jest.
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
jest.mock('@nestjs/jwt', (): any => {
  const common = jest.requireActual('@nestjs/common') as any;

  class JwtService {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    sign(_payload: unknown, _options?: unknown): string {
      return 'mock.jwt.token';
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    verify(_token: string, _options?: unknown): unknown {
      return {};
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    decode(_token: string): unknown {
      return {};
    }
  }
  common.Injectable()(JwtService);

  class JwtModule {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    static register(_options: unknown) {
      return {
        module: JwtModule,
        providers: [{ provide: JwtService, useClass: JwtService }],
        exports: [JwtService],
      };
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    static registerAsync(_options: unknown) {
      return {
        module: JwtModule,
        providers: [{ provide: JwtService, useClass: JwtService }],
        exports: [JwtService],
      };
    }
  }
  common.Module({})(JwtModule);

  return { JwtService, JwtModule };
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
jest.mock('@nestjs/passport', (): any => {
  const common = jest.requireActual('@nestjs/common') as any;
  const { UnauthorizedException, Injectable, Module } = common;

  function AuthGuard(_type: string) {
    class BaseAuthGuard {
      // Checks for Authorization header; throws UnauthorizedException if absent.
      // This mirrors the real Passport JWT authenticate() rejection so that
      // HTTP tests 12-15 (POST without token → 401) work correctly.
      canActivate(ctx: any): boolean {
        const req: any = ctx?.switchToHttp?.()?.getRequest?.() ?? {};
        if (!req.headers?.authorization) {
          throw new UnauthorizedException('Authentication required');
        }
        return true;
      }
      handleRequest(err: any, user: any): any {
        if (err || !user) throw new UnauthorizedException('Authentication required');
        return user;
      }
    }
    Injectable()(BaseAuthGuard);
    return BaseAuthGuard;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function PassportStrategy(_Strategy: unknown, _name?: string) {
    return class PassportStrategyBase {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      constructor(_options?: unknown) {}
    };
  }

  class PassportModule {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    static register(_options?: unknown) {
      return { module: PassportModule, providers: [], exports: [] };
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    static registerAsync(_options?: unknown) {
      return { module: PassportModule, providers: [], exports: [] };
    }
  }
  Module({})(PassportModule);

  return { AuthGuard, PassportStrategy, PassportModule };
});

// ---------------------------------------------------------------------------
// Imports (evaluated after the jest.mock() shims take effect)
// ---------------------------------------------------------------------------

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import * as argon2 from 'argon2';

import { AuthService, RequestMeta } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { IS_PUBLIC_KEY } from './decorators/public.decorator';
import { sanitizeMetadata } from '../audit/types/audit-event.type';
import { TenantsController } from '../tenants/tenants.controller';
import { VendorsController } from '../vendors/vendors.controller';
import { CategoriesController } from '../categories/categories.controller';
import { ProductsController } from '../products/products.controller';
import { AppController } from '../app.controller';
import { AuthController } from './auth.controller';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CustomValidationPipe } from '../common/pipes/validation.pipe';
import { AllExceptionsFilter } from '../common/filters/all-exceptions.filter';

jest.setTimeout(30000);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeSession(overrides: Record<string, unknown> = {}) {
  return {
    id: 'session-1',
    userId: 'user-1',
    tenantId: 'tenant-1',
    tokenHash: 'somehash',
    ipAddress: null,
    userAgent: null,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    revokedAt: null,
    createdAt: new Date(),
    ...overrides,
  };
}

function makeUser(overrides: Record<string, unknown> = {}) {
  return {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
    passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$fakehash',
    status: 'ACTIVE',
    memberships: [{ tenantId: 'tenant-1', status: 'ACTIVE' }],
    ...overrides,
  };
}

const META: RequestMeta = { ipAddress: '127.0.0.1', userAgent: 'jest-test' };

// ---------------------------------------------------------------------------
// Section 1 — sanitizeMetadata (redaction) — Test 17
// ---------------------------------------------------------------------------

describe('sanitizeMetadata (P8-003 redaction)', () => {
  it('redacts fields matching *token* pattern', () => {
    const result = sanitizeMetadata({ accessToken: 'abc', refreshToken: 'xyz' });
    expect(result?.accessToken).toBe('[REDACTED]');
    expect(result?.refreshToken).toBe('[REDACTED]');
  });

  it('redacts fields matching *secret* pattern', () => {
    const result = sanitizeMetadata({ jwtSecret: 'my-secret', apiKey: 'key123' });
    expect(result?.jwtSecret).toBe('[REDACTED]');
    expect(result?.apiKey).toBe('[REDACTED]');
  });

  it('redacts *password* fields', () => {
    const result = sanitizeMetadata({ password: 'plaintext', passwordHash: 'hash' });
    expect(result?.password).toBe('[REDACTED]');
    expect(result?.passwordHash).toBe('[REDACTED]');
  });

  it('redacts authorization fields', () => {
    const result = sanitizeMetadata({ authorization: 'Bearer token123' });
    expect(result?.authorization).toBe('[REDACTED]');
  });

  it('preserves non-sensitive fields', () => {
    const result = sanitizeMetadata({ reason: 'invalid_credentials', userId: 'u1', sessionId: 's1' });
    expect(result?.reason).toBe('invalid_credentials');
    expect(result?.userId).toBe('u1');
    expect(result?.sessionId).toBe('s1');
  });

  it('returns undefined for undefined input', () => {
    expect(sanitizeMetadata(undefined)).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Section 2 — AuthService unit tests — Tests 1–9, 18
// ---------------------------------------------------------------------------

describe('AuthService unit tests', () => {
  let service: AuthService;
  let mockPrisma: any;
  let mockJwt: any;
  let mockAudit: any;
  let argonVerifySpy: jest.SpyInstance;
  let argonHashSpy: jest.SpyInstance;

  beforeEach(async () => {
    argonVerifySpy = jest.spyOn(argon2, 'verify').mockResolvedValue(true);
    argonHashSpy = jest.spyOn(argon2, 'hash').mockResolvedValue('$hashed' as any);

    mockPrisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue(makeUser()),
      },
      session: {
        create: jest.fn().mockImplementation(({ data }: any) => Promise.resolve(makeSession({ ...data }))),
        findUnique: jest.fn().mockResolvedValue(makeSession()),
        update: jest.fn().mockResolvedValue(makeSession({ revokedAt: new Date() })),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      membership: {
        findUnique: jest.fn().mockResolvedValue({ roles: [] }),
      },
    };

    mockJwt = {
      sign: jest.fn().mockReturnValue('signed-access-token'),
    };

    mockAudit = {
      recordEvent: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwt },
        { provide: AuditService, useValue: mockAudit },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // Test 1 — Successful login returns access + refresh tokens
  it('login: success returns accessToken and refreshToken', async () => {
    const result = await service.login({ email: 'test@example.com', password: 'pass' }, META);
    expect(result.accessToken).toBe('signed-access-token');
    expect(typeof result.refreshToken).toBe('string');
    expect(result.refreshToken.length).toBeGreaterThan(0);
  });

  // Test 2 — Bad password → 401 "Authentication required"
  it('login: wrong password throws UnauthorizedException with fixed message', async () => {
    argonVerifySpy.mockResolvedValue(false);
    await expect(service.login({ email: 'test@example.com', password: 'wrong' }, META))
      .rejects.toThrow(UnauthorizedException);
    await expect(service.login({ email: 'test@example.com', password: 'wrong' }, META))
      .rejects.toMatchObject({ message: 'Authentication required' });
  });

  // Test 3 — Unknown email → same 401 contract
  it('login: unknown email throws UnauthorizedException with fixed message', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    await expect(service.login({ email: 'nobody@example.com', password: 'pass' }, META))
      .rejects.toMatchObject({ message: 'Authentication required' });
  });

  // Test 4 — INACTIVE user → same 401 contract
  it('login: INACTIVE user throws UnauthorizedException with fixed message', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(makeUser({ status: 'DISABLED' }));
    await expect(service.login({ email: 'test@example.com', password: 'pass' }, META))
      .rejects.toMatchObject({ message: 'Authentication required' });
  });

  // Test 5 — Session row created on login
  it('login: creates a session row in the database', async () => {
    await service.login({ email: 'test@example.com', password: 'pass' }, META);
    expect(mockPrisma.session.create).toHaveBeenCalledTimes(1);
    const createCall = mockPrisma.session.create.mock.calls[0][0].data;
    expect(createCall.userId).toBe('user-1');
    expect(createCall.tenantId).toBe('tenant-1');
    expect(createCall.expiresAt).toBeInstanceOf(Date);
  });

  // Test 6 — Raw refresh token is never persisted (stored as HMAC digest)
  it('login: stored tokenHash is not equal to the returned refreshToken', async () => {
    const result = await service.login({ email: 'test@example.com', password: 'pass' }, META);
    const storedHash = mockPrisma.session.create.mock.calls[0][0].data.tokenHash;
    expect(storedHash).not.toBe(result.refreshToken);
    expect(storedHash).toBe(service.hmacRefreshToken(result.refreshToken));
  });

  // Test 7 — Logout removes/revokes session
  it('logout: revokes the session by setting revokedAt', async () => {
    await service.logout('user-1', 'session-1', META);
    expect(mockPrisma.session.updateMany).toHaveBeenCalledWith({
      where: { id: 'session-1', userId: 'user-1', revokedAt: null },
      data: expect.objectContaining({ revokedAt: expect.any(Date) }),
    });
  });

  // Test 8 — Refresh rotation: valid refresh creates new session, revokes old
  it('refresh: valid token creates new session and revokes old one', async () => {
    const rawToken = 'valid-raw-token-abc123';
    const hash = service.hmacRefreshToken(rawToken);
    const activeSession = makeSession({ tokenHash: hash });
    mockPrisma.session.findUnique.mockResolvedValue(activeSession);
    mockPrisma.session.create.mockResolvedValue(makeSession({ id: 'session-2', tokenHash: 'newhash' }));

    const result = await service.refresh({ refreshToken: rawToken }, META);

    expect(mockPrisma.session.update).toHaveBeenCalledWith({
      where: { id: activeSession.id },
      data: expect.objectContaining({ revokedAt: expect.any(Date) }),
    });
    expect(mockPrisma.session.create).toHaveBeenCalledTimes(1);
    expect(result.accessToken).toBe('signed-access-token');
    expect(typeof result.refreshToken).toBe('string');
    expect(result.refreshToken).not.toBe(rawToken);
  });

  // Test 9 — Replay: reusing revoked refresh token revokes ALL sessions for user
  it('refresh: replayed (already-revoked) token revokes all user sessions', async () => {
    const rawToken = 'replayed-token';
    const hash = service.hmacRefreshToken(rawToken);
    const revokedSession = makeSession({ tokenHash: hash, revokedAt: new Date(Date.now() - 1000) });
    mockPrisma.session.findUnique.mockResolvedValue(revokedSession);

    await expect(service.refresh({ refreshToken: rawToken }, META))
      .rejects.toMatchObject({ message: 'Authentication required' });

    expect(mockPrisma.session.updateMany).toHaveBeenCalledWith({
      where: { userId: revokedSession.userId, revokedAt: null },
      data: expect.objectContaining({ revokedAt: expect.any(Date) }),
    });
  });

  // Test 18 — Auth audit events are written for login, logout, refresh
  it('login: writes auth.login.success audit event on success', async () => {
    await service.login({ email: 'test@example.com', password: 'pass' }, META);
    const successCall = (mockAudit.recordEvent as jest.Mock).mock.calls.find(
      (c: any[]) => c[0].action === 'auth.login.success',
    );
    expect(successCall).toBeDefined();
    expect(successCall[0].actorUserId).toBe('user-1');
  });

  it('login: writes auth.login.failure audit event on bad password', async () => {
    argonVerifySpy.mockResolvedValue(false);
    await service.login({ email: 'test@example.com', password: 'wrong' }, META).catch(() => {});
    const failCall = (mockAudit.recordEvent as jest.Mock).mock.calls.find(
      (c: any[]) => c[0].action === 'auth.login.failure',
    );
    expect(failCall).toBeDefined();
  });

  it('logout: writes auth.logout audit event', async () => {
    await service.logout('user-1', 'session-1', META);
    const logoutCall = (mockAudit.recordEvent as jest.Mock).mock.calls.find(
      (c: any[]) => c[0].action === 'auth.logout',
    );
    expect(logoutCall).toBeDefined();
  });

  it('refresh: writes auth.refresh.success audit event on valid rotation', async () => {
    const rawToken = 'valid-raw-token';
    const hash = service.hmacRefreshToken(rawToken);
    mockPrisma.session.findUnique.mockResolvedValue(makeSession({ tokenHash: hash }));
    mockPrisma.session.create.mockResolvedValue(makeSession({ id: 'session-2' }));
    await service.refresh({ refreshToken: rawToken }, META);
    const successCall = (mockAudit.recordEvent as jest.Mock).mock.calls.find(
      (c: any[]) => c[0].action === 'auth.refresh.success',
    );
    expect(successCall).toBeDefined();
  });

  it('refresh: writes auth.refresh.failure on replay', async () => {
    const rawToken = 'replay-token';
    const hash = service.hmacRefreshToken(rawToken);
    mockPrisma.session.findUnique.mockResolvedValue(makeSession({ tokenHash: hash, revokedAt: new Date() }));
    await service.refresh({ refreshToken: rawToken }, META).catch(() => {});
    const failCall = (mockAudit.recordEvent as jest.Mock).mock.calls.find(
      (c: any[]) => c[0].action === 'auth.refresh.failure',
    );
    expect(failCall).toBeDefined();
  });

  it('audit metadata never contains raw tokens or passwords', async () => {
    argonVerifySpy.mockResolvedValue(false);
    await service.login({ email: 'test@example.com', password: 'secret123' }, META).catch(() => {});
    for (const [call] of (mockAudit.recordEvent as jest.Mock).mock.calls) {
      const metaStr = JSON.stringify(call.metadata || {});
      expect(metaStr).not.toContain('secret123');
      expect(metaStr).not.toContain('accessToken');
      expect(metaStr).not.toContain('refreshToken');
    }
  });
});

// ---------------------------------------------------------------------------
// Section 3 — Guard tests — Tests 10, 11
// ---------------------------------------------------------------------------

describe('JwtAuthGuard unit tests', () => {
  let guard: JwtAuthGuard;

  beforeEach(() => {
    const reflector = new Reflector();
    guard = new JwtAuthGuard(reflector);
  });

  function makeContext(isPublic: boolean, handler?: object): any {
    const mockHandler = handler || function publicRoute() {};
    if (isPublic) {
      Reflect.defineMetadata(IS_PUBLIC_KEY, true, mockHandler);
    }
    return {
      getHandler: () => mockHandler,
      getClass: () => class {},
      switchToHttp: () => ({
        getRequest: () => ({ headers: {} }),
        getResponse: () => ({}),
      }),
      getType: () => 'http',
      getArgs: () => [],
      getArgByIndex: () => undefined,
    };
  }

  // Test 10 — Guard allows PUBLIC routes
  it('canActivate returns true for routes marked @Public()', () => {
    const ctx = makeContext(true);
    const result = guard.canActivate(ctx);
    expect(result).toBe(true);
  });

  // Test 11 — Guard throws UnauthorizedException when no token on protected route
  it('handleRequest throws UnauthorizedException when user is falsy', () => {
    expect(() => guard.handleRequest(null, false)).toThrow(UnauthorizedException);
    expect(() => guard.handleRequest(null, null)).toThrow(UnauthorizedException);
    expect(() => guard.handleRequest(null, false)).toThrow('Authentication required');
  });

  it('handleRequest returns user when user is valid', () => {
    const user = { userId: 'u1', tenantId: 't1', roles: [], sessionId: 's1' };
    expect(guard.handleRequest(null, user)).toBe(user);
  });
});

// ---------------------------------------------------------------------------
// Section 4 — Structural tests — Tests 12–16, 19 (decorator metadata)
// ---------------------------------------------------------------------------

describe('P8-003 decorator structure', () => {
  // Tests 12–15: POST write endpoints are NOT marked @Public()
  it('POST /tenants create endpoint is NOT marked @Public', () => {
    const meta = Reflect.getMetadata(IS_PUBLIC_KEY, TenantsController.prototype.create);
    expect(meta).toBeUndefined();
  });

  it('POST /vendors create endpoint is NOT marked @Public', () => {
    const meta = Reflect.getMetadata(IS_PUBLIC_KEY, VendorsController.prototype.create);
    expect(meta).toBeUndefined();
  });

  it('POST /categories create endpoint is NOT marked @Public', () => {
    const meta = Reflect.getMetadata(IS_PUBLIC_KEY, CategoriesController.prototype.create);
    expect(meta).toBeUndefined();
  });

  it('POST /products create endpoint is NOT marked @Public', () => {
    const meta = Reflect.getMetadata(IS_PUBLIC_KEY, ProductsController.prototype.create);
    expect(meta).toBeUndefined();
  });

  // Test 16: GET endpoints ARE marked @Public()
  it('GET /tenants findAll is marked @Public', () => {
    const meta = Reflect.getMetadata(IS_PUBLIC_KEY, TenantsController.prototype.findAll);
    expect(meta).toBe(true);
  });

  it('GET /vendors findAll is marked @Public', () => {
    const meta = Reflect.getMetadata(IS_PUBLIC_KEY, VendorsController.prototype.findAll);
    expect(meta).toBe(true);
  });

  it('GET /categories findAll is marked @Public', () => {
    const meta = Reflect.getMetadata(IS_PUBLIC_KEY, CategoriesController.prototype.findAll);
    expect(meta).toBe(true);
  });

  it('GET /products findAll is marked @Public', () => {
    const meta = Reflect.getMetadata(IS_PUBLIC_KEY, ProductsController.prototype.findAll);
    expect(meta).toBe(true);
  });

  it('GET / (root) is marked @Public', () => {
    const meta = Reflect.getMetadata(IS_PUBLIC_KEY, AppController.prototype.getRoot);
    expect(meta).toBe(true);
  });

  it('GET /health is marked @Public', () => {
    const meta = Reflect.getMetadata(IS_PUBLIC_KEY, AppController.prototype.getHealth);
    expect(meta).toBe(true);
  });

  // Test 19: Auth endpoints have Throttle metadata
  // Key format produced by @nestjs/throttler@6.5.0: 'THROTTLER:TTL<name>'
  it('POST /auth/login has @Throttle metadata (THROTTLER:TTLdefault key)', () => {
    const meta = Reflect.getMetadata('THROTTLER:TTLdefault', AuthController.prototype.login);
    expect(meta).toBeDefined();
  });

  it('POST /auth/login @Public decorator is applied', () => {
    const meta = Reflect.getMetadata(IS_PUBLIC_KEY, AuthController.prototype.login);
    expect(meta).toBe(true);
  });

  it('POST /auth/refresh @Public decorator is applied', () => {
    const meta = Reflect.getMetadata(IS_PUBLIC_KEY, AuthController.prototype.refresh);
    expect(meta).toBe(true);
  });

  it('POST /auth/logout is NOT marked @Public (requires auth)', () => {
    const meta = Reflect.getMetadata(IS_PUBLIC_KEY, AuthController.prototype.logout);
    expect(meta).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Section 5 — HTTP integration tests — Tests 12–16 (actual 401/200 responses)
// ---------------------------------------------------------------------------

describe('P8-003 HTTP integration — write endpoint protection', () => {
  let app: INestApplication;
  let baseUrl: string;

  const minimalPrismaMock = {
    user: { findUnique: jest.fn().mockResolvedValue(null), findMany: jest.fn().mockResolvedValue([]) },
    session: {
      findUnique: jest.fn().mockResolvedValue(null),
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue(makeSession()),
      update: jest.fn().mockResolvedValue(makeSession()),
      updateMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
    tenant: { findUnique: jest.fn().mockResolvedValue(null), findMany: jest.fn().mockResolvedValue([]) },
    vendor: { findUnique: jest.fn().mockResolvedValue(null), findMany: jest.fn().mockResolvedValue([]) },
    category: { findUnique: jest.fn().mockResolvedValue(null), findMany: jest.fn().mockResolvedValue([]) },
    product: { findUnique: jest.fn().mockResolvedValue(null), findMany: jest.fn().mockResolvedValue([]) },
    auditLog: { create: jest.fn().mockResolvedValue({}) },
    tdrBatch: { findMany: jest.fn().mockResolvedValue([]), findFirst: jest.fn().mockResolvedValue(null) },
    tdrQualityJob: { findUnique: jest.fn().mockResolvedValue(null), create: jest.fn().mockResolvedValue({ id: 'qj1' }), updateMany: jest.fn().mockResolvedValue({ count: 0 }) },
    tdrExportJob: { findFirst: jest.fn().mockResolvedValue(null), updateMany: jest.fn().mockResolvedValue({ count: 0 }) },
    $transaction: jest.fn().mockResolvedValue(null),
    $disconnect: jest.fn(),
    $connect: jest.fn(),
  };

  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue(minimalPrismaMock)
      .overrideProvider(AuditService)
      .useValue({ recordEvent: jest.fn().mockResolvedValue(undefined) })
      .compile();

    app = module.createNestApplication();
    app.useGlobalPipes(new CustomValidationPipe());
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.listen(0);
    const addr = (app.getHttpServer() as any).address();
    baseUrl = `http://127.0.0.1:${addr.port}`;
  }, 20000);

  afterAll(async () => {
    if (app) await app.close();
  });

  async function post(path: string, body: object, token?: string) {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${baseUrl}${path}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    return res;
  }

  async function get(path: string) {
    return fetch(`${baseUrl}${path}`);
  }

  // Test 12 — POST /tenants without token → 401
  it('POST /tenants without token returns 401', async () => {
    const res = await post('/tenants', { name: 'T', slug: 't', type: 'VENDOR', status: 'ACTIVE' });
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error.message).toBe('Authentication required');
  });

  // Test 13 — POST /vendors without token → 401
  it('POST /vendors without token returns 401', async () => {
    const res = await post('/vendors', { name: 'V', slug: 'v', tenantId: 't1', status: 'ACTIVE' });
    expect(res.status).toBe(401);
  });

  // Test 14 — POST /categories without token → 401
  it('POST /categories without token returns 401', async () => {
    const res = await post('/categories', { name: 'C', slug: 'c', tenantId: 't1', status: 'ACTIVE' });
    expect(res.status).toBe(401);
  });

  // Test 15 — POST /products without token → 401
  it('POST /products without token returns 401', async () => {
    const res = await post('/products', {
      name: 'P',
      slug: 'p',
      tenantId: 't1',
      vendorId: 'v1',
      categoryId: 'c1',
      basePrice: '10.00',
      status: 'DRAFT',
    });
    expect(res.status).toBe(401);
  });

  // Test 16 — GET endpoints remain accessible without token
  it('GET /health is publicly accessible', async () => {
    const res = await get('/health');
    expect(res.status).toBe(200);
  });

  it('GET /tenants is publicly accessible', async () => {
    const res = await get('/tenants');
    expect(res.status).toBe(200);
  });

  it('GET /vendors is publicly accessible', async () => {
    const res = await get('/vendors');
    expect(res.status).toBe(200);
  });

  it('POST /auth/login (public) returns 401 on invalid credentials (not 403)', async () => {
    const res = await post('/auth/login', { email: 'nobody@example.com', password: 'wrong' });
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.message).toBe('Authentication required');
  });
});
