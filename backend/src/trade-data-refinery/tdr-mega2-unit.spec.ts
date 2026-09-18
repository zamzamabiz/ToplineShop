import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException, UnprocessableEntityException, UnauthorizedException } from '@nestjs/common';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ROLES_KEY } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/types/role.type';
import { TdrController } from './tdr.controller';
import { ReplayBatchDto } from './dto/replay-batch.dto';
import { computeFingerprintHash } from './utils/fingerprint.util';
import { isValidTransition, CANCELLABLE_STATUSES, REPLAYABLE_STATUSES } from './types/batch-transition';
import { TenantModuleService } from './services/tenant-module.service';
import { TenantModuleGuard } from './guards/tenant-module.guard';
import { TdrJobOrchestratorService } from './services/tdr-job-orchestrator.service';
import { TdrProcessorService } from './services/tdr-processor.service';
import { TdrService } from './services/tdr.service';
import { NOT_IMPLEMENTED } from './types/tdr-job-handler.interface';

// ─────────────────────────────────────────────
// helpers
// ─────────────────────────────────────────────
function makePrismaMock() {
  const tenantModule = { findUnique: jest.fn() };
  const tdrBatch = {
    groupBy: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    create: jest.fn(),
  };
  const tdrProcessingJob = {
    update: jest.fn(),
    updateMany: jest.fn(),
    create: jest.fn(),
  };
  return {
    tenantModule,
    tdrBatch,
    tdrProcessingJob,
    $transaction: jest.fn().mockImplementation(async (arg: unknown) => {
      if (typeof arg === 'function') return arg({ tenantModule, tdrBatch, tdrProcessingJob, $queryRaw: jest.fn().mockResolvedValue([]) });
      if (Array.isArray(arg)) return Promise.all(arg);
      return arg;
    }),
    $queryRaw: jest.fn().mockResolvedValue([]),
  };
}

const mockAuditService = { recordEvent: jest.fn().mockResolvedValue(undefined) };

// ─────────────────────────────────────────────
// 1. fingerprint utility
// ─────────────────────────────────────────────
describe('computeFingerprintHash', () => {
  const base = {
    tenantId: 'tenant-1',
    contentHash: 'abc123',
    mappingVersion: '1.0.0',
    parserVersion: '1.0.0',
    normalizationVersion: '1.0.0',
    validationVersion: '1.0.0',
  };

  it('returns a 64-char hex string', () => {
    expect(computeFingerprintHash(base)).toMatch(/^[0-9a-f]{64}$/);
  });

  it('same inputs produce same hash (deterministic)', () => {
    expect(computeFingerprintHash(base)).toBe(computeFingerprintHash({ ...base }));
  });

  it('different tenantId produces different hash', () => {
    expect(computeFingerprintHash(base)).not.toBe(
      computeFingerprintHash({ ...base, tenantId: 'tenant-2' }),
    );
  });

  it('different version produces different hash', () => {
    expect(computeFingerprintHash(base)).not.toBe(
      computeFingerprintHash({ ...base, parserVersion: '2.0.0' }),
    );
  });
});

// ─────────────────────────────────────────────
// 2. batch status transitions
// ─────────────────────────────────────────────
describe('batch status transitions', () => {
  it('RECEIVED → QUEUED is valid', () => expect(isValidTransition('RECEIVED', 'QUEUED')).toBe(true));
  it('QUEUED → PROCESSING is valid', () => expect(isValidTransition('QUEUED', 'PROCESSING')).toBe(true));
  it('READY → RECEIVED is invalid', () => expect(isValidTransition('READY', 'RECEIVED')).toBe(false));
  it('FAILED terminal — no valid transitions', () => expect(isValidTransition('FAILED', 'QUEUED')).toBe(false));
  it('CANCELLED terminal — no valid transitions', () => expect(isValidTransition('CANCELLED', 'RECEIVED')).toBe(false));

  it('CANCELLABLE_STATUSES contains RECEIVED, QUEUED, PROCESSING', () => {
    expect(CANCELLABLE_STATUSES).toEqual(expect.arrayContaining(['RECEIVED', 'QUEUED', 'PROCESSING']));
    expect(CANCELLABLE_STATUSES).toHaveLength(3);
  });

  it('REPLAYABLE_STATUSES contains READY, PARTIAL, FAILED, EXPORTED', () => {
    expect(REPLAYABLE_STATUSES).toEqual(expect.arrayContaining(['READY', 'PARTIAL', 'FAILED', 'EXPORTED']));
  });
});

