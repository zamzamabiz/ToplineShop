/**
 * Test suite for Product Write API (POST /products)
 * Tests the actual CreateProductDto validation and the real ProductsService.create()
 * implementation (imported from compiled backend output), including successful
 * creation, tenant/vendor/category existence and same-tenant relationship
 * validation, duplicate (tenantId, slug) conflict behavior, decimal/currency/
 * inStock handling against a mocked PrismaService.
 *
 * Requires `npm run build` to have been run first (imports from ../dist).
 */

const { validate } = require('class-validator');
const { plainToInstance } = require('class-transformer');
const { NotFoundException, ConflictException } = require('@nestjs/common');

// Import the real DTO class from compiled output — no fallback: if this
// fails, the build is stale/missing and results would not reflect the
// real implementation.
const { CreateProductDto } = require('../dist/products/dto/create-product.dto');

// Import the real ProductsService from compiled output — same requirement.
const { ProductsService } = require('../dist/products/products.service');

let passed = 0;
let failed = 0;

function assert(condition, name) {
  if (condition) {
    console.log(`PASS: ${name}`);
    passed++;
  } else {
    console.log(`FAIL: ${name}`);
    failed++;
  }
}

function baseValidPayload(overrides = {}) {
  return Object.assign(
    {
      tenantId: 'tenant-1',
      vendorId: 'vendor-1',
      categoryId: 'category-1',
      name: 'Acme Widget',
      slug: 'acme-widget',
      status: 'ACTIVE',
      basePrice: 199.99,
    },
    overrides,
  );
}

