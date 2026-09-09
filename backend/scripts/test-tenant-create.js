/**
 * Test suite for Tenant Write API (POST /tenants)
 * Tests the actual CreateTenantDto validation and the real TenantsService.create()
 * implementation (imported from compiled backend output), including successful
 * creation and duplicate slug conflict behavior against a mocked PrismaService.
 *
 * Requires `npm run build` to have been run first (imports from ../dist).
 */

const { validate } = require('class-validator');
const { plainToInstance } = require('class-transformer');
const { ConflictException } = require('@nestjs/common');

// Import the real DTO class from compiled output — no fallback: if this
// fails, the build is stale/missing and results would not reflect the
// real implementation.
const { CreateTenantDto } = require('../dist/tenants/dto/create-tenant.dto');

// Import the real TenantsService from compiled output — same requirement.
const { TenantsService } = require('../dist/tenants/tenants.service');

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
  console.log('=== Testing CreateTenantDto Validation ===\n');

  // Test 1: Valid input passes validation
  const validDto = plainToInstance(CreateTenantDto, {
    name: 'Acme Corp',
    slug: 'acme-corp',
    type: 'VENDOR',
    status: 'ACTIVE',
  });
  const validErrors = await validate(validDto);
  assert(validErrors.length === 0, 'Valid input passes class-validator');

  // Test 2: Missing name fails
  const noNameDto = plainToInstance(CreateTenantDto, {
    slug: 'test',
    type: 'PLATFORM',
    status: 'ACTIVE',
  });
  const noNameErrors = await validate(noNameDto);
  assert(noNameErrors.length > 0, 'Missing name fails validation');
  assert(noNameErrors.some(e => e.property === 'name'), 'Missing name error reported');

  // Test 3: Empty name fails
  const emptyNameDto = plainToInstance(CreateTenantDto, {
    name: '',
    slug: 'test',
    type: 'PLATFORM',
    status: 'ACTIVE',
  });
  const emptyNameErrors = await validate(emptyNameDto);
  assert(emptyNameErrors.length > 0, 'Empty name fails validation');

  // Test 4: Name > 255 chars fails
  const longNameDto = plainToInstance(CreateTenantDto, {
    name: 'a'.repeat(256),
    slug: 'test',
    type: 'PLATFORM',
    status: 'ACTIVE',
  });
  const longNameErrors = await validate(longNameDto);
  assert(longNameErrors.length > 0, 'Name > 255 chars fails validation');

  // Test 5: Invalid slug characters fail
  const badSlugDto = plainToInstance(CreateTenantDto, {
    name: 'Test',
    slug: 'Test Slug!',
    type: 'PLATFORM',
    status: 'ACTIVE',
  });
  const badSlugErrors = await validate(badSlugDto);
  assert(badSlugErrors.length > 0, 'Invalid slug characters fail validation');
  assert(badSlugErrors.some(e => e.property === 'slug'), 'Invalid slug error reported');

  // Test 6: Invalid type fails
  const badTypeDto = plainToInstance(CreateTenantDto, {
    name: 'Test',
    slug: 'test',
    type: 'INVALID',
    status: 'ACTIVE',
  });
  const badTypeErrors = await validate(badTypeDto);
  assert(badTypeErrors.length > 0, 'Invalid type fails validation');
  assert(badTypeErrors.some(e => e.property === 'type'), 'Invalid type error reported');

  // Test 7: Invalid status fails
  const badStatusDto = plainToInstance(CreateTenantDto, {
    name: 'Test',
    slug: 'test',
    type: 'PLATFORM',
    status: 'DELETED',
  });
  const badStatusErrors = await validate(badStatusDto);
  assert(badStatusErrors.length > 0, 'Invalid status fails validation');
  assert(badStatusErrors.some(e => e.property === 'status'), 'Invalid status error reported');

  // Test 8: Valid PLATFORM type
  const platformDto = plainToInstance(CreateTenantDto, {
    name: 'Platform',
    slug: 'platform',
    type: 'PLATFORM',
    status: 'ACTIVE',
  });
  const platformErrors = await validate(platformDto);
  assert(platformErrors.length === 0, 'PLATFORM type is valid');

  // Test 9: Valid SUSPENDED status
  const suspendedDto = plainToInstance(CreateTenantDto, {
    name: 'Suspended',
    slug: 'suspended',
    type: 'VENDOR',
    status: 'SUSPENDED',
  });
  const suspendedErrors = await validate(suspendedDto);
  assert(suspendedErrors.length === 0, 'SUSPENDED status is valid');

  // Test 10: Valid slug with numbers
  const numSlugDto = plainToInstance(CreateTenantDto, {
    name: 'Test',
    slug: 'test-123',
    type: 'VENDOR',
    status: 'ACTIVE',
  });
  const numSlugErrors = await validate(numSlugDto);
  assert(numSlugErrors.length === 0, 'Slug with numbers is valid');
}