// ─────────────────────────────────────────────
// 3. TenantModuleGuard
// ─────────────────────────────────────────────
describe('TenantModuleGuard', () => {
  let guard: TenantModuleGuard;
  let svc: TenantModuleService;
  let mockPrisma: ReturnType<typeof makePrismaMock>;

  beforeEach(async () => {
    mockPrisma = makePrismaMock();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantModuleGuard,
        TenantModuleService,
        { provide: 'PrismaService', useValue: mockPrisma },
      ],
    })
      .overrideProvider(TenantModuleService)
      .useFactory({
        factory: () => {
          svc = new TenantModuleService(mockPrisma as never);
          return svc;
        },
      })
      .compile();
    guard = module.get(TenantModuleGuard);
  });

  function makeContext(user: unknown): ExecutionContext {
    return {
      switchToHttp: () => ({ getRequest: () => ({ user }) }),
    } as unknown as ExecutionContext;
  }

  it('throws UnauthorizedException when user is missing', async () => {
    await expect(guard.canActivate(makeContext(undefined))).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('authenticated user without tenantId throws ForbiddenException (not 401)', async () => {
    await expect(guard.canActivate(makeContext({ userId: 'u1' }))).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('throws ForbiddenException when module not enabled', async () => {
    mockPrisma.tenantModule.findUnique.mockResolvedValue({ enabled: false });
    await expect(guard.canActivate(makeContext({ tenantId: 't1' }))).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('returns true when module is enabled', async () => {
    mockPrisma.tenantModule.findUnique.mockResolvedValue({ enabled: true });
    await expect(guard.canActivate(makeContext({ tenantId: 't1' }))).resolves.toBe(true);
  });

  it('throws ForbiddenException when no tenantModule record exists', async () => {
    mockPrisma.tenantModule.findUnique.mockResolvedValue(null);
    await expect(guard.canActivate(makeContext({ tenantId: 't1' }))).rejects.toBeInstanceOf(ForbiddenException);
  });
});

// ─────────────────────────────────────────────
// 4. TdrJobOrchestratorService
// ─────────────────────────────────────────────
describe('TdrJobOrchestratorService', () => {
  let orchestrator: TdrJobOrchestratorService;
  let mockPrisma: ReturnType<typeof makePrismaMock>;

  beforeEach(() => {
    mockPrisma = makePrismaMock();
    orchestrator = new TdrJobOrchestratorService(mockPrisma as never);
  });

  it('leaseNextJob returns null when no PENDING jobs', async () => {
    const txMock = { $queryRaw: jest.fn().mockResolvedValue([]), tdrProcessingJob: { update: jest.fn() } };
    mockPrisma.$transaction.mockImplementation(async (fn: (tx: typeof txMock) => Promise<unknown>) => fn(txMock));
    const result = await orchestrator.leaseNextJob('worker-1');
    expect(result).toBeNull();
    expect(txMock.tdrProcessingJob.update).not.toHaveBeenCalled();
  });

  it('leaseNextJob leases a found PENDING job', async () => {
    const jobRow = { id: 'job-1', batch_id: 'batch-1', tenant_id: 'tenant-1', lease_duration_ms: 300000 };
    const updatedJob = { id: 'job-1', status: 'LEASED', batchId: 'batch-1', tenantId: 'tenant-1' };
    const txMock = {
      $queryRaw: jest.fn().mockResolvedValue([jobRow]),
      tdrProcessingJob: { update: jest.fn().mockResolvedValue(updatedJob) },
    };
    mockPrisma.$transaction.mockImplementation(async (fn: (tx: typeof txMock) => Promise<unknown>) => fn(txMock));
    const result = await orchestrator.leaseNextJob('worker-1');
    expect(result).toEqual(updatedJob);
    expect(txMock.tdrProcessingJob.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'LEASED', workerInstanceId: 'worker-1' }) }),
    );
  });

  it('heartbeat calls updateMany with correct filter', async () => {
    mockPrisma.tdrProcessingJob.updateMany.mockResolvedValue({ count: 1 });
    await orchestrator.heartbeat('job-1', 'worker-1');
    expect(mockPrisma.tdrProcessingJob.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'job-1', workerInstanceId: 'worker-1', status: 'LEASED' } }),
    );
  });

  it('completeJob sets job COMPLETED and batch READY', async () => {
    mockPrisma.tdrProcessingJob.update.mockResolvedValue({ batchId: 'batch-1' });
    mockPrisma.tdrBatch.update.mockResolvedValue({ id: 'batch-1', status: 'READY' });
    await orchestrator.completeJob('job-1');
    expect(mockPrisma.tdrProcessingJob.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'COMPLETED' }) }),
    );
    expect(mockPrisma.tdrBatch.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'READY' }) }),
    );
  });

  it('failJob sets job FAILED and batch FAILED', async () => {
    mockPrisma.tdrProcessingJob.update.mockResolvedValue({ batchId: 'batch-1' });
    mockPrisma.tdrBatch.update.mockResolvedValue({ id: 'batch-1', status: 'FAILED' });
    await orchestrator.failJob('job-1', 'parse error');
    expect(mockPrisma.tdrBatch.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: 'FAILED' } }),
    );
  });

  it('releaseLease resets job back to PENDING', async () => {
    mockPrisma.tdrProcessingJob.updateMany.mockResolvedValue({ count: 1 });
    await orchestrator.releaseLease('job-1');
    expect(mockPrisma.tdrProcessingJob.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'PENDING' }) }),
    );
  });

  it('reclaimExpiredLeases returns count of reclaimed jobs', async () => {
    mockPrisma.tdrProcessingJob.updateMany.mockResolvedValue({ count: 2 });
    const count = await orchestrator.reclaimExpiredLeases();
    expect(count).toBe(2);
  });

  it('checkpoint updates lastCheckpointRow', async () => {
    mockPrisma.tdrProcessingJob.updateMany.mockResolvedValue({ count: 1 });
    await orchestrator.checkpoint('job-1', 'worker-1', 250);
    expect(mockPrisma.tdrProcessingJob.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ lastCheckpointRow: 250 }) }),
    );
  });
});