async function testValidation() {
  console.log('=== Testing CreateProductDto Validation ===\n');

  // Test 1: Valid minimum input passes validation
  const validDto = plainToInstance(CreateProductDto, baseValidPayload());
  const validErrors = await validate(validDto);
  assert(validErrors.length === 0, 'Valid minimum input passes class-validator');

  // Test 2: Missing tenantId fails
  const noTenantDto = plainToInstance(CreateProductDto, baseValidPayload({ tenantId: undefined }));
  const noTenantErrors = await validate(noTenantDto);
  assert(noTenantErrors.length > 0, 'Missing tenantId fails validation');
  assert(noTenantErrors.some((e) => e.property === 'tenantId'), 'Missing tenantId error reported');

  // Test 3: Missing vendorId fails
  const noVendorDto = plainToInstance(CreateProductDto, baseValidPayload({ vendorId: undefined }));
  const noVendorErrors = await validate(noVendorDto);
  assert(noVendorErrors.length > 0, 'Missing vendorId fails validation');
  assert(noVendorErrors.some((e) => e.property === 'vendorId'), 'Missing vendorId error reported');

  // Test 4: Missing categoryId fails
  const noCategoryDto = plainToInstance(CreateProductDto, baseValidPayload({ categoryId: undefined }));
  const noCategoryErrors = await validate(noCategoryDto);
  assert(noCategoryErrors.length > 0, 'Missing categoryId fails validation');
  assert(noCategoryErrors.some((e) => e.property === 'categoryId'), 'Missing categoryId error reported');

  // Test 5: Missing name fails
  const noNameDto = plainToInstance(CreateProductDto, baseValidPayload({ name: undefined }));
  const noNameErrors = await validate(noNameDto);
  assert(noNameErrors.length > 0, 'Missing name fails validation');
  assert(noNameErrors.some((e) => e.property === 'name'), 'Missing name error reported');

  // Test 6: Empty name fails
  const emptyNameDto = plainToInstance(CreateProductDto, baseValidPayload({ name: '' }));
  const emptyNameErrors = await validate(emptyNameDto);
  assert(emptyNameErrors.length > 0, 'Empty name fails validation');

  // Test 7: Name > 255 chars fails
  const longNameDto = plainToInstance(
    CreateProductDto,
    baseValidPayload({ name: 'a'.repeat(256) }),
  );
  const longNameErrors = await validate(longNameDto);
  assert(longNameErrors.length > 0, 'Name > 255 chars fails validation');

  // Test 8: Missing slug fails
  const noSlugDto = plainToInstance(CreateProductDto, baseValidPayload({ slug: undefined }));
  const noSlugErrors = await validate(noSlugDto);
  assert(noSlugErrors.length > 0, 'Missing slug fails validation');
  assert(noSlugErrors.some((e) => e.property === 'slug'), 'Missing slug error reported');

  // Test 9: Invalid slug characters fail
  const badSlugDto = plainToInstance(CreateProductDto, baseValidPayload({ slug: 'Bad Slug!' }));
  const badSlugErrors = await validate(badSlugDto);
  assert(badSlugErrors.length > 0, 'Invalid slug characters fail validation');
  assert(badSlugErrors.some((e) => e.property === 'slug'), 'Invalid slug error reported');

  // Test 10: Missing basePrice fails
  const noPriceDto = plainToInstance(CreateProductDto, baseValidPayload({ basePrice: undefined }));
  const noPriceErrors = await validate(noPriceDto);
  assert(noPriceErrors.length > 0, 'Missing basePrice fails validation');
  assert(noPriceErrors.some((e) => e.property === 'basePrice'), 'Missing basePrice error reported');

  // Test 11: basePrice as string fails
  const strPriceDto = plainToInstance(
    CreateProductDto,
    baseValidPayload({ basePrice: '199.99' }),
  );
  const strPriceErrors = await validate(strPriceDto);
  assert(strPriceErrors.length > 0, 'basePrice as string fails validation');
  assert(strPriceErrors.some((e) => e.property === 'basePrice'), 'basePrice string error reported');

  // Test 12: Negative basePrice fails
  const negPriceDto = plainToInstance(CreateProductDto, baseValidPayload({ basePrice: -1 }));
  const negPriceErrors = await validate(negPriceDto);
  assert(negPriceErrors.length > 0, 'Negative basePrice fails validation');

  // Test 13: basePrice as NaN fails
  const nanPriceDto = plainToInstance(CreateProductDto, baseValidPayload({ basePrice: NaN }));
  const nanPriceErrors = await validate(nanPriceDto);
  assert(nanPriceErrors.length > 0, 'NaN basePrice fails validation');

  // Test 14: Zero basePrice is allowed
  const zeroPriceDto = plainToInstance(CreateProductDto, baseValidPayload({ basePrice: 0 }));
  const zeroPriceErrors = await validate(zeroPriceDto);
  assert(zeroPriceErrors.length === 0, 'Zero basePrice is valid (free products permitted at DTO level)');

  // Test 15: Invalid status fails
  const badStatusDto = plainToInstance(CreateProductDto, baseValidPayload({ status: 'DELETED' }));
  const badStatusErrors = await validate(badStatusDto);
  assert(badStatusErrors.length > 0, 'Invalid status fails validation');
  assert(badStatusErrors.some((e) => e.property === 'status'), 'Invalid status error reported');

  // Test 16: Valid DRAFT status
  const draftDto = plainToInstance(CreateProductDto, baseValidPayload({ status: 'DRAFT', slug: 'draft-product' }));
  const draftErrors = await validate(draftDto);
  assert(draftErrors.length === 0, 'DRAFT status is valid');

  // Test 17: Valid ARCHIVED status
  const archivedDto = plainToInstance(CreateProductDto, baseValidPayload({ status: 'ARCHIVED', slug: 'archived-product' }));
  const archivedErrors = await validate(archivedDto);
  assert(archivedErrors.length === 0, 'ARCHIVED status is valid');

  // Test 18: Valid ACTIVE status
  const activeDto = plainToInstance(CreateProductDto, baseValidPayload({ status: 'ACTIVE', slug: 'active-product' }));
  const activeErrors = await validate(activeDto);
  assert(activeErrors.length === 0, 'ACTIVE status is valid');

  // Test 19: Missing currency is allowed (defaults at service layer)
  const noCurrencyDto = plainToInstance(CreateProductDto, baseValidPayload({ slug: 'no-currency' }));
  const noCurrencyErrors = await validate(noCurrencyDto);
  assert(noCurrencyErrors.length === 0, 'Missing currency passes validation (defaulted later)');

  // Test 20: Lowercase currency fails
  const lowerCurrencyDto = plainToInstance(
    CreateProductDto,
    baseValidPayload({ slug: 'lower-currency', currency: 'ngn' }),
  );
  const lowerCurrencyErrors = await validate(lowerCurrencyDto);
  assert(lowerCurrencyErrors.length > 0, 'Lowercase currency fails validation');
  assert(lowerCurrencyErrors.some((e) => e.property === 'currency'), 'Lowercase currency error reported');

  // Test 21: 4-letter currency fails
  const longCurrencyDto = plainToInstance(
    CreateProductDto,
    baseValidPayload({ slug: 'long-currency', currency: 'NGNX' }),
  );
  const longCurrencyErrors = await validate(longCurrencyDto);
  assert(longCurrencyErrors.length > 0, '4-letter currency fails validation');

  // Test 22: Valid 3-letter uppercase currency passes
  const usdDto = plainToInstance(
    CreateProductDto,
    baseValidPayload({ slug: 'usd-product', currency: 'USD' }),
  );
  const usdErrors = await validate(usdDto);
  assert(usdErrors.length === 0, 'Valid 3-letter uppercase currency passes validation');

  // Test 23: Valid description optional
  const descDto = plainToInstance(
    CreateProductDto,
    baseValidPayload({ slug: 'desc-product', description: 'A great widget' }),
  );
  const descErrors = await validate(descDto);
  assert(descErrors.length === 0, 'Valid description passes validation');

  // Test 24: Description > 2000 chars fails
  const longDescDto = plainToInstance(
    CreateProductDto,
    baseValidPayload({ slug: 'long-desc', description: 'a'.repeat(2001) }),
  );
  const longDescErrors = await validate(longDescDto);
  assert(longDescErrors.length > 0, 'Description > 2000 chars fails validation');

  // Test 25: inStock as boolean optional
  const inStockFalseDto = plainToInstance(
    CreateProductDto,
    baseValidPayload({ slug: 'oos-product', inStock: false }),
  );
  const inStockFalseErrors = await validate(inStockFalseDto);
  assert(inStockFalseErrors.length === 0, 'inStock=false passes validation');

  // Test 26: inStock as string fails
  const inStockStrDto = plainToInstance(
    CreateProductDto,
    baseValidPayload({ slug: 'oos-string', inStock: 'no' }),
  );
  const inStockStrErrors = await validate(inStockStrDto);
  assert(inStockStrErrors.length > 0, 'inStock as string fails validation');
}

