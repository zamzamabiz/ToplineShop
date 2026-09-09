/**
 * ToplineShop backend — testing utility for PrismaService.
 *
 * P7-008 Testing Foundation. Provides a single, reusable call-tracking mock
 * for the Prisma surface that P5-003 → P5-007 read services and P7-004 → P7-007
 * write services actually use. Replaces the per-script `createMockPrisma()`
 * that was duplicated across `backend/scripts/test-tenant-create.js`,
 * `test-vendor-create.js`, `test-category-create.js`, and
 * `test-product-create.js`.
 *
 * The mock is intentionally a plain object (not a class) and intentionally
 * does NOT extend `PrismaClient`. Tests are unit tests, not database tests.
 * The companion `test.module.ts` wires this mock into the real NestJS DI
 * container so services can be exercised end-to-end without a live database.
 */

export interface TenantSeed {
  id: string;
  slug?: string;
  tenantId?: string;
  [k: string]: unknown;
}

export interface VendorSeed {
  id: string;
  slug?: string;
  tenantId?: string;
  [k: string]: unknown;
}

export interface CategorySeed {
  id: string;
  slug?: string;
  tenantId?: string;
  [k: string]: unknown;
}

export interface ProductSeed {
  id: string;
  slug?: string;
  tenantId?: string;
  [k: string]: unknown;
}

export interface PrismaMockSeed {
  tenants?: TenantSeed[];
  vendors?: VendorSeed[];
  categories?: CategorySeed[];
  products?: ProductSeed[];
}

export interface PrismaCallLog {
  // Intentionally `any[]` — call-log entries are full Prisma query shapes
  // (e.g. `{ where: { tenantId, slug }, select: {...} }`) and tests should
  // be free to drill into them. Strong typing here only adds noise.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tenant: { findUnique: any[]; findFirst: any[]; findMany: any[]; create: any[] };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  vendor: { findUnique: any[]; findFirst: any[]; findMany: any[]; create: any[] };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  category: { findUnique: any[]; findFirst: any[]; findMany: any[]; create: any[] };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  product: { findUnique: any[]; findFirst: any[]; findMany: any[]; create: any[] };
}

export interface PrismaServiceMock {
  _calls: PrismaCallLog;
  _entities: {
    tenants: TenantSeed[];
    vendors: VendorSeed[];
    categories: CategorySeed[];
    products: ProductSeed[];
  };
  tenant: {
    findUnique: (args: { where: Record<string, unknown> }) => Promise<TenantSeed | null>;
    findFirst: (args: { where: Record<string, unknown> }) => Promise<TenantSeed | null>;
    findMany: (args?: { where?: Record<string, unknown> }) => Promise<TenantSeed[]>;
    create: (args: { data: Record<string, unknown> }) => Promise<TenantSeed>;
  };
  vendor: {
    findUnique: (args: { where: Record<string, unknown> }) => Promise<VendorSeed | null>;
    findFirst: (args: { where: Record<string, unknown> }) => Promise<VendorSeed | null>;
    findMany: (args?: { where?: Record<string, unknown> }) => Promise<VendorSeed[]>;
    create: (args: { data: Record<string, unknown> }) => Promise<VendorSeed>;
  };
  category: {
    findUnique: (args: { where: Record<string, unknown> }) => Promise<CategorySeed | null>;
    findFirst: (args: { where: Record<string, unknown> }) => Promise<CategorySeed | null>;
    findMany: (args?: { where?: Record<string, unknown> }) => Promise<CategorySeed[]>;
    create: (args: { data: Record<string, unknown> }) => Promise<CategorySeed>;
  };
  product: {
    findUnique: (args: { where: Record<string, unknown> }) => Promise<ProductSeed | null>;
    findFirst: (args: { where: Record<string, unknown> }) => Promise<ProductSeed | null>;
    findMany: (args?: { where?: Record<string, unknown> }) => Promise<ProductSeed[]>;
    create: (args: { data: Record<string, unknown> }) => Promise<ProductSeed>;
  };
}