// ─────────────────────────────────────────────
// 5. TdrProcessorService
// ─────────────────────────────────────────────
describe('TdrProcessorService', () => {
  let processor: TdrProcessorService;
  let orchestrator: jest.Mocked<TdrJobOrchestratorService>;

  beforeEach(() => {
    orchestrator = {
      leaseNextJob: jest.fn().mockResolvedValue(null),
      releaseLease: jest.fn().mockResolvedValue(undefined),
      failJob: jest.fn().mockResolvedValue(undefined),
      reclaimExpiredLeases: jest.fn().mockResolvedValue(0),
    } as unknown as jest.Mocked<TdrJobOrchestratorService>;
    processor = new TdrProcessorService(orchestrator);
  });

  afterEach(() => processor.stopPolling());

  it('starts polling and sets isPolling=true', () => {
    processor.startPolling();
    expect(processor.isPolling()).toBe(true);
  });

  it('calling startPolling twice does not create a second timer', () => {
    processor.startPolling();
    processor.startPolling();
    expect(processor.isPolling()).toBe(true);
    processor.stopPolling();
    expect(processor.isPolling()).toBe(false);
  });

  it('stopPolling sets isPolling=false', () => {
    processor.startPolling();
    processor.stopPolling();
    expect(processor.isPolling()).toBe(false);
  });

  it('handler defaults to NOT_IMPLEMENTED sentinel', () => {
    expect((processor as unknown as { handler: symbol }).handler).toBe(NOT_IMPLEMENTED);
  });

  it('registerHandler replaces the NOT_IMPLEMENTED sentinel', () => {
    const handler = { handle: jest.fn() };
    processor.registerHandler(handler);
    expect((processor as unknown as { handler: typeof handler }).handler).toBe(handler);
  });
});

