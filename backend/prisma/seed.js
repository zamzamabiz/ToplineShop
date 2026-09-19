'use strict';
/**
 * Development seed — creates the minimum data needed to log in and inspect TDR.
 *
 * Usage (from backend/):
 *   $env:TDR_DEV_ADMIN_PASSWORD="<your-dev-choice>"; npm run seed   (PowerShell)
 *   TDR_DEV_ADMIN_PASSWORD="<your-dev-choice>" npm run seed          (bash)
 *
 * Requires TDR_DEV_ADMIN_PASSWORD environment variable — no default, must be set locally.
 * The seed is idempotent and rotates the password hash on every run.
 *
 * ROLE ARCHITECTURE NOTE: The Membership model carries no roles field.
 * auth.service.ts always issues roles: [] at login time.
 * Read-only TDR inspection works with roles: [].
 * Mutations (cancel/replay/correct/upload) require roles — this is a known
 * architecture gap pending PM authorization (not within scope of this seed).
 *
 * DO NOT RUN AGAINST PRODUCTION.
 */

const { PrismaClient } = require('@prisma/client');
const argon2 = require('argon2');

const prisma = new PrismaClient();

const DEV_EMAIL = 'admin@toplineshop.dev';
const DEV_NAME = 'Dev Admin';
const DEV_TENANT_NAME = 'ERP64 Dev Tenant';
const DEV_TENANT_SLUG = 'erp64-dev';
const MODULE_KEY = 'TRADE_DATA_REFINERY';

async function main() {
  const rawPassword = process.env.TDR_DEV_ADMIN_PASSWORD;
  if (!rawPassword) {
    throw new Error(
      'TDR_DEV_ADMIN_PASSWORD is required for development seed.\n' +
      'Set it in your shell before running:\n' +
      '  PowerShell: $env:TDR_DEV_ADMIN_PASSWORD="..."; npm run seed\n' +
      '  bash:       TDR_DEV_ADMIN_PASSWORD="..." npm run seed',
    );
  }

  console.log('Seeding development database...');

  const passwordHash = await argon2.hash(rawPassword, { type: argon2.argon2id });

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

  // update includes passwordHash so each seed run rotates the stored hash
  const user = await prisma.user.upsert({
    where: { email: DEV_EMAIL },
    update: { passwordHash },
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
  console.log(`Password:      [set via TDR_DEV_ADMIN_PASSWORD env var — not echoed]`);
  console.log(`Tenant ID:     ${tenant.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