/**
 * Builds a mocked PrismaService-shaped dependency that records every call
 * made to tenant.findUnique() / vendor.findUnique() / category.findUnique()
 * / product.findFirst() / product.create() so tests can assert on exactly
 * what the real ProductsService did, not just its return value.
 */
function createMockPrisma(seedTenants = [], seedVendors = [], seedCategories = []) {
  const tenants = [...seedTenants];
  const vendors = [...seedVendors];
  const categories = [...seedCategories];
  const products = [];
  const calls = {
    tenantFindUnique: [],
    vendorFindUnique: [],
    categoryFindUnique: [],
    productFindFirst: [],
    productCreate: [],
  };

  function findByWhere(collection, where) {
    if (!where) return null;
    if (where.id !== undefined) {
      return collection.find((x) => x.id === where.id) || null;
    }
    if (where.slug !== undefined) {
      return collection.find((x) => x.slug === where.slug) || null;
    }
    return null;
  }

  return {
    _calls: calls,
    _products: products,
    tenant: {
      findUnique: async (args) => {
        calls.tenantFindUnique.push(args);
        return findByWhere(tenants, args.where) || null;
      },
    },
    vendor: {
      findUnique: async (args) => {
        calls.vendorFindUnique.push(args);
        return findByWhere(vendors, args.where) || null;
      },
    },
    category: {
      findUnique: async (args) => {
        calls.categoryFindUnique.push(args);
        return findByWhere(categories, args.where) || null;
      },
    },
    product: {
      findFirst: async (args) => {
        calls.productFindFirst.push(args);
        const where = args.where;
        const found = products.find(
          (p) =>
            (where.tenantId === undefined || p.tenantId === where.tenantId) &&
            (where.slug === undefined || p.slug === where.slug),
        );
        return found || null;
      },
      create: async (args) => {
        calls.productCreate.push(args);
        const product = {
          id: 'product-' + (products.length + 1),
          tenantId: args.data.tenantId,
          vendorId: args.data.vendorId,
          categoryId: args.data.categoryId,
          name: args.data.name,
          slug: args.data.slug,
          status: args.data.status,
          createdAt: new Date(),
        };
        products.push(product);
        return product;
      },
    },
  };
}

