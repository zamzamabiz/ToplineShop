/**
 * P8-004 — RBAC Tests
 *
 * ESM shims and overall test strategy mirror auth.spec.ts.
 * @nestjs/jwt and @nestjs/passport are pure ESM; jest.mock() factories
 * replace them with CJS-compatible stubs hoisted above all imports.
 *
 * Covers:
 *   Structural: @Roles() metadata on write endpoints
 *   Structural: @RequiresTenantContext() metadata on tenant-scoped endpoints
 *   Structural: @Permissions() decorator metadata
 *   Unit: RolesGuard allow/deny logic
 *   HTTP integration: 401/403/201 based on roles and tenant context
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      canActivate(ctx: any): boolean {
        const req: any = ctx?.switchToHttp?.()?.getRequest?.() ?? {};
        if (!req.headers?.authorization) {
          throw new UnauthorizedException('Authentication required');
        }
        return true;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

import {
  ExecutionContext,
  ForbiddenException,
  INestApplication,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';

import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CustomValidationPipe } from '../common/pipes/validation.pipe';
import { AllExceptionsFilter } from '../common/filters/all-exceptions.filter';

import { RolesGuard } from './guards/roles.guard';
import { ROLES_KEY } from './decorators/roles.decorator';
import { PERMISSIONS_KEY } from './decorators/permissions.decorator';
import { REQUIRES_TENANT_CONTEXT_KEY } from './decorators/tenant-context.decorator';
import { IS_PUBLIC_KEY } from './decorators/public.decorator';
import { Role } from './types/role.type';
import { Permission } from './types/permission.type';

import { TenantsController } from '../tenants/tenants.controller';
import { VendorsController } from '../vendors/vendors.controller';
import { CategoriesController } from '../categories/categories.controller';
import { ProductsController } from '../products/products.controller';

jest.setTimeout(30000);

// ---------------------------------------------------------------------------
// Section 1 — Structural: @Roles() metadata on write endpoints
// ---------------------------------------------------------------------------

describe('RBAC decorator metadata', () => {
  it('@Roles(SUPER_ADMIN) is set on POST /tenants create', () => {
    const meta = Reflect.getMetadata(ROLES_KEY, TenantsController.prototype.create);
    expect(meta).toEqual([Role.SUPER_ADMIN]);
  });

  it('@Roles contains SUPER_ADMIN on POST /vendors create', () => {
    const meta = Reflect.getMetadata(ROLES_KEY, VendorsController.prototype.create);
    expect(meta).toContain(Role.SUPER_ADMIN);
  });

  it('@Roles contains TENANT_ADMIN on POST /vendors create', () => {
    const meta = Reflect.getMetadata(ROLES_KEY, VendorsController.prototype.create);
    expect(meta).toContain(Role.TENANT_ADMIN);
  });

  it('@Roles contains PROCUREMENT_MANAGER on POST /vendors create', () => {
    const meta = Reflect.getMetadata(ROLES_KEY, VendorsController.prototype.create);
    expect(meta).toContain(Role.PROCUREMENT_MANAGER);
  });

  it('@Roles contains SUPER_ADMIN on POST /categories create', () => {
    const meta = Reflect.getMetadata(ROLES_KEY, CategoriesController.prototype.create);
    expect(meta).toContain(Role.SUPER_ADMIN);
  });

  it('@Roles contains PROCUREMENT_MANAGER on POST /categories create', () => {
    const meta = Reflect.getMetadata(ROLES_KEY, CategoriesController.prototype.create);
    expect(meta).toContain(Role.PROCUREMENT_MANAGER);
  });

  it('@Roles contains SUPER_ADMIN on POST /products create', () => {
    const meta = Reflect.getMetadata(ROLES_KEY, ProductsController.prototype.create);
    expect(meta).toContain(Role.SUPER_ADMIN);
  });

  it('@Roles contains PROCUREMENT_MANAGER on POST /products create', () => {
    const meta = Reflect.getMetadata(ROLES_KEY, ProductsController.prototype.create);
    expect(meta).toContain(Role.PROCUREMENT_MANAGER);
  });

  it('VIEWER is NOT in @Roles for POST /vendors', () => {
    const meta = Reflect.getMetadata(ROLES_KEY, VendorsController.prototype.create) as string[];
    expect(meta).not.toContain(Role.VIEWER);
  });

  it('ANALYST is NOT in @Roles for POST /products', () => {
    const meta = Reflect.getMetadata(ROLES_KEY, ProductsController.prototype.create) as string[];
    expect(meta).not.toContain(Role.ANALYST);
  });

  it('@RequiresTenantContext is set on POST /vendors create', () => {
    const meta = Reflect.getMetadata(REQUIRES_TENANT_CONTEXT_KEY, VendorsController.prototype.create);
    expect(meta).toBe(true);
  });

  it('@RequiresTenantContext is set on POST /categories create', () => {
    const meta = Reflect.getMetadata(REQUIRES_TENANT_CONTEXT_KEY, CategoriesController.prototype.create);
    expect(meta).toBe(true);
  });

  it('@RequiresTenantContext is set on POST /products create', () => {
    const meta = Reflect.getMetadata(REQUIRES_TENANT_CONTEXT_KEY, ProductsController.prototype.create);
    expect(meta).toBe(true);
  });

  it('@RequiresTenantContext is NOT set on POST /tenants create (global SUPER_ADMIN action)', () => {
    const meta = Reflect.getMetadata(REQUIRES_TENANT_CONTEXT_KEY, TenantsController.prototype.create);
    expect(meta).toBeUndefined();
  });

  it('GET endpoints remain @Public()', () => {
    expect(Reflect.getMetadata(IS_PUBLIC_KEY, TenantsController.prototype.findAll)).toBe(true);
    expect(Reflect.getMetadata(IS_PUBLIC_KEY, VendorsController.prototype.findAll)).toBe(true);
    expect(Reflect.getMetadata(IS_PUBLIC_KEY, CategoriesController.prototype.findAll)).toBe(true);
    expect(Reflect.getMetadata(IS_PUBLIC_KEY, ProductsController.prototype.findAll)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Section 2 — Structural: @Permissions() decorator metadata
// ---------------------------------------------------------------------------

describe('Permissions decorator metadata', () => {
  class SampleController {
    create() {}
  }

  beforeAll(() => {
    const { Permissions } = jest.requireActual('./decorators/permissions.decorator') as {
      Permissions: (...p: Permission[]) => MethodDecorator;
    };
    Permissions(Permission.CREATE_VENDOR)(SampleController.prototype, 'create', Object.getOwnPropertyDescriptor(SampleController.prototype, 'create')!);
  });

  it('@Permissions() decorator sets metadata with PERMISSIONS_KEY', () => {
    const meta = Reflect.getMetadata(PERMISSIONS_KEY, SampleController.prototype.create);
    expect(meta).toEqual([Permission.CREATE_VENDOR]);
  });

  it('Permission constants exist and are strings', () => {
    expect(typeof Permission.CREATE_TENANT).toBe('string');
    expect(typeof Permission.CREATE_VENDOR).toBe('string');
    expect(typeof Permission.CREATE_CATEGORY).toBe('string');
    expect(typeof Permission.CREATE_PRODUCT).toBe('string');
  });
});

// ---------------------------------------------------------------------------
// Section 3 — Unit: RolesGuard logic
// ---------------------------------------------------------------------------

describe('RolesGuard unit tests', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  function makeContext(
    roles: string[],
    tenantId?: string,
    requiredRoles?: Role[],
    requiresTenantContext?: boolean,
  ): ExecutionContext {
    const req = { user: { roles, tenantId } };
    const mockReflector = {
      getAllAndOverride: jest.fn((key: string) => {
        if (key === ROLES_KEY) return requiredRoles ?? null;
        if (key === REQUIRES_TENANT_CONTEXT_KEY) return requiresTenantContext ?? false;
        return null;
      }),
    };
    return {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({ getRequest: () => req }),
    } as unknown as ExecutionContext;
  }

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  it('allows when no roles metadata is set', () => {
    const ctx = makeContext([], undefined, undefined);
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(null);
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('allows when user has a matching required role', () => {
    const ctx = makeContext([Role.PROCUREMENT_MANAGER], 'tenant-1', [Role.PROCUREMENT_MANAGER]);
    jest.spyOn(reflector, 'getAllAndOverride')
      .mockReturnValueOnce([Role.PROCUREMENT_MANAGER])
      .mockReturnValueOnce(false);
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('throws ForbiddenException when user has no matching role', () => {
    const ctx = makeContext([Role.VIEWER], 'tenant-1', [Role.SUPER_ADMIN]);
    jest.spyOn(reflector, 'getAllAndOverride')
      .mockReturnValueOnce([Role.SUPER_ADMIN])
      .mockReturnValueOnce(false);
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('throws ForbiddenException when user object is missing', () => {
    const req = { user: undefined };
    const mockCtx = {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({ getRequest: () => req }),
    } as unknown as ExecutionContext;
    jest.spyOn(reflector, 'getAllAndOverride')
      .mockReturnValueOnce([Role.SUPER_ADMIN]);
    expect(() => guard.canActivate(mockCtx)).toThrow(ForbiddenException);
  });

  it('throws ForbiddenException when tenant context required but tenantId missing', () => {
    const ctx = makeContext([Role.PROCUREMENT_MANAGER], undefined, [Role.PROCUREMENT_MANAGER], true);
    jest.spyOn(reflector, 'getAllAndOverride')
      .mockReturnValueOnce([Role.PROCUREMENT_MANAGER])
      .mockReturnValueOnce(true);
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('allows SUPER_ADMIN on role-only route without tenantId', () => {
    const ctx = makeContext([Role.SUPER_ADMIN], undefined, [Role.SUPER_ADMIN], false);
    jest.spyOn(reflector, 'getAllAndOverride')
      .mockReturnValueOnce([Role.SUPER_ADMIN])
      .mockReturnValueOnce(false);
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('throws ForbiddenException for unknown/invalid role', () => {
    const ctx = makeContext(['UNKNOWN_ROLE'], 'tenant-1', [Role.SUPER_ADMIN]);
    jest.spyOn(reflector, 'getAllAndOverride')
      .mockReturnValueOnce([Role.SUPER_ADMIN])
      .mockReturnValueOnce(false);
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });
});

// ---------------------------------------------------------------------------
// Section 4 — HTTP integration: RBAC 401/403 responses
// ---------------------------------------------------------------------------

describe('P8-004 HTTP integration — RBAC enforcement', () => {
  let app: INestApplication;
  let baseUrl: string;

  const mockSession = {
    id: 'session-1',
    userId: 'user-1',
    tenantId: 'tenant-1',
    tokenHash: 'hash',
    expiresAt: new Date(Date.now() + 86400000),
    revokedAt: null,
    createdAt: new Date(),
    ipAddress: null,
    userAgent: null,
  };

  const minimalPrismaMock = {
    user: { findUnique: jest.fn().mockResolvedValue(null), findMany: jest.fn().mockResolvedValue([]) },
    session: {
      findUnique: jest.fn().mockResolvedValue(null),
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue(mockSession),
      update: jest.fn().mockResolvedValue(mockSession),
      updateMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
    tenant: {
      findUnique: jest.fn().mockResolvedValue({ id: 'tenant-1', name: 'T', slug: 't', type: 'VENDOR', status: 'ACTIVE', createdAt: new Date(), updatedAt: new Date(), deletedAt: null }),
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockResolvedValue({ id: 'new-tenant-1', name: 'New', slug: 'new', type: 'VENDOR', status: 'ACTIVE', createdAt: new Date(), updatedAt: new Date() }),
    },
    vendor: {
      findUnique: jest.fn().mockResolvedValue(null),
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockResolvedValue({ id: 'v1', name: 'V', slug: 'v', tenantId: 'tenant-1', status: 'ACTIVE', createdAt: new Date(), updatedAt: new Date() }),
    },
    category: {
      findUnique: jest.fn().mockResolvedValue(null),
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockResolvedValue({ id: 'c1', name: 'C', slug: 'c', tenantId: 'tenant-1', status: 'ACTIVE', sortOrder: 0, createdAt: new Date(), updatedAt: new Date() }),
    },
    product: {
      findUnique: jest.fn().mockResolvedValue(null),
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockResolvedValue({ id: 'p1', name: 'P', slug: 'p', tenantId: 'tenant-1', status: 'DRAFT', basePrice: '10.00', currency: 'NGN', inStock: true, createdAt: new Date(), updatedAt: new Date() }),
    },
    auditLog: { create: jest.fn().mockResolvedValue({}) },
    tdrBatch: { findMany: jest.fn().mockResolvedValue([]), findFirst: jest.fn().mockResolvedValue(null) },
    tdrQualityJob: { findUnique: jest.fn().mockResolvedValue(null), create: jest.fn().mockResolvedValue({ id: 'qj1' }), updateMany: jest.fn().mockResolvedValue({ count: 0 }) },
    tdrExportJob: { findFirst: jest.fn().mockResolvedValue(null), updateMany: jest.fn().mockResolvedValue({ count: 0 }) },
    $transaction: jest.fn().mockResolvedValue(null),
    $disconnect: jest.fn(),
    $connect: jest.fn(),
  };

  function encodeUser(user: object): string {
    return Buffer.from(JSON.stringify(user)).toString('base64');
  }

  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue(minimalPrismaMock)
      .overrideProvider(AuditService)
      .useValue({ recordEvent: jest.fn().mockResolvedValue(undefined) })
      .compile();

    app = module.createNestApplication();
    // Middleware runs before guards — inject req.user from test header
    // so RolesGuard sees the correct user without touching JWT strategy.
    app.use((req: any, _res: any, next: any) => {
      const testUserHeader = req.headers['x-test-user'];
      if (testUserHeader) {
        try {
          req.user = JSON.parse(Buffer.from(testUserHeader as string, 'base64').toString('utf-8'));
        } catch { /* ignore malformed header */ }
      }
      next();
    });
    app.useGlobalPipes(new CustomValidationPipe());
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.listen(0);
    const addr = (app.getHttpServer() as any).address();
    baseUrl = `http://127.0.0.1:${addr.port}`;
  }, 20000);

  afterAll(async () => {
    if (app) await app.close();
  });

  async function post(path: string, body: object, opts?: { token?: string; user?: object }) {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (opts?.token !== undefined) headers['Authorization'] = `Bearer ${opts.token}`;
    if (opts?.user) headers['x-test-user'] = encodeUser(opts.user);
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

  // --- Unauthenticated → 401 ---
  it('POST /tenants without token returns 401', async () => {
    const res = await post('/tenants', { name: 'T', slug: 't', type: 'VENDOR', status: 'ACTIVE' });
    expect(res.status).toBe(401);
  });

  it('POST /vendors without token returns 401', async () => {
    const res = await post('/vendors', { name: 'V', slug: 'v', tenantId: 'tenant-1', status: 'ACTIVE' });
    expect(res.status).toBe(401);
  });

  // --- Wrong role → 403 ---
  it('authenticated VIEWER cannot POST /vendors (returns 403)', async () => {
    const viewer = { userId: 'u1', tenantId: 'tenant-1', roles: [Role.VIEWER], sessionId: 's1' };
    const res = await post('/vendors', { name: 'V', slug: 'v', tenantId: 'tenant-1', status: 'ACTIVE' },
      { token: 'tok', user: viewer });
    expect(res.status).toBe(403);
  });

  it('authenticated ANALYST cannot POST /products (returns 403)', async () => {
    const analyst = { userId: 'u1', tenantId: 'tenant-1', roles: [Role.ANALYST], sessionId: 's1' };
    const res = await post('/products', { name: 'P', slug: 'p', tenantId: 'tenant-1', vendorId: 'v1', categoryId: 'c1', basePrice: '10.00', status: 'DRAFT' },
      { token: 'tok', user: analyst });
    expect(res.status).toBe(403);
  });

  it('non-SUPER_ADMIN (TENANT_ADMIN) cannot POST /tenants (returns 403)', async () => {
    const tenantAdmin = { userId: 'u1', tenantId: 'tenant-1', roles: [Role.TENANT_ADMIN], sessionId: 's1' };
    const res = await post('/tenants', { name: 'T', slug: 't2', type: 'VENDOR', status: 'ACTIVE' },
      { token: 'tok', user: tenantAdmin });
    expect(res.status).toBe(403);
  });

  it('unknown role returns 403 on protected POST /vendors', async () => {
    const unknownRole = { userId: 'u1', tenantId: 'tenant-1', roles: ['UNKNOWN_ROLE'], sessionId: 's1' };
    const res = await post('/vendors', { name: 'V', slug: 'v2', tenantId: 'tenant-1', status: 'ACTIVE' },
      { token: 'tok', user: unknownRole });
    expect(res.status).toBe(403);
  });

  // --- Missing tenantId on tenant-scoped route → 403 ---
  it('PROCUREMENT_MANAGER without tenantId cannot POST /vendors (returns 403)', async () => {
    const noTenant = { userId: 'u1', roles: [Role.PROCUREMENT_MANAGER], sessionId: 's1' };
    const res = await post('/vendors', { name: 'V', slug: 'v3', tenantId: 'tenant-1', status: 'ACTIVE' },
      { token: 'tok', user: noTenant });
    expect(res.status).toBe(403);
  });

  it('PROCUREMENT_MANAGER without tenantId cannot POST /categories (returns 403)', async () => {
    const noTenant = { userId: 'u1', roles: [Role.PROCUREMENT_MANAGER], sessionId: 's1' };
    const res = await post('/categories', { name: 'C', slug: 'c1', tenantId: 'tenant-1', status: 'ACTIVE' },
      { token: 'tok', user: noTenant });
    expect(res.status).toBe(403);
  });

  it('PROCUREMENT_MANAGER without tenantId cannot POST /products (returns 403)', async () => {
    const noTenant = { userId: 'u1', roles: [Role.PROCUREMENT_MANAGER], sessionId: 's1' };
    const res = await post('/products', { name: 'P', slug: 'p2', tenantId: 'tenant-1', vendorId: 'v1', categoryId: 'c1', basePrice: '10.00', status: 'DRAFT' },
      { token: 'tok', user: noTenant });
    expect(res.status).toBe(403);
  });

  // --- Correct role + tenantId → passes RBAC gate (not 403) ---
  it('PROCUREMENT_MANAGER with tenantId passes RBAC for POST /vendors', async () => {
    const pm = { userId: 'u1', tenantId: 'tenant-1', roles: [Role.PROCUREMENT_MANAGER], sessionId: 's1' };
    const res = await post('/vendors', { name: 'VNew', slug: 'vnew', tenantId: 'tenant-1', status: 'ACTIVE' },
      { token: 'tok', user: pm });
    expect(res.status).not.toBe(401);
    expect(res.status).not.toBe(403);
  });

  it('TENANT_ADMIN with tenantId passes RBAC for POST /categories', async () => {
    const admin = { userId: 'u1', tenantId: 'tenant-1', roles: [Role.TENANT_ADMIN], sessionId: 's1' };
    const res = await post('/categories', { name: 'CNew', slug: 'cnew', tenantId: 'tenant-1', status: 'ACTIVE' },
      { token: 'tok', user: admin });
    expect(res.status).not.toBe(401);
    expect(res.status).not.toBe(403);
  });

  it('SUPER_ADMIN with tenantId passes RBAC for POST /products', async () => {
    const sa = { userId: 'u1', tenantId: 'tenant-1', roles: [Role.SUPER_ADMIN], sessionId: 's1' };
    const res = await post('/products', { name: 'PNew', slug: 'pnew', tenantId: 'tenant-1', vendorId: 'v1', categoryId: 'c1', basePrice: '10.00', status: 'DRAFT' },
      { token: 'tok', user: sa });
    expect(res.status).not.toBe(401);
    expect(res.status).not.toBe(403);
  });

  it('SUPER_ADMIN WITHOUT tenantId passes RBAC for POST /tenants (no tenant context required)', async () => {
    const sa = { userId: 'u1', roles: [Role.SUPER_ADMIN], sessionId: 's1' };
    const res = await post('/tenants', { name: 'NewTenant', slug: 'new-tenant', type: 'VENDOR', status: 'ACTIVE' },
      { token: 'tok', user: sa });
    expect(res.status).not.toBe(401);
    expect(res.status).not.toBe(403);
  });

  // --- GET endpoints remain public ---
  it('GET /health is publicly accessible without token', async () => {
    const res = await get('/health');
    expect(res.status).toBe(200);
  });

  it('GET /tenants is publicly accessible without token', async () => {
    const res = await get('/tenants');
    expect(res.status).toBe(200);
  });

  it('GET /vendors is publicly accessible without token', async () => {
    const res = await get('/vendors');
    expect(res.status).toBe(200);
  });

  it('GET /categories is publicly accessible without token', async () => {
    const res = await get('/categories');
    expect(res.status).toBe(200);
  });

  it('GET /products is publicly accessible without token', async () => {
    const res = await get('/products');
    expect(res.status).toBe(200);
  });
});
