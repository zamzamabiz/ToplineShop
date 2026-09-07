const BASE_URL = 'http://localhost:4000';

async function checkEndpoint(path, expectedStatus, validate) {
  try {
    const res = await fetch(`${BASE_URL}${path}`);
    const status = res.status;
    const body = await res.json();

    if (status !== expectedStatus) {
      console.error(`FAIL ${path}: expected status ${expectedStatus}, got ${status}`);
      process.exit(1);
    }

    if (!validate(body)) {
      console.error(`FAIL ${path}: response validation failed`, body);
      process.exit(1);
    }

    console.log(`PASS ${path}: status=${status} ok=true`);
    return true;
  } catch (err) {
    console.error(`FAIL ${path}: ${err.message}`);
    process.exit(1);
  }
}

async function main() {
  console.log(`Running smoke tests against ${BASE_URL}\n`);

  await checkEndpoint('/', 200, (b) => b.ok === true && b.data.status === 'ok' && b.data.message);
  await checkEndpoint('/health', 200, (b) =>
    b.ok === true &&
    b.data.status === 'ok' &&
    b.data.service === 'toplineshop-api' &&
    b.data.checks.api === 'ok' &&
    b.data.checks.prisma === 'configured' &&
    typeof b.data.checks.database === 'string' &&
    b.data.checks.auth === 'not_configured' &&
    b.data.checks.payments === 'locked' &&
    typeof b.data.environment === 'string' &&
    !JSON.stringify(b).includes('DATABASE_URL') &&
    !JSON.stringify(b).includes('password')
  );
  await checkEndpoint('/version', 200, (b) =>
    b.ok === true &&
    b.data.version === '0.1.0' &&
    b.data.phase === 'P5-002'
  );
  await checkEndpoint('/tenants', 200, (b) =>
    b.ok === true &&
    Array.isArray(b.data) &&
    typeof b.meta.count === 'number' &&
    b.meta.phase === 'P5-003' &&
    !JSON.stringify(b).includes('DATABASE_URL') &&
    !JSON.stringify(b).includes('password')
  );
  await checkEndpoint('/tenants/non-existent-id', 404, (b) =>
    b.statusCode === 404 &&
    b.message === 'Tenant not found' &&
    !JSON.stringify(b).includes('DATABASE_URL') &&
    !JSON.stringify(b).includes('password')
  );
  await checkEndpoint('/vendors', 200, (b) =>
    b.ok === true &&
    Array.isArray(b.data) &&
    typeof b.meta.count === 'number' &&
    b.meta.phase === 'P5-005' &&
    !JSON.stringify(b).includes('DATABASE_URL') &&
    !JSON.stringify(b).includes('password')
  );
  await checkEndpoint('/vendors/non-existent-id', 404, (b) =>
    b.statusCode === 404 &&
    b.message === 'Vendor not found' &&
    !JSON.stringify(b).includes('DATABASE_URL') &&
    !JSON.stringify(b).includes('password')
  );
  await checkEndpoint('/categories', 200, (b) =>
    b.ok === true &&
    Array.isArray(b.data) &&
    typeof b.meta.count === 'number' &&
    b.meta.phase === 'P5-006' &&
    !JSON.stringify(b).includes('DATABASE_URL') &&
    !JSON.stringify(b).includes('password')
  );
  await checkEndpoint('/categories/non-existent-id', 404, (b) =>
    b.statusCode === 404 &&
    b.message === 'Category not found' &&
    !JSON.stringify(b).includes('DATABASE_URL') &&
    !JSON.stringify(b).includes('password')
  );

  console.log('\nAll smoke tests passed.');
}

main();
