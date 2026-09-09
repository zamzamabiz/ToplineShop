/**
 * Test suite for Category Write API (POST /categories)
 * Tests the actual CreateCategoryDto validation and the real CategoriesService.create()
 * implementation (imported from compiled backend output), including successful
 * creation, tenant-existence handling, optional parent category existence
 * handling, and duplicate (tenantId, slug) conflict behavior against a mocked
 * PrismaService.
 *
 * Requires `npm run build` to have been run first (imports from ../dist).
 */

const { validate } = require('class-validator');
const { plainToInstance } = require('class-transformer');
const { NotFoundException, ConflictException } = require('@nestjs/common');

// Import the real DTO class from compiled output — no fallback: if this
// fails, the build is stale/missing and results would not reflect the
// real implementation.
const { CreateCategoryDto } = require('../dist/categories/dto/create-category.dto');

// Import the real CategoriesService from compiled output — same requirement.
const { CategoriesService } = require('../dist/categories/categories.service');

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

async function testValidation() {
  console.log('=== Testing CreateCategoryDto Validation ===\n');

  // Test 1: Valid input passes validation
  const validDto = plainToInstance(CreateCategoryDto, {
    tenantId: 'tenant-1',
    name: 'Electronics',
    slug: 'electronics',
    status: 'ACTIVE',
  });
  const validErrors = await validate(validDto);
  assert(validErrors.length === 0, 'Valid input passes class-validator');

  // Test 2: Missing tenantId fails
  const noTenantDto = plainToInstance(CreateCategoryDto, {
    name: 'Electronics',
    slug: 'electronics',
    status: 'ACTIVE',
  });
  const noTenantErrors = await validate(noTenantDto);
  assert(noTenantErrors.length > 0, 'Missing tenantId fails validation');
  assert(noTenantErrors.some(e => e.property === 'tenantId'), 'Missing tenantId error reported');

  // Test 3: Missing name fails
  const noNameDto = plainToInstance(CreateCategoryDto, {
    tenantId: 'tenant-1',
    slug: 'electronics',
    status: 'ACTIVE',
  });
  const noNameErrors = await validate(noNameDto);
  assert(noNameErrors.length > 0, 'Missing name fails validation');
  assert(noNameErrors.some(e => e.property === 'name'), 'Missing name error reported');

  // Test 4: Empty name fails
  const emptyNameDto = plainToInstance(CreateCategoryDto, {
    tenantId: 'tenant-1',
    name: '',
    slug: 'electronics',
    status: 'ACTIVE',
  });
  const emptyNameErrors = await validate(emptyNameDto);
  assert(emptyNameErrors.length > 0, 'Empty name fails validation');

  // Test 5: Name > 255 chars fails
  const longNameDto = plainToInstance(CreateCategoryDto, {
    tenantId: 'tenant-1',
    name: 'a'.repeat(256),
    slug: 'electronics',
    status: 'ACTIVE',
  });
  const longNameErrors = await validate(longNameDto);
  assert(longNameErrors.length > 0, 'Name > 255 chars fails validation');

  // Test 6: Missing slug fails
  const noSlugDto = plainToInstance(CreateCategoryDto, {
    tenantId: 'tenant-1',
    name: 'Electronics',
    status: 'ACTIVE',
  });
  const noSlugErrors = await validate(noSlugDto);
  assert(noSlugErrors.length > 0, 'Missing slug fails validation');
  assert(noSlugErrors.some(e => e.property === 'slug'), 'Missing slug error reported');

  // Test 7: Invalid slug characters fail
  const badSlugDto = plainToInstance(CreateCategoryDto, {
    tenantId: 'tenant-1',
    name: 'Electronics',
    slug: 'Electronics!',
    status: 'ACTIVE',
  });
  const badSlugErrors = await validate(badSlugDto);
  assert(badSlugErrors.length > 0, 'Invalid slug characters fail validation');
  assert(badSlugErrors.some(e => e.property === 'slug'), 'Invalid slug error reported');

  // Test 8: Invalid status fails
  const badStatusDto = plainToInstance(CreateCategoryDto, {
    tenantId: 'tenant-1',
    name: 'Electronics',
    slug: 'electronics',
    status: 'DELETED',
  });
  const badStatusErrors = await validate(badStatusDto);
  assert(badStatusErrors.length > 0, 'Invalid status fails validation');
  assert(badStatusErrors.some(e => e.property === 'status'), 'Invalid status error reported');

  // Test 9: Valid HIDDEN status
  const hiddenDto = plainToInstance(CreateCategoryDto, {
    tenantId: 'tenant-1',
    name: 'Hidden Category',
    slug: 'hidden-category',
    status: 'HIDDEN',
  });
  const hiddenErrors = await validate(hiddenDto);
  assert(hiddenErrors.length === 0, 'HIDDEN status is valid');

  // Test 10: Valid ACTIVE status
  const activeDto = plainToInstance(CreateCategoryDto, {
    tenantId: 'tenant-1',
    name: 'Active Category',
    slug: 'active-category',
    status: 'ACTIVE',
  });
  const activeErrors = await validate(activeDto);
  assert(activeErrors.length === 0, 'ACTIVE status is valid');

  // Test 11: Optional icon accepted when within length
  const withIconDto = plainToInstance(CreateCategoryDto, {
    tenantId: 'tenant-1',
    name: 'Iconic',
    slug: 'iconic',
    status: 'ACTIVE',
    icon: 'phone',
  });
  const withIconErrors = await validate(withIconDto);
  assert(withIconErrors.length === 0, 'Valid icon passes validation');

  // Test 12: Optional parentId accepted
  const withParentDto = plainToInstance(CreateCategoryDto, {
    tenantId: 'tenant-1',
    name: 'Child Category',
    slug: 'child-category',
    status: 'ACTIVE',
    parentId: 'parent-1',
  });
  const withParentErrors = await validate(withParentDto);
  assert(withParentErrors.length === 0, 'Valid parentId passes validation');

  // Test 13: Optional sortOrder accepted as integer
  const withSortDto = plainToInstance(CreateCategoryDto, {
    tenantId: 'tenant-1',
    name: 'Sorted',
    slug: 'sorted',
    status: 'ACTIVE',
    sortOrder: 5,
  });
  const withSortErrors = await validate(withSortDto);
  assert(withSortErrors.length === 0, 'Valid sortOrder passes validation');

  // Test 14: Negative sortOrder fails
  const negSortDto = plainToInstance(CreateCategoryDto, {
    tenantId: 'tenant-1',
    name: 'Negative',
    slug: 'negative',
    status: 'ACTIVE',
    sortOrder: -1,
  });
  const negSortErrors = await validate(negSortDto);
  assert(negSortErrors.length > 0, 'Negative sortOrder fails validation');

  // Test 15: icon > 50 chars fails
  const longIconDto = plainToInstance(CreateCategoryDto, {
    tenantId: 'tenant-1',
    name: 'Long Icon',
    slug: 'long-icon',
    status: 'ACTIVE',
    icon: 'a'.repeat(51),
  });
  const longIconErrors = await validate(longIconDto);
  assert(longIconErrors.length > 0, 'Icon > 50 chars fails validation');
}

