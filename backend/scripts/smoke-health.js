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

  await checkEndpoint('/', 200, (b) => b.status === 'ok' && b.message);
  await checkEndpoint('/health', 200, (b) => b.status === 'ok' && b.service === 'toplineshop-api');
  await checkEndpoint('/version', 200, (b) => b.version === '0.1.0' && b.phase === 'P3-008');

  console.log('\nAll smoke tests passed.');
}

main();
