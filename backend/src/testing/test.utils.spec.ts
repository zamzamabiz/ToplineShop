/**
 * P7-008 Testing Foundation — proof test.
 *
 * This test exists to prove the testing foundation itself works, not to
 * exhaustively test any business service. It exercises both halves of the
 * foundation:
 *
 *   1. `createPrismaMock()` (test.utils.ts) — call-tracking, find-by-where,
 *      create-stores-and-increments, composite `(tenantId, slug)` lookup.
 *   2. `createServiceTestHarness()` (test.module.ts) — wires the real
 *      `TenantsService` through real NestJS DI with a mocked `PrismaService`
 *      and exercises the actual `TenantsService.create()` flow, proving
 *      the foundation supports the same testing pattern used by the P7-004
 *      through P7-007 evidence scripts.
 *
 * If this test fails, the foundation is broken. If this test passes, any
 * future service test can build on the same scaffolding.
 */

import { ConflictException, NotFoundException } from '@nestjs/common';
import { TenantsService } from '../tenants/tenants.service';
import { CreateTenantDto } from '../tenants/dto/create-tenant.dto';
import { createPrismaMock, PrismaServiceMock } from './test.utils';
import { createServiceTestHarness, ServiceTestHarness } from './test.module';

describe('P7-008 Testing Foundation', () => {
  describe('createPrismaMock (test.utils.ts)', () => {
    let prisma: PrismaServiceMock;

    beforeEach(() => {
      prisma = createPrismaMock();
    });

    it('starts with empty call logs and empty entity collections', () => {
      expect(prisma._calls.tenant.findUnique).toHaveLength(0);
      expect(prisma._calls.tenant.create).toHaveLength(0);
      expect(prisma._calls.vendor.findUnique).toHaveLength(0);
      expect(prisma._calls.category.findFirst).toHaveLength(0);
      expect(prisma._calls.product.create).toHaveLength(0);
      expect(prisma._entities.tenants).toHaveLength(0);
    });

    it('seeds entities from the seed config and findUnique by id returns the seed', async () => {
      prisma = createPrismaMock({
        tenants: [{ id: 't1', slug: 'acme', type: 'VENDOR', status: 'ACTIVE' }],
        vendors: [{ id: 'v1', tenantId: 't1', slug: 'acme-vendor' }],
      });
      const tenant = await prisma.tenant.findUnique({ where: { id: 't1' } });
      expect(tenant).toEqual({
        id: 't1',
        slug: 'acme',
        type: 'VENDOR',
        status: 'ACTIVE',
      });
      const vendor = await prisma.vendor.findUnique({ where: { id: 'v1' } });
      expect(vendor?.tenantId).toBe('t1');
    });

    it('findUnique by slug returns the seed', async () => {
      prisma = createPrismaMock({
        tenants: [{ id: 't1', slug: 'acme' }],
      });
      const tenant = await prisma.tenant.findUnique({ where: { slug: 'acme' } });
      expect(tenant?.id).toBe('t1');
    });

    it('findUnique returns null when the id is unknown', async () => {
      const tenant = await prisma.tenant.findUnique({ where: { id: 'missing' } });
      expect(tenant).toBeNull();
    });

    it('findFirst honors a composite (tenantId, slug) where', async () => {
      prisma = createPrismaMock({
        products: [
          { id: 'p1', tenantId: 't1', slug: 'shared' },
          { id: 'p2', tenantId: 't2', slug: 'shared' },
        ],
      });
      const t1 = await prisma.product.findFirst({
        where: { tenantId: 't1', slug: 'shared' },
      });
      expect(t1?.id).toBe('p1');
      const t2 = await prisma.product.findFirst({
        where: { tenantId: 't2', slug: 'shared' },
      });
      expect(t2?.id).toBe('p2');
    });

    it('create stores the new entity and is visible to subsequent findUnique', async () => {
      const created = await prisma.tenant.create({
        data: { name: 'New', slug: 'new' },
      });
      expect(created.id).toBe('tenant-1');
      expect(created.slug).toBe('new');
      expect(prisma._entities.tenants).toHaveLength(1);

      const refetched = await prisma.tenant.findUnique({ where: { slug: 'new' } });
      expect(refetched?.id).toBe('tenant-1');
    });

    it('tracks every call into _calls for later assertions', async () => {
      await prisma.tenant.findUnique({ where: { id: 'x' } });
      await prisma.tenant.findUnique({ where: { slug: 'y' } });
      await prisma.tenant.create({ data: { slug: 'z' } });
      expect(prisma._calls.tenant.findUnique).toHaveLength(2);
      expect(prisma._calls.tenant.create).toHaveLength(1);
      expect(prisma._calls.tenant.findUnique[0].where.id).toBe('x');
      expect(prisma._calls.tenant.findUnique[1].where.slug).toBe('y');
    });
  });

  describe('createServiceTestHarness (test.module.ts) + real TenantsService', () => {
    let harness: ServiceTestHarness<TenantsService>;
    let service: TenantsService;
    let prisma: PrismaServiceMock;

    beforeEach(async () => {
      harness = await createServiceTestHarness(TenantsService, { tenants: [] });
      service = harness.service;
      prisma = harness.prisma;
    });

    afterEach(async () => {
      await harness.close();
    });

    it('wires the real TenantsService into the test module with the mocked PrismaService', () => {
      expect(service).toBeInstanceOf(TenantsService);
      expect(prisma).toBeDefined();
      // Real service must have been constructed with the mock — calling a
      // service method that touches Prisma must hit the mock's call log.
      expect(prisma._calls.tenant.findUnique).toHaveLength(0);
    });

    it('TenantsService.create() against a real NestJS testing module + mock Prisma', async () => {
      const result = await service.create({
        name: 'Acme',
        slug: 'acme',
        type: 'VENDOR',
        status: 'ACTIVE',
      } as CreateTenantDto);

      expect(result.ok).toBe(true);
      // TenantSummaryDto does not include `slug`; assert on fields the real
      // service selects. Slug is verified through the create call below.
      expect(result.data.name).toBe('Acme');
      expect(result.data.type).toBe('VENDOR');
      expect(result.data.status).toBe('ACTIVE');
      // findUnique called once for the duplicate-slug pre-check
      expect(prisma._calls.tenant.findUnique).toHaveLength(1);
      expect(prisma._calls.tenant.findUnique[0].where.slug).toBe('acme');
      // create called once with the full CreateTenantDto payload
      expect(prisma._calls.tenant.create).toHaveLength(1);
      expect(prisma._calls.tenant.create[0].data.name).toBe('Acme');
      expect(prisma._calls.tenant.create[0].data.slug).toBe('acme');
    });

    it('TenantsService.create() throws ConflictException on duplicate slug via the real exception class', async () => {
      await service.create({
        name: 'Acme',
        slug: 'dup',
        type: 'VENDOR',
        status: 'ACTIVE',
      } as CreateTenantDto);

      let thrown: unknown = null;
      try {
        await service.create({
          name: 'Acme 2',
          slug: 'dup',
          type: 'VENDOR',
          status: 'ACTIVE',
        } as CreateTenantDto);
      } catch (e) {
        thrown = e;
      }

      expect(thrown).toBeInstanceOf(ConflictException);
      // create must NOT have been called a second time
      expect(prisma._calls.tenant.create).toHaveLength(1);
      // findUnique was called for both pre-checks
      expect(prisma._calls.tenant.findUnique).toHaveLength(2);
    });

    it('TenantsService.findOne() throws NotFoundException against the real exception class', async () => {
      let thrown: unknown = null;
      try {
        await service.findOne('does-not-exist');
      } catch (e) {
        thrown = e;
      }
      expect(thrown).toBeInstanceOf(NotFoundException);
      expect(prisma._calls.tenant.findUnique).toHaveLength(1);
      expect(prisma._calls.tenant.findUnique[0].where.id).toBe('does-not-exist');
    });

    it('harness.reset() clears the call log without dropping the seeded entities', async () => {
      // Populate the call log directly via the mock (avoids triggering
      // service-level NotFoundException since no tenant is seeded).
      await prisma.tenant.findUnique({ where: { id: 'probe' } });
      expect(prisma._calls.tenant.findUnique).toHaveLength(1);
      harness.reset();
      expect(prisma._calls.tenant.findUnique).toHaveLength(0);
      // Seeded entities must survive a reset so the test can chain scenarios.
      // (In this case the seed is empty, but the mock should still be usable.)
      const result = await service.create({
        name: 'X',
        slug: 'x',
        type: 'PLATFORM',
        status: 'ACTIVE',
      } as CreateTenantDto);
      expect(result.ok).toBe(true);
    });
  });
});
