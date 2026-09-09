/**
 * Test suite for Vendor Write API (POST /vendors)
 * Tests the actual CreateVendorDto validation and the real VendorsService.create()
 * implementation (imported from compiled backend output), including successful
 * creation, tenant-existence handling, and duplicate slug conflict behavior against
 * a mocked PrismaService.
 *
 * Requires `npm run build` to have been run first (imports from ../dist).
 */

const { validate } = require('class-validator');
const { plainToInstance } = require('class-transformer');
const { NotFoundException, ConflictException } = require('@nestjs/common');

// Import the real DTO class from compiled output — no fallback: if this
// fails, the build is stale/missing and results would not reflect the
// real implementation.
const { CreateVendorDto } = require('../dist/vendors/dto/create-vendor.dto');

// Import the real VendorsService from compiled output — same requirement.
const { VendorsService } = require('../dist/vendors/vendors.service');

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
  console.log('=== Testing CreateVendorDto Validation ===\n');

  // Test 1: Valid input passes validation
  const validDto = plainToInstance(CreateVendorDto, {
    tenantId: 'tenant-1',
    name: 'Acme Supplies',
    slug: 'acme-supplies',
    status: 'ACTIVE',
  });
  const validErrors = await validate(validDto);
  assert(validErrors.length === 0, 'Valid input passes class-validator');

  // Test 2: Missing tenantId fails
  const noTenantDto = plainToInstance(CreateVendorDto, {
    name: 'Test',
    slug: 'test',
    status: 'ACTIVE',
  });
  const noTenantErrors = await validate(noTenantDto);
  assert(noTenantErrors.length > 0, 'Missing tenantId fails validation');
  assert(noTenantErrors.some(e => e.property === 'tenantId'), 'Missing tenantId error reported');

  // Test 3: Missing name fails
  const noNameDto = plainToInstance(CreateVendorDto, {
    tenantId: 'tenant-1',
    slug: 'test',
    status: 'ACTIVE',
  });
  const noNameErrors = await validate(noNameDto);
  assert(noNameErrors.length > 0, 'Missing name fails validation');
  assert(noNameErrors.some(e => e.property === 'name'), 'Missing name error reported');

  // Test 4: Empty name fails
  const emptyNameDto = plainToInstance(CreateVendorDto, {
    tenantId: 'tenant-1',
    name: '',
    slug: 'test',
    status: 'ACTIVE',
  });
  const emptyNameErrors = await validate(emptyNameDto);
  assert(emptyNameErrors.length > 0, 'Empty name fails validation');

  // Test 5: Name > 255 chars fails
  const longNameDto = plainToInstance(CreateVendorDto, {
    tenantId: 'tenant-1',
    name: 'a'.repeat(256),
    slug: 'test',
    status: 'ACTIVE',
  });
  const longNameErrors = await validate(longNameDto);
  assert(longNameErrors.length > 0, 'Name > 255 chars fails validation');

  // Test 6: Invalid slug characters fail
  const badSlugDto = plainToInstance(CreateVendorDto, {
    tenantId: 'tenant-1',
    name: 'Test',
    slug: 'Test Slug!',
    status: 'ACTIVE',
  });
  const badSlugErrors = await validate(badSlugDto);
  assert(badSlugErrors.length > 0, 'Invalid slug characters fail validation');
  assert(badSlugErrors.some(e => e.property === 'slug'), 'Invalid slug error reported');

  // Test 7: Invalid status fails
  const badStatusDto = plainToInstance(CreateVendorDto, {
    tenantId: 'tenant-1',
    name: 'Test',
    slug: 'test',
    status: 'DELETED',
  });
  const badStatusErrors = await validate(badStatusDto);
  assert(badStatusErrors.length > 0, 'Invalid status fails validation');
  assert(badStatusErrors.some(e => e.property === 'status'), 'Invalid status error reported');

  // Test 8: Valid DRAFT status
  const draftDto = plainToInstance(CreateVendorDto, {
    tenantId: 'tenant-1',
    name: 'Draft Vendor',
    slug: 'draft-vendor',
    status: 'DRAFT',
  });
  const draftErrors = await validate(draftDto);
  assert(draftErrors.length === 0, 'DRAFT status is valid');

  // Test 9: Valid SUSPENDED status
  const suspendedDto = plainToInstance(CreateVendorDto, {
    tenantId: 'tenant-1',
    name: 'Suspended Vendor',
    slug: 'suspended-vendor',
    status: 'SUSPENDED',
  });
  const suspendedErrors = await validate(suspendedDto);
  assert(suspendedErrors.length === 0, 'SUSPENDED status is valid');

  // Test 10: Optional description/logo accepted when valid
  const withOptionalsDto = plainToInstance(CreateVendorDto, {
    tenantId: 'tenant-1',
    name: 'Vendor With Optionals',
    slug: 'vendor-with-optionals',
    status: 'ACTIVE',
    description: 'A vendor description',
    logo: 'https://example.com/logo.png',
  });
  const withOptionalsErrors = await validate(withOptionalsDto);
  assert(withOptionalsErrors.length === 0, 'Valid optional description/logo pass validation');
}

/**
 * Builds a mocked PrismaService-shaped dependency that records every call
 * made to tenant.findUnique() / vendor.findUnique() / vendor.create() so
 * tests can assert on exactly what the real VendorsService did, not just
 * its return value.
 */
