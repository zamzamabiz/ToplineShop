/**
 * P8-002 Auth Persistence — Database Integration Tests
 *
 * Validates the P8-002 schema additions against the live local database:
 *   - users.password_hash  (nullable text, additive column)
 *   - audit_logs.ip_address / user_agent  (nullable text, additive columns)
 *   - sessions table  (CREATE TABLE with 5 indexes and 2 FK constraints)
 *
 * Datasource guard: refuses to execute if DATABASE_URL does not point to
 * localhost:5433/toplineshop_dev, preventing accidental hits against any
 * non-local, shared, or production target.
 *
 * Cleanup: afterAll removes only rows created by this test run using a
 * per-run unique tag, and deletes in FK-safe dependency order.
 */

import * as fs from 'fs';
import * as path from 'path';
import { PrismaClient, Prisma } from '@prisma/client';

// ---------------------------------------------------------------------------
// .env loader
// PrismaClient reads DATABASE_URL from process.env. The Prisma CLI loads the
// .env automatically; Jest does not. Load manually when DATABASE_URL is absent.
// ---------------------------------------------------------------------------
if (!process.env.DATABASE_URL) {
  const envFile = path.resolve(__dirname, '../../.env');
  if (fs.existsSync(envFile)) {
    const raw = fs.readFileSync(envFile, 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*"?([^"\r\n]*)"?\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
    }
  }
}

// ---------------------------------------------------------------------------
// Datasource guard — must be localhost:5433/toplineshop_dev
// ---------------------------------------------------------------------------
function assertLocalDatasource(): void {
  const url = process.env.DATABASE_URL ?? '';
  const m = url.match(/postgresql:\/\/[^@]+@([^:/]+):(\d+)\/([^?]+)/);
  if (!m) throw new Error('P8-002 guard: DATABASE_URL not set or not parseable');
  const [, host, port, db] = m;
  const ok =
    ['localhost', '127.0.0.1'].includes(host) &&
    port === '5433' &&
    db === 'toplineshop_dev';
  if (!ok) {
    throw new Error(
      'P8-002 guard: refusing to run DB integration tests — ' +
        'datasource is not localhost:5433/toplineshop_dev',
    );
  }
}

// Give DB operations more headroom than the default 10 s.
jest.setTimeout(30000);