function findOneByWhere<T extends { id?: string; slug?: string }>(
  collection: T[],
  where: Record<string, unknown> | undefined,
): T | null {
  if (!where) return null;
  if (where.id !== undefined) {
    return collection.find((x) => x.id === where.id) || null;
  }
  if (where.slug !== undefined) {
    return collection.find((x) => x.slug === where.slug) || null;
  }
  return null;
}

function findFirstByComposite<T extends { tenantId?: string; slug?: string }>(
  collection: T[],
  where: Record<string, unknown> | undefined,
): T | null {
  if (!where) return null;
  return (
    collection.find(
      (x) =>
        (where.tenantId === undefined || x.tenantId === where.tenantId) &&
        (where.slug === undefined || x.slug === where.slug),
    ) || null
  );
}

function makeCreate<T extends { id: string; [k: string]: unknown }>(
  collection: T[],
  idPrefix: string,
  callLog: unknown[],
) {
  return async (args: { data: Record<string, unknown> }): Promise<T> => {
    callLog.push(args);
    const created = {
      id: `${idPrefix}-${collection.length + 1}`,
      ...args.data,
      createdAt: new Date(),
    } as unknown as T;
    collection.push(created);
    return created;
  };
}

export function createPrismaMock(seed: PrismaMockSeed = {}): PrismaServiceMock {
  const tenants = [...(seed.tenants || [])];
  const vendors = [...(seed.vendors || [])];
  const categories = [...(seed.categories || [])];
  const products = [...(seed.products || [])];

  const calls: PrismaCallLog = {
    tenant: { findUnique: [], findFirst: [], findMany: [], create: [] },
    vendor: { findUnique: [], findFirst: [], findMany: [], create: [] },
    category: { findUnique: [], findFirst: [], findMany: [], create: [] },
    product: { findUnique: [], findFirst: [], findMany: [], create: [] },
  };

  return {
    _calls: calls,
    _entities: { tenants, vendors, categories, products },
    tenant: {
      findUnique: async (args) => {
        calls.tenant.findUnique.push(args);
        return findOneByWhere(tenants, args.where);
      },
      findFirst: async (args) => {
        calls.tenant.findFirst.push(args);
        return findFirstByComposite(tenants, args.where);
      },
      findMany: async (args) => {
        calls.tenant.findMany.push(args || {});
        return [...tenants];
      },
      create: makeCreate(tenants, 'tenant', calls.tenant.create),
    },
    vendor: {
      findUnique: async (args) => {
        calls.vendor.findUnique.push(args);
        return findOneByWhere(vendors, args.where);
      },
      findFirst: async (args) => {
        calls.vendor.findFirst.push(args);
        return findFirstByComposite(vendors, args.where);
      },
      findMany: async (args) => {
        calls.vendor.findMany.push(args || {});
        return [...vendors];
      },
      create: makeCreate(vendors, 'vendor', calls.vendor.create),
    },
    category: {
      findUnique: async (args) => {
        calls.category.findUnique.push(args);
        return findOneByWhere(categories, args.where);
      },
      findFirst: async (args) => {
        calls.category.findFirst.push(args);
        return findFirstByComposite(categories, args.where);
      },
      findMany: async (args) => {
        calls.category.findMany.push(args || {});
        return [...categories];
      },
      create: makeCreate(categories, 'category', calls.category.create),
    },
    product: {
      findUnique: async (args) => {
        calls.product.findUnique.push(args);
        return findOneByWhere(products, args.where);
      },
      findFirst: async (args) => {
        calls.product.findFirst.push(args);
        return findFirstByComposite(products, args.where);
      },
      findMany: async (args) => {
        calls.product.findMany.push(args || {});
        return [...products];
      },
      create: makeCreate(products, 'product', calls.product.create),
    },
  };
}