function createMockPrisma(seedTenants = []) {
  const tenants = [...seedTenants];
  const vendors = [];
  const calls = { tenantFindUnique: [], vendorFindUnique: [], vendorCreate: [] };

  return {
    _calls: calls,
    _vendors: vendors,
    tenant: {
      findUnique: async (args) => {
        calls.tenantFindUnique.push(args);
        const found = tenants.find((t) => t.id === args.where.id);
        return found || null;
      },
    },
    vendor: {
      findUnique: async (args) => {
        calls.vendorFindUnique.push(args);
        const found = vendors.find(
          (v) => (args.where.slug && v.slug === args.where.slug) || (args.where.id && v.id === args.where.id),
        );
        return found || null;
      },
      create: async (args) => {
        calls.vendorCreate.push(args);
        const vendor = {
          id: 'vendor-' + (vendors.length + 1),
          tenantId: args.data.tenantId,
          name: args.data.name,
          slug: args.data.slug,
          status: args.data.status,
          createdAt: new Date(),
        };
        vendors.push(vendor);
        return vendor;
      },
    },
  };
}

async function testRealServiceBehavior() {
  console.log('\n=== Testing REAL VendorsService.create() (imported from dist/vendors/vendors.service) ===\n');

  // Test 11: Successful create — real service, mocked Prisma, existing tenant
  const prismaA = createMockPrisma([{ id: 'tenant-1' }]);
  const serviceA = new VendorsService(prismaA);
  const dtoA = { tenantId: 'tenant-1', name: 'First Vendor', slug: 'first-vendor', status: 'ACTIVE' };

  const resultA = await serviceA.create(dtoA);

  assert(prismaA._calls.tenantFindUnique.length === 1, 'create() calls prisma.tenant.findUnique()');
  assert(prismaA._calls.tenantFindUnique[0].where.id === 'tenant-1', 'tenant.findUnique() called with correct tenantId');
  assert(prismaA._calls.vendorFindUnique.length === 1, 'create() calls prisma.vendor.findUnique() for slug check');
  assert(prismaA._calls.vendorFindUnique[0].where.slug === 'first-vendor', 'vendor.findUnique() called with correct slug');
  assert(prismaA._calls.vendorCreate.length === 1, 'Successful create calls prisma.vendor.create()');
  assert(resultA.ok === true, 'Successful create returns ok:true response envelope');
  assert(resultA.data.slug === 'first-vendor', 'Returned vendor has correct slug');
  assert(resultA.data.tenantId === 'tenant-1', 'Returned vendor has correct tenantId');

  // Test 12: Nonexistent tenant — real service throws real Nest NotFoundException
  const prismaB = createMockPrisma([]); // no tenants seeded
  const serviceB = new VendorsService(prismaB);
  const dtoB = { tenantId: 'missing-tenant', name: 'Orphan Vendor', slug: 'orphan-vendor', status: 'ACTIVE' };

  let tenantThrown = null;
  try {
    await serviceB.create(dtoB);
  } catch (e) {
    tenantThrown = e;
  }

  assert(tenantThrown instanceof NotFoundException, 'Missing tenant throws actual @nestjs/common NotFoundException');
  assert(prismaB._calls.vendorCreate.length === 0, 'Missing tenant does NOT call prisma.vendor.create()');
  assert(prismaB._calls.vendorFindUnique.length === 0, 'Missing tenant does NOT reach the slug lookup');

  // Test 13: Duplicate slug — real service throws real Nest ConflictException
  const prismaC = createMockPrisma([{ id: 'tenant-1' }]);
  const serviceC = new VendorsService(prismaC);
  const dtoC = { tenantId: 'tenant-1', name: 'Dup Vendor', slug: 'dup-vendor', status: 'ACTIVE' };

  await serviceC.create(dtoC); // first create succeeds

  let dupThrown = null;
  try {
    await serviceC.create(dtoC); // duplicate slug
  } catch (e) {
    dupThrown = e;
  }

  assert(dupThrown instanceof ConflictException, 'Duplicate slug throws actual @nestjs/common ConflictException');
  assert(
    dupThrown !== null && typeof dupThrown.message === 'string' && dupThrown.message.includes('already exists'),
    'ConflictException carries expected message',
  );
  assert(
    prismaC._calls.vendorCreate.length === 1,
    'Duplicate slug does NOT call prisma.vendor.create() a second time',
  );
  assert(prismaC._calls.vendorFindUnique.length === 2, 'Duplicate slug attempt still calls prisma.vendor.findUnique()');

  // Test 14: Multiple different vendors can be created against the real service
  const prismaD = createMockPrisma([{ id: 'tenant-1' }]);
  const serviceD = new VendorsService(prismaD);
  await serviceD.create({ tenantId: 'tenant-1', name: 'Second Vendor', slug: 'second-vendor', status: 'ACTIVE' });
  await serviceD.create({ tenantId: 'tenant-1', name: 'Third Vendor', slug: 'third-vendor', status: 'DRAFT' });
  assert(prismaD._vendors.length === 2, 'Multiple distinct vendors can be created via real service');
  assert(prismaD._calls.vendorCreate.length === 2, 'prisma.vendor.create() called once per distinct vendor');

  // Test 15: Real service accepts a real validated CreateVendorDto instance
  const prismaE = createMockPrisma([{ id: 'tenant-1' }]);
  const serviceE = new VendorsService(prismaE);
  const validatedDto = plainToInstance(CreateVendorDto, {
    tenantId: 'tenant-1',
    name: 'Final Vendor',
    slug: 'final-vendor',
    status: 'ACTIVE',
  });
  const resultE = await serviceE.create(validatedDto);
  assert(resultE.ok === true, 'Real service accepts validated CreateVendorDto instance and creates vendor');
  assert(prismaE._calls.vendorCreate.length === 1, 'Validated DTO path calls prisma.vendor.create() exactly once');
}

// Main execution
async function run() {
  console.log('Testing Vendor Write API (POST /vendors)\n');
  console.log('Implementation: CreateVendorDto + VendorsService.create() (both imported from dist)\n');

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
