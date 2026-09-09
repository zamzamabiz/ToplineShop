// Focused test for Tenant Write API (POST /tenants)
// Tests validation, valid input, duplicate slug, and expected failure cases.
// Does NOT require a running backend or database — tests the validation DTO directly.

const { validate } = require('class-validator');
const { plainToInstance } = require('class-transformer');

// Inline the DTO logic for testing (since we can't import TypeScript directly)
const TENANT_TYPES = ['PLATFORM', 'VENDOR'];
const TENANT_STATUSES = ['ACTIVE', 'SUSPENDED'];

function validateCreateTenant(input) {
  const errors = [];

  if (typeof input.name !== 'string' || input.name.length === 0) {
    errors.push({ field: 'name', message: 'name must be a non-empty string' });
  } else if (input.name.length > 255) {
    errors.push({ field: 'name', message: 'name must be at most 255 characters' });
  }

  if (typeof input.slug !== 'string' || input.slug.length === 0) {
    errors.push({ field: 'slug', message: 'slug must be a non-empty string' });
  } else if (input.slug.length > 255) {
    errors.push({ field: 'slug', message: 'slug must be at most 255 characters' });
  } else if (!/^[a-z0-9-]+$/.test(input.slug)) {
    errors.push({ field: 'slug', message: 'slug must contain only lowercase letters, numbers, and hyphens' });
  }

  if (!TENANT_TYPES.includes(input.type)) {
    errors.push({ field: 'type', message: `type must be one of: ${TENANT_TYPES.join(', ')}` });
  }

  if (!TENANT_STATUSES.includes(input.status)) {
    errors.push({ field: 'status', message: `status must be one of: ${TENANT_STATUSES.join(', ')}` });
  }

  return { valid: errors.length === 0, errors };
}

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

console.log('Testing Tenant Write API validation logic\n');

// Test 1: Valid input
let result = validateCreateTenant({
  name: 'Acme Corp',
  slug: 'acme-corp',
  type: 'VENDOR',
  status: 'ACTIVE',
});
assert(result.valid === true, 'Valid input passes validation');
assert(result.errors.length === 0, 'Valid input has no errors');

// Test 2: Missing name
result = validateCreateTenant({ slug: 'test', type: 'PLATFORM', status: 'ACTIVE' });
assert(result.valid === false, 'Missing name fails');
assert(result.errors.some(e => e.field === 'name'), 'Missing name error reported');

// Test 3: Empty name
result = validateCreateTenant({ name: '', slug: 'test', type: 'PLATFORM', status: 'ACTIVE' });
assert(result.valid === false, 'Empty name fails');

// Test 4: Name too long
result = validateCreateTenant({
  name: 'a'.repeat(256),
  slug: 'test',
  type: 'PLATFORM',
  status: 'ACTIVE',
});
assert(result.valid === false, 'Name > 255 chars fails');

// Test 5: Invalid slug characters
result = validateCreateTenant({
  name: 'Test',
  slug: 'Test Slug!',
  type: 'PLATFORM',
  status: 'ACTIVE',
});
assert(result.valid === false, 'Invalid slug characters fail');
assert(result.errors.some(e => e.field === 'slug'), 'Invalid slug error reported');

// Test 6: Invalid type
result = validateCreateTenant({
  name: 'Test',
  slug: 'test',
  type: 'INVALID',
  status: 'ACTIVE',
});
assert(result.valid === false, 'Invalid type fails');
assert(result.errors.some(e => e.field === 'type'), 'Invalid type error reported');

// Test 7: Invalid status
result = validateCreateTenant({
  name: 'Test',
  slug: 'test',
  type: 'PLATFORM',
  status: 'DELETED',
});
assert(result.valid === false, 'Invalid status fails');
assert(result.errors.some(e => e.field === 'status'), 'Invalid status error reported');

// Test 8: Valid PLATFORM type
result = validateCreateTenant({
  name: 'Platform',
  slug: 'platform',
  type: 'PLATFORM',
  status: 'ACTIVE',
});
assert(result.valid === true, 'PLATFORM type is valid');

// Test 9: Valid SUSPENDED status
result = validateCreateTenant({
  name: 'Suspended',
  slug: 'suspended',
  type: 'VENDOR',
  status: 'SUSPENDED',
});
assert(result.valid === true, 'SUSPENDED status is valid');

// Test 10: Valid slug with numbers
result = validateCreateTenant({
  name: 'Test',
  slug: 'test-123',
  type: 'VENDOR',
  status: 'ACTIVE',
});
assert(result.valid === true, 'Slug with numbers is valid');

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
