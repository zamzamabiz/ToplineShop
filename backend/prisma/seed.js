'use strict';
/**
 * Development seed — creates the minimum data needed to log in and inspect TDR.
 *
 * Run: npm run seed  (from backend/)
 *
 * Dev credentials:
 *   Email:    admin@toplineshop.dev
 *   Password: DevAdmin123!
 *
 * This script is idempotent (upsert). It is safe to run multiple times.
 * DO NOT run against production.
 */

const { PrismaClient } = require('@prisma/client');
const argon2 = require('argon2');

const prisma = new PrismaClient();

const DEV_EMAIL = 'admin@toplineshop.dev';
const DEV_NAME = 'Dev Admin';
const DEV_PASSWORD = 'DevAdmin123!';
const DEV_TENANT_NAME = 'ERP64 Dev Tenant';
const DEV_TENANT_SLUG = 'erp64-dev';
const MODULE_KEY = 'TRADE_DATA_REFINERY';

async function main() {
  console.log('Seeding development database...');

  const passwordHash = await argon2.hash(DEV_PASSWORD, { type: argon2.argon2id });

  const tenant = await prisma.tenant.upsert({
    where: { slug: DEV_TENANT_SLUG },
    update: {},
    create: {
      name: DEV_TENANT_NAME,
      slug: DEV_TENANT_SLUG,
      type: 'PLATFORM',
      status: 'ACTIVE',
    },
  });
  console.log(`Tenant:        ${tenant.id}  (${tenant.name})`);

  const user = await prisma.user.upsert({
    where: { email: DEV_EMAIL },
    update: {},
    create: {
      email: DEV_EMAIL,
      name: DEV_NAME,
      passwordHash,
      status: 'ACTIVE',
    },
  });
  console.log(`User:          ${user.id}  (${user.email})`);

  const membership = await prisma.membership.upsert({
    where: { userId_tenantId: { userId: user.id, tenantId: tenant.id } },
    update: {},
    create: {
      userId: user.id,
      tenantId: tenant.id,
      status: 'ACTIVE',
    },
  });
  console.log(`Membership:    ${membership.id}  (${membership.status})`);

  const tenantModule = await prisma.tenantModule.upsert({
    where: { tenantId_moduleKey: { tenantId: tenant.id, moduleKey: MODULE_KEY } },
    update: { enabled: true, enabledAt: new Date(), enabledById: user.id },
    create: {
      tenantId: tenant.id,
      moduleKey: MODULE_KEY,
      enabled: true,
      enabledAt: new Date(),
      enabledById: user.id,
    },
  });
  console.log(`TenantModule:  ${tenantModule.id}  (${MODULE_KEY}: ${tenantModule.enabled ? 'ENABLED' : 'DISABLED'})`);

  console.log('\n=== Dev seed complete ===');
  console.log(`Login email:   ${DEV_EMAIL}`);
  console.log(`Password:      ${DEV_PASSWORD}`);
  console.log(`Tenant ID:     ${tenant.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