// ─────────────────────────────────────────────
// 6. TdrService
// ─────────────────────────────────────────────
describe('TdrService', () => {
  let service: TdrService;
  let mockPrisma: ReturnType<typeof makePrismaMock>;
  let tenantModuleService: TenantModuleService;

  beforeEach(() => {
    mockPrisma = makePrismaMock();
    tenantModuleService = new TenantModuleService(mockPrisma as never);
    service = new TdrService(mockPrisma as never, mockAuditService as never, tenantModuleService);
  });

  it('getStatus returns moduleEnabled and batchSummary', async () => {
    mockPrisma.tenantModule.findUnique.mockResolvedValue({ enabled: true });
    mockPrisma.tdrBatch.groupBy.mockResolvedValue([
      { status: 'READY', _count: { id: 3 } },
      { status: 'FAILED', _count: { id: 1 } },
    ]);
    const res = await service.getStatus('t1', 'u1');
    expect(res.data.moduleEnabled).toBe(true);
    expect(res.data.batchSummary).toEqual({ READY: 3, FAILED: 1 });
  });

  it('listBatches returns paginated results', async () => {
    mockPrisma.tdrBatch.findMany.mockResolvedValue([{ id: 'b1' }]);
    mockPrisma.tdrBatch.count.mockResolvedValue(1);
    const res = await service.listBatches('t1', { page: 1, pageSize: 25 });
    expect(res.data).toHaveLength(1);
    expect(res.meta).toMatchObject({ page: 1, total: 1 });
  });

  it('getBatch throws NotFoundException for unknown batch', async () => {
    mockPrisma.tdrBatch.findFirst.mockResolvedValue(null);
    await expect(service.getBatch('x', 't1')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('getBatch enforces tenant isolation via findFirst where clause', async () => {
    mockPrisma.tdrBatch.findFirst.mockResolvedValue({ id: 'b1', processingJob: null });
    await service.getBatch('b1', 't1');
    expect(mockPrisma.tdrBatch.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'b1', tenantId: 't1' } }),
    );
  });

  it('cancelBatch throws UnprocessableEntityException for terminal status', async () => {
    mockPrisma.tdrBatch.findFirst.mockResolvedValue({ id: 'b1', status: 'READY' });
    await expect(service.cancelBatch('b1', 't1', 'u1')).rejects.toBeInstanceOf(UnprocessableEntityException);
  });

  it('cancelBatch succeeds for QUEUED batch', async () => {
    mockPrisma.tdrBatch.findFirst.mockResolvedValue({ id: 'b1', status: 'QUEUED' });
    mockPrisma.tdrBatch.update.mockResolvedValue({ id: 'b1', status: 'CANCELLED' });
    mockPrisma.tdrProcessingJob.updateMany.mockResolvedValue({ count: 1 });
    mockPrisma.$transaction.mockImplementation(async (arg: unknown) => {
      if (Array.isArray(arg)) return Promise.all(arg.map(() => ({ count: 1 })));
      return (arg as () => unknown)();
    });
    const res = await service.cancelBatch('b1', 't1', 'u1');
    expect(res.data.cancelled).toBe(true);
    expect(mockAuditService.recordEvent).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'tdr.batch.cancelled' }),
    );
  });

  it('replayBatch throws NotFoundException for unknown batch', async () => {
    mockPrisma.tdrBatch.findFirst.mockResolvedValue(null);
    await expect(service.replayBatch('x', 't1', 'u1', { reason: 'retry' })).rejects.toBeInstanceOf(NotFoundException);
  });

  it('replayBatch throws UnprocessableEntityException for RECEIVED status', async () => {
    mockPrisma.tdrBatch.findFirst.mockResolvedValue({ id: 'b1', status: 'RECEIVED' });
    await expect(service.replayBatch('b1', 't1', 'u1', { reason: 'retry' })).rejects.toBeInstanceOf(UnprocessableEntityException);
  });

  it('replayBatch creates new batch + job and fires audit event', async () => {
    mockPrisma.tdrBatch.findFirst.mockResolvedValue({
      id: 'b1',
      status: 'FAILED',
      sourceFileId: 'sf1',
      mappingId: null,
      tradeDirection: 'IMPORT',
      mappingVersion: '1.0.0',
      parserVersion: '1.0.0',
      normalizationVersion: '1.0.0',
      validationVersion: '1.0.0',
      storeSourceRows: false,
      processingConfig: null,
      sourceFile: { contentHash: 'deadbeef' },
    });
    mockPrisma.tdrBatch.create.mockResolvedValue({ id: 'b2' });
    mockPrisma.tdrProcessingJob.create.mockResolvedValue({ id: 'j2' });
    const res = await service.replayBatch('b1', 't1', 'u1', { reason: 'retry' });
    expect(res.data.replayBatchId).toBe('b2');
    expect(mockPrisma.tdrBatch.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ replayOfBatchId: 'b1', status: 'RECEIVED' }) }),
    );
    expect(mockAuditService.recordEvent).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'tdr.batch.replayed', entityId: 'b2' }),
    );
  });
});