async function testRealServiceBehavior() {
  console.log('\n=== Testing REAL ProductsService.create() (imported from dist/products/products.service) ===\n');

  // Test 27: Successful create — real service, mocked Prisma, all entities in tenant-1
  const prismaA = createMockPrisma(
    [{ id: 'tenant-1' }],
    [{ id: 'vendor-1', tenantId: 'tenant-1' }],
    [{ id: 'category-1', tenantId: 'tenant-1' }],
  );
  const serviceA = new ProductsService(prismaA);
  const dtoA = baseValidPayload();
  const resultA = await serviceA.create(dtoA);

  assert(prismaA._calls.tenantFindUnique.length === 1, 'create() calls prisma.tenant.findUnique()');
  assert(prismaA._calls.tenantFindUnique[0].where.id === 'tenant-1', 'tenant.findUnique() called with correct tenantId');
  assert(prismaA._calls.vendorFindUnique.length === 1, 'create() calls prisma.vendor.findUnique()');
  assert(prismaA._calls.vendorFindUnique[0].where.id === 'vendor-1', 'vendor.findUnique() called with correct vendorId');
  assert(prismaA._calls.categoryFindUnique.length === 1, 'create() calls prisma.category.findUnique()');
  assert(prismaA._calls.categoryFindUnique[0].where.id === 'category-1', 'category.findUnique() called with correct categoryId');
  assert(prismaA._calls.productFindFirst.length === 1, 'create() calls prisma.product.findFirst() for (tenantId, slug) check');
  assert(
    prismaA._calls.productFindFirst[0].where.tenantId === 'tenant-1' &&
      prismaA._calls.productFindFirst[0].where.slug === 'acme-widget',
    'product.findFirst() called with correct (tenantId, slug) composite',
  );
  assert(prismaA._calls.productCreate.length === 1, 'Successful create calls prisma.product.create()');
  assert(resultA.ok === true, 'Successful create returns ok:true response envelope');
  assert(resultA.data.slug === 'acme-widget', 'Returned product has correct slug');
  assert(resultA.data.tenantId === 'tenant-1', 'Returned product has correct tenantId');
  assert(resultA.meta.phase === 'P7-007', 'Returned meta.phase is P7-007');

  // Test 28: Successful create forwards basePrice / currency / inStock / description to create
  const prismaA2 = createMockPrisma(
    [{ id: 'tenant-1' }],
    [{ id: 'vendor-1', tenantId: 'tenant-1' }],
    [{ id: 'category-1', tenantId: 'tenant-1' }],
  );
  const serviceA2 = new ProductsService(prismaA2);
  await serviceA2.create(
    baseValidPayload({
      slug: 'full-product',
      description: 'A great widget',
      currency: 'USD',
      inStock: false,
      basePrice: 49.5,
    }),
  );
  assert(prismaA2._calls.productCreate[0].data.basePrice === 49.5, 'basePrice forwarded to prisma.product.create()');
  assert(prismaA2._calls.productCreate[0].data.currency === 'USD', 'explicit currency forwarded to prisma.product.create()');
  assert(prismaA2._calls.productCreate[0].data.inStock === false, 'explicit inStock forwarded to prisma.product.create()');
  assert(prismaA2._calls.productCreate[0].data.description === 'A great widget', 'description forwarded to prisma.product.create()');

  // Test 29: currency defaults to NGN when omitted
  const prismaA3 = createMockPrisma(
    [{ id: 'tenant-1' }],
    [{ id: 'vendor-1', tenantId: 'tenant-1' }],
    [{ id: 'category-1', tenantId: 'tenant-1' }],
  );
  const serviceA3 = new ProductsService(prismaA3);
  await serviceA3.create(baseValidPayload({ slug: 'no-currency', currency: undefined }));
  assert(prismaA3._calls.productCreate[0].data.currency === 'NGN', 'currency defaults to NGN when omitted');

  // Test 30: inStock defaults to true when omitted
  const prismaA4 = createMockPrisma(
    [{ id: 'tenant-1' }],
    [{ id: 'vendor-1', tenantId: 'tenant-1' }],
    [{ id: 'category-1', tenantId: 'tenant-1' }],
  );
  const serviceA4 = new ProductsService(prismaA4);
  await serviceA4.create(baseValidPayload({ slug: 'no-instock', inStock: undefined }));
  assert(prismaA4._calls.productCreate[0].data.inStock === true, 'inStock defaults to true when omitted');

  // Test 31: Missing tenant — real service throws real Nest NotFoundException
  const prismaB = createMockPrisma([], [], []); // no entities seeded
  const serviceB = new ProductsService(prismaB);
  const dtoB = baseValidPayload();
  let tenantThrown = null;
  try {
    await serviceB.create(dtoB);
  } catch (e) {
    tenantThrown = e;
  }
  assert(tenantThrown instanceof NotFoundException, 'Missing tenant throws actual @nestjs/common NotFoundException');
  assert(prismaB._calls.vendorFindUnique.length === 0, 'Missing tenant does NOT call prisma.vendor.findUnique()');
  assert(prismaB._calls.categoryFindUnique.length === 0, 'Missing tenant does NOT call prisma.category.findUnique()');
  assert(prismaB._calls.productFindFirst.length === 0, 'Missing tenant does NOT reach the (tenantId, slug) check');
  assert(prismaB._calls.productCreate.length === 0, 'Missing tenant does NOT call prisma.product.create()');

  // Test 32: Missing vendor — real service throws real Nest NotFoundException
  const prismaC = createMockPrisma([{ id: 'tenant-1' }], [], [{ id: 'category-1', tenantId: 'tenant-1' }]);
  const serviceC = new ProductsService(prismaC);
  const dtoC = baseValidPayload();
  let vendorThrown = null;
  try {
    await serviceC.create(dtoC);
  } catch (e) {
    vendorThrown = e;
  }
  assert(vendorThrown instanceof NotFoundException, 'Missing vendor throws actual @nestjs/common NotFoundException');
  assert(
    vendorThrown !== null && typeof vendorThrown.message === 'string' && vendorThrown.message.includes('Vendor not found'),
    'Missing vendor carries Vendor not found message',
  );
  assert(prismaC._calls.categoryFindUnique.length === 0, 'Missing vendor does NOT call prisma.category.findUnique()');
  assert(prismaC._calls.productCreate.length === 0, 'Missing vendor does NOT call prisma.product.create()');

  // Test 33: Cross-tenant vendor — real service throws NotFoundException (vendor not found in tenant)
  const prismaD = createMockPrisma(
    [{ id: 'tenant-1' }, { id: 'tenant-2' }],
    [{ id: 'vendor-1', tenantId: 'tenant-2' }],
    [{ id: 'category-1', tenantId: 'tenant-1' }],
  );
  const serviceD = new ProductsService(prismaD);
  const dtoD = baseValidPayload();
  let crossVendorThrown = null;
  try {
    await serviceD.create(dtoD);
  } catch (e) {
    crossVendorThrown = e;
  }
  assert(crossVendorThrown instanceof NotFoundException, 'Cross-tenant vendor throws NotFoundException');
  assert(prismaD._calls.productCreate.length === 0, 'Cross-tenant vendor does NOT call prisma.product.create()');

  // Test 34: Missing category — real service throws real Nest NotFoundException
  const prismaE = createMockPrisma(
    [{ id: 'tenant-1' }],
    [{ id: 'vendor-1', tenantId: 'tenant-1' }],
    [],
  );
  const serviceE = new ProductsService(prismaE);
  const dtoE = baseValidPayload();
  let categoryThrown = null;
  try {
    await serviceE.create(dtoE);
  } catch (e) {
    categoryThrown = e;
  }
  assert(categoryThrown instanceof NotFoundException, 'Missing category throws actual @nestjs/common NotFoundException');
  assert(
    categoryThrown !== null && typeof categoryThrown.message === 'string' && categoryThrown.message.includes('Category not found'),
    'Missing category carries Category not found message',
  );
  assert(prismaE._calls.productCreate.length === 0, 'Missing category does NOT call prisma.product.create()');

  // Test 35: Cross-tenant category — real service throws NotFoundException
  const prismaF = createMockPrisma(
    [{ id: 'tenant-1' }, { id: 'tenant-2' }],
    [{ id: 'vendor-1', tenantId: 'tenant-1' }],
    [{ id: 'category-1', tenantId: 'tenant-2' }],
  );
  const serviceF = new ProductsService(prismaF);
  const dtoF = baseValidPayload();
  let crossCategoryThrown = null;
  try {
    await serviceF.create(dtoF);
  } catch (e) {
    crossCategoryThrown = e;
  }
  assert(crossCategoryThrown instanceof NotFoundException, 'Cross-tenant category throws NotFoundException');
  assert(prismaF._calls.productCreate.length === 0, 'Cross-tenant category does NOT call prisma.product.create()');

  // Test 36: Duplicate (tenantId, slug) — real service throws real Nest ConflictException
  const prismaG = createMockPrisma(
    [{ id: 'tenant-1' }],
    [{ id: 'vendor-1', tenantId: 'tenant-1' }],
    [{ id: 'category-1', tenantId: 'tenant-1' }],
  );
  const serviceG = new ProductsService(prismaG);
  const dtoG = baseValidPayload();
  await serviceG.create(dtoG); // first create succeeds
  let dupThrown = null;
  try {
    await serviceG.create(dtoG); // duplicate (tenantId, slug)
  } catch (e) {
    dupThrown = e;
  }
  assert(dupThrown instanceof ConflictException, 'Duplicate (tenantId, slug) throws actual @nestjs/common ConflictException');
  assert(
    dupThrown !== null && typeof dupThrown.message === 'string' && dupThrown.message.includes('already exists'),
    'ConflictException carries expected message',
  );
  assert(
    prismaG._calls.productCreate.length === 1,
    'Duplicate (tenantId, slug) does NOT call prisma.product.create() a second time',
  );
  assert(
    prismaG._calls.productFindFirst.length === 2,
    'Duplicate (tenantId, slug) attempt still calls prisma.product.findFirst()',
  );

  // Test 37: Same slug allowed across different tenants — proves composite key behavior
  const prismaH = createMockPrisma(
    [{ id: 'tenant-1' }, { id: 'tenant-2' }],
    [
      { id: 'vendor-1', tenantId: 'tenant-1' },
      { id: 'vendor-2', tenantId: 'tenant-2' },
    ],
    [
      { id: 'category-1', tenantId: 'tenant-1' },
      { id: 'category-2', tenantId: 'tenant-2' },
    ],
  );
  const serviceH = new ProductsService(prismaH);
  await serviceH.create(baseValidPayload());
  const resultH = await serviceH.create(
    baseValidPayload({ tenantId: 'tenant-2', vendorId: 'vendor-2', categoryId: 'category-2' }),
  );
  assert(resultH.ok === true, 'Same slug in a different tenant is allowed (composite unique)');
  assert(prismaH._calls.productCreate.length === 2, 'Both distinct-tenant creates reach prisma.product.create()');

  // Test 38: Multiple distinct products can be created against the real service
  const prismaI = createMockPrisma(
    [{ id: 'tenant-1' }],
    [{ id: 'vendor-1', tenantId: 'tenant-1' }],
    [{ id: 'category-1', tenantId: 'tenant-1' }],
  );
  const serviceI = new ProductsService(prismaI);
  await serviceI.create(baseValidPayload({ slug: 'a', name: 'A' }));
  await serviceI.create(baseValidPayload({ slug: 'b', name: 'B', status: 'DRAFT' }));
  assert(prismaI._products.length === 2, 'Multiple distinct products can be created via real service');
  assert(prismaI._calls.productCreate.length === 2, 'prisma.product.create() called once per distinct product');

  // Test 39: Real service accepts a real validated CreateProductDto instance
  const prismaJ = createMockPrisma(
    [{ id: 'tenant-1' }],
    [{ id: 'vendor-1', tenantId: 'tenant-1' }],
    [{ id: 'category-1', tenantId: 'tenant-1' }],
  );
  const serviceJ = new ProductsService(prismaJ);
  const validatedDto = plainToInstance(CreateProductDto, baseValidPayload({ slug: 'final' }));
  const resultJ = await serviceJ.create(validatedDto);
  assert(resultJ.ok === true, 'Real service accepts validated CreateProductDto instance and creates product');
  assert(prismaJ._calls.productCreate.length === 1, 'Validated DTO path calls prisma.product.create() exactly once');

  // Test 40: basePrice with high precision is forwarded
  const prismaK = createMockPrisma(
    [{ id: 'tenant-1' }],
    [{ id: 'vendor-1', tenantId: 'tenant-1' }],
    [{ id: 'category-1', tenantId: 'tenant-1' }],
  );
  const serviceK = new ProductsService(prismaK);
  await serviceK.create(baseValidPayload({ slug: 'precise', basePrice: 12345.6789 }));
  assert(prismaK._calls.productCreate[0].data.basePrice === 12345.6789, 'high-precision basePrice forwarded to prisma.product.create()');
}

// Main execution
async function run() {
  console.log('Testing Product Write API (POST /products)\n');
  console.log('Implementation: CreateProductDto + ProductsService.create() (both imported from dist)\n');

  await testValidation();
  await testRealServiceBehavior();

  console.log(`\n=== RESULTS ===`);
  console.log(`${passed} passed, ${failed} failed`);
  console.log(`\nTotal: ${passed + failed} tests`);

  process.exit(failed > 0 ? 1 : 0);
}

run().catch(e => {
  console.error('Test runner error:', e.message);
  process.exit(1);
});