/**
 * Builds a mocked PrismaService-shaped dependency that records every call
 * made to tenant.findUnique() / category.findUnique() / category.findFirst()
 * / category.create() so tests can assert on exactly what the real
 * CategoriesService did, not just its return value.
 */
function createMockPrisma(seedTenants = [], seedCategories = []) {
  const tenants = [...seedTenants];
  const categories = [...seedCategories];
  const calls = {
    tenantFindUnique: [],
    categoryFindUnique: [],
    categoryFindFirst: [],
    categoryCreate: [],
  };

  return {
    _calls: calls,
    _categories: categories,
    tenant: {
      findUnique: async (args) => {
        calls.tenantFindUnique.push(args);
        const found = tenants.find((t) => t.id === args.where.id);
        return found || null;
      },
    },
    category: {
      findUnique: async (args) => {
        calls.categoryFindUnique.push(args);
        const found = categories.find(
          (c) => (args.where.id && c.id === args.where.id) || (args.where.slug && c.slug === args.where.slug),
        );
        return found || null;
      },
      findFirst: async (args) => {
        calls.categoryFindFirst.push(args);
        const where = args.where;
        const found = categories.find(
          (c) =>
            (where.tenantId === undefined || c.tenantId === where.tenantId) &&
            (where.slug === undefined || c.slug === where.slug),
        );
        return found || null;
      },
      create: async (args) => {
        calls.categoryCreate.push(args);
        const category = {
          id: 'category-' + (categories.length + 1),
          tenantId: args.data.tenantId,
          parentId: args.data.parentId !== undefined ? args.data.parentId : null,
          name: args.data.name,
          slug: args.data.slug,
          status: args.data.status,
          sortOrder: args.data.sortOrder !== undefined ? args.data.sortOrder : 0,
          createdAt: new Date(),
        };
        categories.push(category);
        return category;
      },
    },
  };
}