// ─────────────────────────────────────────────
// 7. RBAC contracts — cancel and replay
// ─────────────────────────────────────────────
describe('RolesGuard — cancel/replay RBAC enforcement', () => {
  let rolesGuard: RolesGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RolesGuard, Reflector],
    }).compile();
    rolesGuard = module.get(RolesGuard);
  });

  function makeCtxForMethod(
    methodFn: (...args: unknown[]) => unknown,
    roles: string[],
    tenantId = 't1',
  ): ExecutionContext {
    return {
      switchToHttp: () => ({ getRequest: () => ({ user: { roles, tenantId } }) }),
      getHandler: () => methodFn,
      getClass: () => TdrController,
    } as unknown as ExecutionContext;
  }

  // cancel
  it('cancel: TENANT_ADMIN is allowed', () => {
    expect(rolesGuard.canActivate(makeCtxForMethod(TdrController.prototype.cancelBatch, [Role.TENANT_ADMIN]))).toBe(true);
  });

  it('cancel: SUPER_ADMIN is allowed', () => {
    expect(rolesGuard.canActivate(makeCtxForMethod(TdrController.prototype.cancelBatch, [Role.SUPER_ADMIN]))).toBe(true);
  });

  it('cancel: IMPORT_MANAGER receives 403', () => {
    expect(() =>
      rolesGuard.canActivate(makeCtxForMethod(TdrController.prototype.cancelBatch, [Role.IMPORT_MANAGER])),
    ).toThrow(ForbiddenException);
  });

  it('cancel: VIEWER receives 403', () => {
    expect(() =>
      rolesGuard.canActivate(makeCtxForMethod(TdrController.prototype.cancelBatch, [Role.VIEWER])),
    ).toThrow(ForbiddenException);
  });

  // replay
  it('replay: SUPER_ADMIN is allowed', () => {
    expect(rolesGuard.canActivate(makeCtxForMethod(TdrController.prototype.replayBatch, [Role.SUPER_ADMIN]))).toBe(true);
  });

  it('replay: TENANT_ADMIN is allowed', () => {
    expect(rolesGuard.canActivate(makeCtxForMethod(TdrController.prototype.replayBatch, [Role.TENANT_ADMIN]))).toBe(true);
  });

  it('replay: IMPORT_MANAGER receives 403 (PM-006 remains OPEN)', () => {
    expect(() =>
      rolesGuard.canActivate(makeCtxForMethod(TdrController.prototype.replayBatch, [Role.IMPORT_MANAGER])),
    ).toThrow(ForbiddenException);
  });

  it('replay: ANALYST receives 403', () => {
    expect(() =>
      rolesGuard.canActivate(makeCtxForMethod(TdrController.prototype.replayBatch, [Role.ANALYST])),
    ).toThrow(ForbiddenException);
  });

  it('cancel and replay metadata does not include IMPORT_MANAGER', () => {
    const cancelRoles: string[] = Reflect.getMetadata(ROLES_KEY, TdrController.prototype.cancelBatch);
    const replayRoles: string[] = Reflect.getMetadata(ROLES_KEY, TdrController.prototype.replayBatch);
    expect(cancelRoles).not.toContain(Role.IMPORT_MANAGER);
    expect(replayRoles).not.toContain(Role.IMPORT_MANAGER);
    expect(cancelRoles).toEqual([Role.SUPER_ADMIN, Role.TENANT_ADMIN]);
    expect(replayRoles).toEqual([Role.SUPER_ADMIN, Role.TENANT_ADMIN]);
  });
});

// ─────────────────────────────────────────────
// 8. ReplayBatchDto validation
// ─────────────────────────────────────────────
describe('ReplayBatchDto validation', () => {
  it('missing reason fails validation', async () => {
    const dto = plainToInstance(ReplayBatchDto, {});
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'reason')).toBe(true);
  });

  it('empty string reason fails validation', async () => {
    const dto = plainToInstance(ReplayBatchDto, { reason: '' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'reason')).toBe(true);
  });

  it('reason over 500 characters fails validation', async () => {
    const dto = plainToInstance(ReplayBatchDto, { reason: 'x'.repeat(501) });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'reason')).toBe(true);
  });

  it('valid bounded reason passes validation', async () => {
    const dto = plainToInstance(ReplayBatchDto, { reason: 'Fix import mapping for Q3 customs data' });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('reason of exactly 500 characters passes validation', async () => {
    const dto = plainToInstance(ReplayBatchDto, { reason: 'x'.repeat(500) });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });
});