/**
 * Builds a mocked PrismaService-shaped dependency that records every call
 * made to tenant.findUnique() / tenant.create() so tests can assert on
 * exactly what the real TenantsService did, not just its return value.
 */
function createMockPrisma() {
  const tenants = [];
  const calls = { findUnique: [], create: [] };

  return {
    _calls: calls,
    _tenants: tenants,
    tenant: {
      findUnique: async (args) => {
        calls.findUnique.push(args);
        const found = tenants.find(
          (t) => (args.where.slug && t.slug === args.where.slug) || (args.where.id && t.id === args.where.id),
        );
        return found || null;
      },
      create: async (args) => {
        calls.create.push(args);
        const tenant = {
          id: 'tenant-' + (tenants.length + 1),
          name: args.data.name,
          slug: args.data.slug,
          type: args.data.type,
          status: args.data.status,
          createdAt: new Date(),
        };
        tenants.push(tenant);
        return tenant;
      },
    },
  };
}

async function testRealServiceBehavior() {
  console.log('\n=== Testing REAL TenantsService.create() (imported from dist/tenants/tenants.service) ===\n');

  // Test 11: Successful create — real service, mocked Prisma
  const prismaA = createMockPrisma();
  const serviceA = new TenantsService(prismaA);
  const dtoA = { name: 'First Tenant', slug: 'first-tenant', type: 'VENDOR', status: 'ACTIVE' };

  const resultA = await serviceA.create(dtoA);

  assert(prismaA._calls.findUnique.length === 1, 'create() calls prisma.tenant.findUnique()');
  assert(prismaA._calls.findUnique[0].where.slug === 'first-tenant', 'findUnique() called with correct slug');
  assert(prismaA._calls.create.length === 1, 'Successful create calls prisma.tenant.create()');
  assert(resultA.ok === true, 'Successful create returns ok:true response envelope');
  assert(resultA.data.slug === 'first-tenant', 'Returned tenant has correct slug');
  assert(resultA.data.name === 'First Tenant', 'Returned tenant has correct name');

  // Test 12: Duplicate slug — real service throws real Nest ConflictException
  const prismaB = createMockPrisma();
  const serviceB = new TenantsService(prismaB);
  const dtoB = { name: 'Dup Tenant', slug: 'dup-tenant', type: 'VENDOR', status: 'ACTIVE' };

  await serviceB.create(dtoB); // first create succeeds

  let thrown = null;
  try {
    await serviceB.create(dtoB); // duplicate slug
  } catch (e) {
    thrown = e;
  }

  assert(thrown instanceof ConflictException, 'Duplicate slug throws actual @nestjs/common ConflictException');
  assert(
    thrown !== null && typeof thrown.message === 'string' && thrown.message.includes('already exists'),
    'ConflictException carries expected message',
  );
  assert(
    prismaB._calls.create.length === 1,
    'Duplicate slug does NOT call prisma.tenant.create() a second time',
  );
  assert(prismaB._calls.findUnique.length === 2, 'Duplicate slug attempt still calls prisma.tenant.findUnique()');

  // Test 13: Multiple different tenants can be created against the real service
  const prismaC = createMockPrisma();
  const serviceC = new TenantsService(prismaC);
  await serviceC.create({ name: 'Second Tenant', slug: 'second-tenant', type: 'PLATFORM', status: 'ACTIVE' });
  await serviceC.create({ name: 'Third Tenant', slug: 'third-tenant', type: 'VENDOR', status: 'SUSPENDED' });
  assert(prismaC._tenants.length === 2, 'Multiple distinct tenants can be created via real service');
  assert(prismaC._calls.create.length === 2, 'prisma.tenant.create() called once per distinct tenant');

  // Test 14: Slug uniqueness enforced across repeated attempts on the real service
  let secondThrown = null;
  try {
    await serviceC.create({ name: 'Another Dup', slug: 'second-tenant', type: 'VENDOR', status: 'ACTIVE' });
  } catch (e) {
    secondThrown = e;
  }
  assert(secondThrown instanceof ConflictException, 'Second duplicate slug also throws ConflictException');
  assert(prismaC._calls.create.length === 2, 'Second duplicate does not increase prisma.tenant.create() calls');

  // Test 15: Real service accepts a real validated CreateTenantDto instance
  const prismaD = createMockPrisma();
  const serviceD = new TenantsService(prismaD);
  const validatedDto = plainToInstance(CreateTenantDto, {
    name: 'Final Tenant',
    slug: 'final-tenant',
    type: 'VENDOR',
    status: 'ACTIVE',
  });
  const resultD = await serviceD.create(validatedDto);
  assert(resultD.ok === true, 'Real service accepts validated CreateTenantDto instance and creates tenant');
  assert(prismaD._calls.create.length === 1, 'Validated DTO path calls prisma.tenant.create() exactly once');
}

// Main execution
async function run() {
  console.log('Testing Tenant Write API (POST /tenants)\n');
  console.log('Implementation: CreateTenantDto + TenantsService.create() (both imported from dist)\n');

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
