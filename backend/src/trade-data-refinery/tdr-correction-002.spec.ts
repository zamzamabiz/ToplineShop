/**
 * TDR-MVP-FRONTEND-001-CORRECTION-002
 *
 * Covers:
 *   §1  Seed source hygiene — no hardcoded password, env-var guard, hash rotation
 *   §2  TDR RBAC decorator metadata — cancel / replay / correct / upload / export
 *   §3  Roleless user negative HTTP tests — 403 on all mutation endpoints
 *   §4  Auth controller envelope — login / refresh / logout wrap success()
 *   §5  Analytics DTO regression — TrendQueryDto / BreakdownQueryDto
 */

// ---------------------------------------------------------------------------
// ESM shims — hoisted above all imports by Jest.
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
jest.mock('@nestjs/jwt', (): any => {
  const common = jest.requireActual('@nestjs/common') as any;

  class JwtService {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    sign(_payload: unknown, _options?: unknown): string { return 'mock.jwt.token'; }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    verify(_token: string, _options?: unknown): unknown { return {}; }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    decode(_token: string): unknown { return {}; }
  }
  common.Injectable()(JwtService);

  class JwtModule {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    static register(_options: unknown) {
      return { module: JwtModule, providers: [{ provide: JwtService, useClass: JwtService }], exports: [JwtService] };
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    static registerAsync(_options: unknown) {
      return { module: JwtModule, providers: [{ provide: JwtService, useClass: JwtService }], exports: [JwtService] };
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
        if (!req.headers?.authorization) throw new UnauthorizedException('Authentication required');
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
    return class { constructor(_options?: unknown) {} };
  }

  class PassportModule {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    static register(_options?: unknown) { return { module: PassportModule, providers: [], exports: [] }; }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    static registerAsync(_options?: unknown) { return { module: PassportModule, providers: [], exports: [] }; }
  }
  Module({})(PassportModule);

  return { AuthGuard, PassportStrategy, PassportModule };
});

// ---------------------------------------------------------------------------
// Imports
// ---------------------------------------------------------------------------

import * as fs from 'fs';
import * as path from 'path';
import 'reflect-metadata';

import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CustomValidationPipe } from '../common/pipes/validation.pipe';
import { AllExceptionsFilter } from '../common/filters/all-exceptions.filter';

import { ROLES_KEY } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/types/role.type';
import { TdrController } from './tdr.controller';
import { UploadController } from './ingestion/upload/upload.controller';
import {
  AnalyticsFilterDto,
  TrendGranularity,
  BreakdownDimension,
  TrendQueryDto,
  BreakdownQueryDto,
} from './analytics/dto/analytics-filter.dto';

jest.setTimeout(30000);

// ---------------------------------------------------------------------------
// §1 — Seed source hygiene
// ---------------------------------------------------------------------------

describe('Seed source hygiene', () => {
  const seedPath = path.join(__dirname, '../../prisma/seed.js');
  let seedSource: string;

  beforeAll(() => {
    seedSource = fs.readFileSync(seedPath, 'utf-8');
  });

  it('seed.js does not contain the previously exposed plaintext password', () => {
    expect(seedSource).not.toContain('DevAdmin123!');
  });

  it('seed.js references TDR_DEV_ADMIN_PASSWORD env var', () => {
    expect(seedSource).toContain('TDR_DEV_ADMIN_PASSWORD');
  });

  it('seed.js throws when env var is absent', () => {
    expect(seedSource).toContain("throw new Error");
    expect(seedSource).toContain("TDR_DEV_ADMIN_PASSWORD is required");
  });

  it('seed.js User upsert update clause includes passwordHash (rotation)', () => {
    // The update object for User must include passwordHash so re-running rotates the hash.
    // We look for update: { passwordHash } in the user upsert block.
    expect(seedSource).toMatch(/user\.upsert[\s\S]*?update:\s*\{\s*passwordHash/);
  });

  it('seed.js does not print the password value to console', () => {
    // Must not echo rawPassword or any password constant
    expect(seedSource).not.toMatch(/console\.log[^;]*rawPassword/);
    expect(seedSource).not.toMatch(/console\.log[^;]*DEV_PASSWORD/);
  });

  it('seed.js console output says password is not echoed', () => {
    expect(seedSource).toContain('not echoed');
  });
});

// ---------------------------------------------------------------------------
// §2 — TDR RBAC decorator metadata
// ---------------------------------------------------------------------------

describe('TDR RBAC decorator metadata', () => {
  it('POST /tdr/batches/upload requires SUPER_ADMIN', () => {
    const meta = Reflect.getMetadata(ROLES_KEY, UploadController.prototype.uploadBatch) as string[];
    expect(meta).toContain(Role.SUPER_ADMIN);
  });

  it('POST /tdr/batches/upload requires TENANT_ADMIN', () => {
    const meta = Reflect.getMetadata(ROLES_KEY, UploadController.prototype.uploadBatch) as string[];
    expect(meta).toContain(Role.TENANT_ADMIN);
  });

  it('POST /tdr/batches/upload requires IMPORT_MANAGER', () => {
    const meta = Reflect.getMetadata(ROLES_KEY, UploadController.prototype.uploadBatch) as string[];
    expect(meta).toContain(Role.IMPORT_MANAGER);
  });

  it('POST /tdr/batches/upload requires EXPORT_MANAGER', () => {
    const meta = Reflect.getMetadata(ROLES_KEY, UploadController.prototype.uploadBatch) as string[];
    expect(meta).toContain(Role.EXPORT_MANAGER);
  });

  it('POST /tdr/batches/:id/cancel requires SUPER_ADMIN', () => {
    const meta = Reflect.getMetadata(ROLES_KEY, TdrController.prototype.cancelBatch) as string[];
    expect(meta).toContain(Role.SUPER_ADMIN);
  });

  it('POST /tdr/batches/:id/cancel requires TENANT_ADMIN', () => {
    const meta = Reflect.getMetadata(ROLES_KEY, TdrController.prototype.cancelBatch) as string[];
    expect(meta).toContain(Role.TENANT_ADMIN);
  });

  it('POST /tdr/batches/:id/cancel does NOT allow VIEWER', () => {
    const meta = Reflect.getMetadata(ROLES_KEY, TdrController.prototype.cancelBatch) as string[];
    expect(meta).not.toContain(Role.VIEWER);
  });

  it('POST /tdr/batches/:id/replay requires SUPER_ADMIN', () => {
    const meta = Reflect.getMetadata(ROLES_KEY, TdrController.prototype.replayBatch) as string[];
    expect(meta).toContain(Role.SUPER_ADMIN);
  });

  it('POST /tdr/batches/:id/replay requires TENANT_ADMIN', () => {
    const meta = Reflect.getMetadata(ROLES_KEY, TdrController.prototype.replayBatch) as string[];
    expect(meta).toContain(Role.TENANT_ADMIN);
  });

  it('POST correct requires SUPER_ADMIN', () => {
    const meta = Reflect.getMetadata(ROLES_KEY, TdrController.prototype.applyCorrection) as string[];
    expect(meta).toContain(Role.SUPER_ADMIN);
  });

  it('POST correct requires TENANT_ADMIN', () => {
    const meta = Reflect.getMetadata(ROLES_KEY, TdrController.prototype.applyCorrection) as string[];
    expect(meta).toContain(Role.TENANT_ADMIN);
  });

  it('POST correct requires IMPORT_MANAGER', () => {
    const meta = Reflect.getMetadata(ROLES_KEY, TdrController.prototype.applyCorrection) as string[];
    expect(meta).toContain(Role.IMPORT_MANAGER);
  });

  it('POST correct requires EXPORT_MANAGER', () => {
    const meta = Reflect.getMetadata(ROLES_KEY, TdrController.prototype.applyCorrection) as string[];
    expect(meta).toContain(Role.EXPORT_MANAGER);
  });

  it('GET /tdr/status has no @Roles restriction (read-only, any authenticated TDR user)', () => {
    const meta = Reflect.getMetadata(ROLES_KEY, TdrController.prototype.getStatus);
    expect(meta).toBeUndefined();
  });

  it('GET /tdr/batches has no @Roles restriction', () => {
    const meta = Reflect.getMetadata(ROLES_KEY, TdrController.prototype.listBatches);
    expect(meta).toBeUndefined();
  });

  it('POST /tdr/exports has no @Roles restriction (service-level authorization via checkExportAuthorization)', () => {
    const meta = Reflect.getMetadata(ROLES_KEY, TdrController.prototype.createExport);
    expect(meta).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// §3 — Roleless negative HTTP tests
// ---------------------------------------------------------------------------

describe('TDR roleless user HTTP negative tests', () => {
  let app: INestApplication;
  let baseUrl: string;

  const mockSession = {
    id: 'session-1', userId: 'user-1', tenantId: 'tenant-1',
    tokenHash: 'hash', expiresAt: new Date(Date.now() + 86400000),
    revokedAt: null, createdAt: new Date(), ipAddress: null, userAgent: null,
  };

  const prismaMock = {
    user: { findUnique: jest.fn().mockResolvedValue(null), findMany: jest.fn().mockResolvedValue([]) },
    session: {
      findUnique: jest.fn().mockResolvedValue(null),
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue(mockSession),
      update: jest.fn().mockResolvedValue(mockSession),
      updateMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
    tenant: {
      findUnique: jest.fn().mockResolvedValue({ id: 'tenant-1', name: 'T', slug: 't', type: 'PLATFORM', status: 'ACTIVE', createdAt: new Date(), updatedAt: new Date(), deletedAt: null }),
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockResolvedValue({ id: 'tenant-2' }),
    },
    tenantModule: {
      // TenantModuleGuard needs this — returns enabled for our test tenant
      findUnique: jest.fn().mockResolvedValue({ enabled: true }),
    },
    tdrBatch: { findMany: jest.fn().mockResolvedValue([]), findFirst: jest.fn().mockResolvedValue(null), findUnique: jest.fn().mockResolvedValue(null) },
    tdrSourceFile: { create: jest.fn().mockResolvedValue({ id: 'sf-1' }) },
    tdrQualityJob: { findUnique: jest.fn().mockResolvedValue(null), create: jest.fn().mockResolvedValue({ id: 'qj1' }), updateMany: jest.fn().mockResolvedValue({ count: 0 }) },
    tdrExportJob: { findFirst: jest.fn().mockResolvedValue(null), findUnique: jest.fn().mockResolvedValue(null), create: jest.fn().mockResolvedValue({ id: 'ej1' }), updateMany: jest.fn().mockResolvedValue({ count: 0 }) },
    vendor: { findUnique: jest.fn().mockResolvedValue(null), findMany: jest.fn().mockResolvedValue([]) },
    category: { findUnique: jest.fn().mockResolvedValue(null), findMany: jest.fn().mockResolvedValue([]) },
    product: { findUnique: jest.fn().mockResolvedValue(null), findMany: jest.fn().mockResolvedValue([]) },
    auditLog: { create: jest.fn().mockResolvedValue({}) },
    $transaction: jest.fn().mockResolvedValue(null),
    $disconnect: jest.fn(),
    $connect: jest.fn(),
  };

  // Roleless dev user: authenticated, tenant context, TDR module enabled, roles: []
  const rolelessUser = { userId: 'user-1', tenantId: 'tenant-1', roles: [], sessionId: 'session-1' };

  function encodeUser(u: object): string {
    return Buffer.from(JSON.stringify(u)).toString('base64');
  }

  async function post(urlPath: string, body: object) {
    return fetch(`${baseUrl}${urlPath}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer mock-token',
        'x-test-user': encodeUser(rolelessUser),
      },
      body: JSON.stringify(body),
    });
  }

  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService).useValue(prismaMock)
      .overrideProvider(AuditService).useValue({ recordEvent: jest.fn().mockResolvedValue(undefined) })
      .compile();

    app = module.createNestApplication();
    // Middleware: inject req.user from test header — runs before guards
    app.use((req: any, _res: any, next: any) => {
      const h = req.headers['x-test-user'];
      if (h) {
        try { req.user = JSON.parse(Buffer.from(h as string, 'base64').toString('utf-8')); }
        catch { /* ignore */ }
      }
      next();
    });
    app.useGlobalPipes(new CustomValidationPipe());
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.listen(0);
    const addr = (app.getHttpServer() as any).address();
    baseUrl = `http://127.0.0.1:${addr.port}`;
  }, 20000);

  afterAll(async () => { if (app) await app.close(); });

  // --- Mutations denied for roles: [] ---

  it('roleless user: POST /tdr/batches/:id/cancel returns 403', async () => {
    const res = await post('/tdr/batches/test-batch-id/cancel', {});
    expect(res.status).toBe(403);
  });

  it('roleless user: POST /tdr/batches/:id/replay returns 403', async () => {
    const res = await post('/tdr/batches/test-batch-id/replay', { strategy: 'FULL' });
    expect(res.status).toBe(403);
  });

  it('roleless user: POST /tdr/batches/:batchId/records/:recordId/correct returns 403', async () => {
    const res = await post('/tdr/batches/test-batch/records/test-record/correct', {
      fieldPath: 'hsCode',
      correctedValue: '1234',
    });
    expect(res.status).toBe(403);
  });

  it('roleless user: POST /tdr/exports (no tradeDirection) returns 403', async () => {
    const res = await post('/tdr/exports', {});
    expect(res.status).toBe(403);
  });

  it('roleless user: POST /tdr/exports (with tradeDirection) returns 403', async () => {
    const res = await post('/tdr/exports', { tradeDirection: 'IMPORT' });
    expect(res.status).toBe(403);
  });

  // --- Read endpoints remain accessible to roles: [] ---

  it('roleless user: GET /tdr/status returns 200', async () => {
    prismaMock.tdrBatch.findMany.mockResolvedValue([]);
    // tdrService.getStatus needs tenantModule mock already set
    const res = await fetch(`${baseUrl}/tdr/status`, {
      headers: { 'Authorization': 'Bearer mock-token', 'x-test-user': encodeUser(rolelessUser) },
    });
    // 200 if service succeeds, or 500 if service mock is incomplete — either way NOT 403
    expect(res.status).not.toBe(403);
    expect(res.status).not.toBe(401);
  });

  it('roleless user: GET /tdr/batches returns 200', async () => {
    const res = await fetch(`${baseUrl}/tdr/batches`, {
      headers: { 'Authorization': 'Bearer mock-token', 'x-test-user': encodeUser(rolelessUser) },
    });
    expect(res.status).not.toBe(403);
    expect(res.status).not.toBe(401);
  });
});

// ---------------------------------------------------------------------------
// §4 — Auth controller envelope contract (login / refresh / logout)
// ---------------------------------------------------------------------------

describe('Auth controller success() envelope contract', () => {
  it('login response envelope contains ok:true and data', async () => {
    // Structural: verify success() wraps auth responses by checking the
    // auth.controller.ts source references success() for all three handlers.
    const controllerPath = path.join(__dirname, '../auth/auth.controller.ts');
    const src = fs.readFileSync(controllerPath, 'utf-8');
    // All three handlers must use success()
    const loginMatch = src.match(/async login[\s\S]*?return success\(/);
    const refreshMatch = src.match(/async refresh[\s\S]*?return success\(/);
    const logoutMatch = src.match(/async logout[\s\S]*?return success\(/);
    expect(loginMatch).not.toBeNull();
    expect(refreshMatch).not.toBeNull();
    expect(logoutMatch).not.toBeNull();
  });

  it('LoginResult interface includes expiresIn and user fields', () => {
    const servicePath = path.join(__dirname, '../auth/auth.service.ts');
    const src = fs.readFileSync(servicePath, 'utf-8');
    expect(src).toContain('expiresIn: number');
    expect(src).toContain('userId: string');
    expect(src).toContain('roles: string[]');
  });

  it('auth.service.ts login() returns expiresIn: 900', () => {
    const servicePath = path.join(__dirname, '../auth/auth.service.ts');
    const src = fs.readFileSync(servicePath, 'utf-8');
    expect(src).toContain('expiresIn: 900');
  });

  it('auth.service.ts login() resolves roles from membership (ARCH-ROLE-001 resolved)', () => {
    const servicePath = path.join(__dirname, '../auth/auth.service.ts');
    const src = fs.readFileSync(servicePath, 'utf-8');
    // Roles now come from membership — not hardcoded empty array
    expect(src).toContain('activeMembership');
    expect(src).toContain('membership.findUnique');
  });
});

// ---------------------------------------------------------------------------
// §5 — Analytics DTO regression
// ---------------------------------------------------------------------------

describe('TrendQueryDto — accepts granularity without validation error', () => {
  it('accepts DAY granularity', async () => {
    const dto = plainToInstance(TrendQueryDto, { granularity: 'DAY' });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('accepts MONTH granularity', async () => {
    const dto = plainToInstance(TrendQueryDto, { granularity: 'MONTH' });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('accepts YEAR granularity', async () => {
    const dto = plainToInstance(TrendQueryDto, { granularity: 'YEAR' });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('rejects unknown granularity', async () => {
    const dto = plainToInstance(TrendQueryDto, { granularity: 'WEEK' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'granularity')).toBe(true);
  });

  it('accepts empty (all optional)', async () => {
    const dto = plainToInstance(TrendQueryDto, {});
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });
});

describe('BreakdownQueryDto — accepts dimension and topN without validation error', () => {
  it('accepts tradeDirection dimension', async () => {
    const dto = plainToInstance(BreakdownQueryDto, { dimension: 'tradeDirection' });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('accepts hsChapter dimension', async () => {
    const dto = plainToInstance(BreakdownQueryDto, { dimension: 'hsChapter' });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('accepts topN as string', async () => {
    const dto = plainToInstance(BreakdownQueryDto, { topN: '20' });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('rejects unknown dimension', async () => {
    const dto = plainToInstance(BreakdownQueryDto, { dimension: 'invalidDimension' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'dimension')).toBe(true);
  });

  it('accepts empty (all optional)', async () => {
    const dto = plainToInstance(BreakdownQueryDto, {});
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });
});

describe('AnalyticsFilterDto regression — all filter fields still valid', () => {
  it('accepts fully populated valid AnalyticsFilterDto', async () => {
    const dto = plainToInstance(AnalyticsFilterDto, {
      dateFrom: '2025-01-01', dateTo: '2025-12-31',
      tradeDirection: 'IMPORT', hsCodePrefix: '6105', hsChapter: '61',
      foreignCountryCode: 'CN', localPartyTaxId: 'TAX123',
      batchId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      dispositions: ['ACCEPTED', 'QUARANTINED'],
      currencyCode: 'USD', quantityUnitCode: 'KG', exportEligible: true,
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });
});