// ---------------------------------------------------------------------------
describe('P8-002 Auth Persistence — DB Integration', () => {
  let prisma: PrismaClient;
  let testUserId: string;
  let testTenantId: string;
  // Unique tag scopes every row created in this run so cleanup is safe.
  const TAG = `p8002-${Date.now()}`;

  // -------------------------------------------------------------------------
  beforeAll(async () => {
    assertLocalDatasource();
    prisma = new PrismaClient();
    await prisma.$connect();

    // Prerequisite: tenant (sessions FK requirement)
    const tenant = await prisma.tenant.create({
      data: {
        name: `P8-002 Test Tenant ${TAG}`,
        slug: TAG,
        type: 'VENDOR',
        status: 'ACTIVE',
      },
    });
    testTenantId = tenant.id;

    // Prerequisite: user created WITH passwordHash to prove initial storage
    const user = await prisma.user.create({
      data: {
        email: `${TAG}@test.local`,
        name: `P8-002 Test User ${TAG}`,
        status: 'ACTIVE',
        passwordHash: `hash-${TAG}-initial`,
      },
    });
    testUserId = user.id;
  });

  // -------------------------------------------------------------------------
  afterAll(async () => {
    if (!prisma) return;
    try {
      if (testUserId) {
        // Sessions must be removed before user/tenant (FK ON DELETE RESTRICT)
        await prisma.session.deleteMany({ where: { userId: testUserId } });
        // Audit logs reference both user and tenant — cover both
        await prisma.auditLog.deleteMany({
          where: { OR: [{ actorUserId: testUserId }, { tenantId: testTenantId }] },
        });
        await prisma.user.delete({ where: { id: testUserId } });
      }
      if (testTenantId) {
        await prisma.tenant.delete({ where: { id: testTenantId } });
      }
    } finally {
      await prisma.$disconnect();
    }
  });

  // =========================================================================
  // 1–2: users.password_hash
  // =========================================================================
  describe('users.password_hash', () => {
    it('stores password_hash on user create and reads it back', async () => {
      const user = await prisma.user.findUniqueOrThrow({ where: { id: testUserId } });
      expect(user.passwordHash).toBe(`hash-${TAG}-initial`);
    });

    it('updates password_hash and persists the new value', async () => {
      const updated = `hash-${TAG}-updated`;
      await prisma.user.update({
        where: { id: testUserId },
        data: { passwordHash: updated },
      });
      const user = await prisma.user.findUniqueOrThrow({ where: { id: testUserId } });
      expect(user.passwordHash).toBe(updated);
    });
  });

  // =========================================================================
  // 3: audit_logs.ip_address + user_agent
  // =========================================================================
  describe('audit_logs.ip_address and user_agent', () => {
    it('stores ip_address and user_agent on create and reads them back', async () => {
      const log = await prisma.auditLog.create({
        data: {
          actorUserId: testUserId,
          tenantId: testTenantId,
          action: 'LOGIN',
          entityType: 'USER',
          entityId: testUserId,
          ipAddress: '127.0.0.1',
          userAgent: `TestAgent/${TAG}`,
        },
      });
      expect(log.ipAddress).toBe('127.0.0.1');
      expect(log.userAgent).toBe(`TestAgent/${TAG}`);

      // Round-trip: read from DB
      const fetched = await prisma.auditLog.findUniqueOrThrow({ where: { id: log.id } });
      expect(fetched.ipAddress).toBe('127.0.0.1');
      expect(fetched.userAgent).toBe(`TestAgent/${TAG}`);
    });
  });

  // =========================================================================
  // 4–9: sessions table
  // =========================================================================
  describe('sessions', () => {
    let sessionId: string;

    // 4. Basic create
    it('creates a session record with all required fields', async () => {
      const session = await prisma.session.create({
        data: {
          userId: testUserId,
          tenantId: testTenantId,
          tokenHash: `tok-${TAG}-1`,
          ipAddress: '127.0.0.1',
          userAgent: 'TestAgent/1.0',
          expiresAt: new Date(Date.now() + 3_600_000),
        },
      });
      sessionId = session.id;
      expect(session.id).toBeTruthy();
      expect(session.userId).toBe(testUserId);
      expect(session.tenantId).toBe(testTenantId);
      expect(session.tokenHash).toBe(`tok-${TAG}-1`);
      expect(session.revokedAt).toBeNull();
    });

    // 5. token_hash unique constraint
    it('enforces token_hash unique constraint (P2002)', async () => {
      let err: unknown;
      try {
        await prisma.session.create({
          data: {
            userId: testUserId,
            tenantId: testTenantId,
            tokenHash: `tok-${TAG}-1`, // duplicate of session above
            expiresAt: new Date(Date.now() + 3_600_000),
          },
        });
      } catch (e) {
        err = e;
      }
      expect(err).toBeInstanceOf(Prisma.PrismaClientKnownRequestError);
      expect((err as Prisma.PrismaClientKnownRequestError).code).toBe('P2002');
    });

    // 6. user_id FK constraint
    it('enforces user_id FK constraint (P2003)', async () => {
      let err: unknown;
      try {
        await prisma.session.create({
          data: {
            userId: 'non-existent-uid-p8002',
            tenantId: testTenantId,
            tokenHash: `tok-${TAG}-fk-user`,
            expiresAt: new Date(Date.now() + 3_600_000),
          },
        });
      } catch (e) {
        err = e;
      }
      expect(err).toBeInstanceOf(Prisma.PrismaClientKnownRequestError);
      expect((err as Prisma.PrismaClientKnownRequestError).code).toBe('P2003');
    });

    // 7. tenant_id FK constraint
    it('enforces tenant_id FK constraint (P2003)', async () => {
      let err: unknown;
      try {
        await prisma.session.create({
          data: {
            userId: testUserId,
            tenantId: 'non-existent-tid-p8002',
            tokenHash: `tok-${TAG}-fk-tenant`,
            expiresAt: new Date(Date.now() + 3_600_000),
          },
        });
      } catch (e) {
        err = e;
      }
      expect(err).toBeInstanceOf(Prisma.PrismaClientKnownRequestError);
      expect((err as Prisma.PrismaClientKnownRequestError).code).toBe('P2003');
    });

    // 8. Session revocation
    it('revokes a session by setting revoked_at', async () => {
      const revokedAt = new Date();
      await prisma.session.update({
        where: { id: sessionId },
        data: { revokedAt },
      });
      const session = await prisma.session.findUniqueOrThrow({ where: { id: sessionId } });
      expect(session.revokedAt).not.toBeNull();
      expect(
        Math.abs(session.revokedAt!.getTime() - revokedAt.getTime()),
      ).toBeLessThan(1000);
    });

    // 9. Expiry query
    it('excludes expired sessions from active-session queries (expires_at)', async () => {
      const expired = await prisma.session.create({
        data: {
          userId: testUserId,
          tenantId: testTenantId,
          tokenHash: `tok-${TAG}-expired`,
          expiresAt: new Date(Date.now() - 3_600_000), // 1 hour in the past
        },
      });
      const active = await prisma.session.findMany({
        where: { userId: testUserId, expiresAt: { gt: new Date() } },
      });
      const activeIds = active.map((s) => s.id);
      expect(activeIds).not.toContain(expired.id);
    });
  });
});