async function testRealServiceBehavior() {
  console.log('\n=== Testing REAL CategoriesService.create() (imported from dist/categories/categories.service) ===\n');

  // Test 16: Successful create — real service, mocked Prisma, existing tenant
  const prismaA = createMockPrisma([{ id: 'tenant-1' }]);
  const serviceA = new CategoriesService(prismaA);
  const dtoA = { tenantId: 'tenant-1', name: 'Electronics', slug: 'electronics', status: 'ACTIVE' };

  const resultA = await serviceA.create(dtoA);

  assert(prismaA._calls.tenantFindUnique.length === 1, 'create() calls prisma.tenant.findUnique()');
  assert(prismaA._calls.tenantFindUnique[0].where.id === 'tenant-1', 'tenant.findUnique() called with correct tenantId');
  assert(prismaA._calls.categoryFindFirst.length === 1, 'create() calls prisma.category.findFirst() for (tenantId, slug) check');
  assert(
    prismaA._calls.categoryFindFirst[0].where.tenantId === 'tenant-1' &&
      prismaA._calls.categoryFindFirst[0].where.slug === 'electronics',
    'category.findFirst() called with correct (tenantId, slug) composite',
  );
  assert(prismaA._calls.categoryCreate.length === 1, 'Successful create calls prisma.category.create()');
  assert(resultA.ok === true, 'Successful create returns ok:true response envelope');
  assert(resultA.data.slug === 'electronics', 'Returned category has correct slug');
  assert(resultA.data.tenantId === 'tenant-1', 'Returned category has correct tenantId');
  assert(resultA.meta.phase === 'P7-006', 'Returned meta.phase is P7-006');

  // Test 17: Nonexistent tenant — real service throws real Nest NotFoundException
  const prismaB = createMockPrisma([]); // no tenants seeded
  const serviceB = new CategoriesService(prismaB);
  const dtoB = { tenantId: 'missing-tenant', name: 'Orphan', slug: 'orphan', status: 'ACTIVE' };

  let tenantThrown = null;
  try {
    await serviceB.create(dtoB);
  } catch (e) {
    tenantThrown = e;
  }

  assert(tenantThrown instanceof NotFoundException, 'Missing tenant throws actual @nestjs/common NotFoundException');
  assert(prismaB._calls.categoryCreate.length === 0, 'Missing tenant does NOT call prisma.category.create()');
  assert(prismaB._calls.categoryFindFirst.length === 0, 'Missing tenant does NOT reach the (tenantId, slug) check');
  assert(prismaB._calls.categoryFindUnique.length === 0, 'Missing tenant does NOT reach parent lookup');

  // Test 18: Nonexistent parent — real service throws real Nest NotFoundException
  const prismaC = createMockPrisma([{ id: 'tenant-1' }], []);
  const serviceC = new CategoriesService(prismaC);
  const dtoC = { tenantId: 'tenant-1', name: 'Child', slug: 'child', status: 'ACTIVE', parentId: 'missing-parent' };

  let parentThrown = null;
  try {
    await serviceC.create(dtoC);
  } catch (e) {
    parentThrown = e;
  }

  assert(parentThrown instanceof NotFoundException, 'Missing parent throws actual @nestjs/common NotFoundException');
  assert(
    parentThrown !== null && typeof parentThrown.message === 'string' && parentThrown.message.includes('Parent category'),
    'Missing parent carries Parent category message',
  );
  assert(prismaC._calls.categoryCreate.length === 0, 'Missing parent does NOT call prisma.category.create()');
  assert(prismaC._calls.categoryFindFirst.length === 0, 'Missing parent does NOT reach the (tenantId, slug) check');
  assert(prismaC._calls.categoryFindUnique.length === 1, 'Missing parent calls prisma.category.findUnique() for parent lookup');

  // Test 19: Parent in different tenant — real service throws NotFoundException
  const prismaD = createMockPrisma(
    [{ id: 'tenant-1' }, { id: 'tenant-2' }],
    [{ id: 'parent-1', tenantId: 'tenant-2' }],
  );
  const serviceD = new CategoriesService(prismaD);
  const dtoD = { tenantId: 'tenant-1', name: 'Cross-tenant', slug: 'cross-tenant', status: 'ACTIVE', parentId: 'parent-1' };

  let crossThrown = null;
  try {
    await serviceD.create(dtoD);
  } catch (e) {
    crossThrown = e;
  }

  assert(crossThrown instanceof NotFoundException, 'Cross-tenant parent throws NotFoundException (parent not found in tenant)');
  assert(prismaD._calls.categoryCreate.length === 0, 'Cross-tenant parent does NOT call prisma.category.create()');

  // Test 20: Duplicate (tenantId, slug) — real service throws real Nest ConflictException
  const prismaE = createMockPrisma([{ id: 'tenant-1' }]);
  const serviceE = new CategoriesService(prismaE);
  const dtoE = { tenantId: 'tenant-1', name: 'Dup', slug: 'dup-slug', status: 'ACTIVE' };

  await serviceE.create(dtoE); // first create succeeds

  let dupThrown = null;
  try {
    await serviceE.create(dtoE); // duplicate (tenantId, slug)
  } catch (e) {
    dupThrown = e;
  }

  assert(dupThrown instanceof ConflictException, 'Duplicate (tenantId, slug) throws actual @nestjs/common ConflictException');
  assert(
    dupThrown !== null && typeof dupThrown.message === 'string' && dupThrown.message.includes('already exists'),
    'ConflictException carries expected message',
  );
  assert(
    prismaE._calls.categoryCreate.length === 1,
    'Duplicate (tenantId, slug) does NOT call prisma.category.create() a second time',
  );
  assert(
    prismaE._calls.categoryFindFirst.length === 2,
    'Duplicate (tenantId, slug) attempt still calls prisma.category.findFirst()',
  );

  // Test 21: Same slug allowed across different tenants — proves composite key behavior
  const prismaF = createMockPrisma([{ id: 'tenant-1' }, { id: 'tenant-2' }]);
  const serviceF = new CategoriesService(prismaF);
  const dtoF1 = { tenantId: 'tenant-1', name: 'Shared', slug: 'shared-slug', status: 'ACTIVE' };
  const dtoF2 = { tenantId: 'tenant-2', name: 'Shared', slug: 'shared-slug', status: 'ACTIVE' };

  await serviceF.create(dtoF1);
  const resultF = await serviceF.create(dtoF2);

  assert(resultF.ok === true, 'Same slug in a different tenant is allowed (composite unique)');
  assert(prismaF._calls.categoryCreate.length === 2, 'Both distinct-tenant creates reach prisma.category.create()');

  // Test 22: Multiple distinct categories can be created against the real service
  const prismaG = createMockPrisma([{ id: 'tenant-1' }]);
  const serviceG = new CategoriesService(prismaG);
  await serviceG.create({ tenantId: 'tenant-1', name: 'A', slug: 'a', status: 'ACTIVE' });
  await serviceG.create({ tenantId: 'tenant-1', name: 'B', slug: 'b', status: 'HIDDEN' });
  assert(prismaG._categories.length === 2, 'Multiple distinct categories can be created via real service');
  assert(prismaG._calls.categoryCreate.length === 2, 'prisma.category.create() called once per distinct category');

  // Test 23: Optional sortOrder and icon are passed through to create
  const prismaH = createMockPrisma([{ id: 'tenant-1' }]);
  const serviceH = new CategoriesService(prismaH);
  await serviceH.create({
    tenantId: 'tenant-1',
    name: 'Decorated',
    slug: 'decorated',
    status: 'ACTIVE',
    icon: 'star',
    sortOrder: 7,
  });
  assert(prismaH._calls.categoryCreate[0].data.icon === 'star', 'icon is forwarded to prisma.category.create()');
  assert(prismaH._calls.categoryCreate[0].data.sortOrder === 7, 'sortOrder is forwarded to prisma.category.create()');

  // Test 24: sortOrder defaults to 0 when omitted
  const prismaI = createMockPrisma([{ id: 'tenant-1' }]);
  const serviceI = new CategoriesService(prismaI);
  await serviceI.create({ tenantId: 'tenant-1', name: 'Default', slug: 'default', status: 'ACTIVE' });
  assert(prismaI._calls.categoryCreate[0].data.sortOrder === 0, 'sortOrder defaults to 0 when omitted');

  // Test 25: Real service accepts a real validated CreateCategoryDto instance
  const prismaJ = createMockPrisma([{ id: 'tenant-1' }]);
  const serviceJ = new CategoriesService(prismaJ);
  const validatedDto = plainToInstance(CreateCategoryDto, {
    tenantId: 'tenant-1',
    name: 'Final',
    slug: 'final',
    status: 'ACTIVE',
  });
  const resultJ = await serviceJ.create(validatedDto);
  assert(resultJ.ok === true, 'Real service accepts validated CreateCategoryDto instance and creates category');
  assert(prismaJ._calls.categoryCreate.length === 1, 'Validated DTO path calls prisma.category.create() exactly once');

  // Test 26: Successful create with valid parent — real service wires parentId through
  const prismaK = createMockPrisma(
    [{ id: 'tenant-1' }],
    [{ id: 'parent-1', tenantId: 'tenant-1' }],
  );
  const serviceK = new CategoriesService(prismaK);
  const resultK = await serviceK.create({
    tenantId: 'tenant-1',
    name: 'Nested',
    slug: 'nested',
    status: 'ACTIVE',
    parentId: 'parent-1',
  });
  assert(resultK.ok === true, 'Real service creates child with valid parent');
  assert(prismaK._calls.categoryFindUnique.length === 1, 'Valid parent triggers one prisma.category.findUnique()');
  assert(prismaK._calls.categoryCreate[0].data.parentId === 'parent-1', 'parentId is forwarded to prisma.category.create()');
  assert(prismaK._calls.categoryCreate.length === 1, 'Valid parent path reaches prisma.category.create() exactly once');
}

// Main execution
async function run() {
  console.log('Testing Category Write API (POST /categories)\n');
  console.log('Implementation: CreateCategoryDto + CategoriesService.create() (both imported from dist)\n');

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
