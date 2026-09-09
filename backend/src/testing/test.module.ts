/**
 * ToplineShop backend — service test harness.
 *
 * P7-008 Testing Foundation. Wraps `@nestjs/testing`'s `Test.createTestingModule`
 * with a PrismaService mock provider so individual services can be exercised
 * end-to-end (real DI, real service, mocked Prisma) without a live database
 * or HTTP listener.
 *
 * Usage:
 *   const harness = await createServiceTestHarness(TenantsService, { tenants: [] });
 *   const result = await harness.service.create({ ... });
 *   expect(harness.prisma._calls.tenant.create).toHaveLength(1);
 *   await harness.close();
 */

import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { PrismaServiceMock, PrismaMockSeed, createPrismaMock } from './test.utils';

export interface ServiceTestHarness<T> {
  module: TestingModule;
  service: T;
  prisma: PrismaServiceMock;
  /** Clear all call logs for a fresh assertion window within the same test. */
  reset: () => void;
  /** Close the underlying NestJS testing module and release resources. */
  close: () => Promise<void>;
}

export async function createServiceTestHarness<T>(
  serviceClass: new (...args: unknown[]) => T,
  seed: PrismaMockSeed = {},
): Promise<ServiceTestHarness<T>> {
  const prisma = createPrismaMock(seed);
  const moduleRef = await Test.createTestingModule({
    providers: [
      serviceClass,
      { provide: PrismaService, useValue: prisma },
    ],
  }).compile();

  const service = moduleRef.get<T>(serviceClass);

  return {
    module: moduleRef,
    service,
    prisma,
    reset: () => {
      for (const table of Object.values(prisma._calls)) {
        for (const arr of Object.values(table) as unknown[][]) {
          arr.length = 0;
        }
      }
    },
    close: () => moduleRef.close(),
  };
}
