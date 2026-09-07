# ToplineShop — Phase 4 Database Implementation Readiness Plan

> **Status**: READINESS AUDIT — DOCUMENTATION ONLY  
> **Date**: 2026-09-07  
> **Task**: TOPLINE-P4-001

---

## 1. Purpose

This document audits the project's readiness for database implementation and provides a safe implementation plan for Phase 4 (Database Foundation). It answers whether the project is ready, what should be built first, and what rules must be followed.

**This is a documentation artifact only.** No Prisma schema, migrations, database connections, or code changes have been made.

---

## 2. Current Project State

| Item | Status |
|------|--------|
| Phase 1 | PASS / CLOSED |
| Phase 2 | PASS / CLOSED |
| Phase 3 | PASS / CLOSED / FROZEN |
| GUI-001 | PASS / CLOSED |
| Frontend routes | 17 (all building) |
| Backend | NestJS bootstrap (port 4000) |
| Health endpoints | GET /, /health, /version |
| Smoke test | PASS (3/3 endpoints) |
| Database | Does not exist |
| Prisma | Not installed |
| Schema | Not created |
| Migrations | Not created |
| Auth | Not implemented |
| Payment | Not implemented |

---

## 3. Phase 3 Freeze Dependency

Phase 3 was frozen via TOPLINE-P3-009. The freeze gate confirmed:
- All 11 Phase 3 tasks CLOSED
- Backend foundation minimal and isolated
- No prohibited items exist
- Frontend protected (17 routes)
- No real secrets in codebase

**Phase 4 database work can begin safely after this readiness audit.**

---

## 4. Backend Readiness Summary

| Component | Status |
|-----------|--------|
| NestJS bootstrap | ✅ `backend/src/main.ts` |
| App module | ✅ `backend/src/app.module.ts` |
| Health controller | ✅ `backend/src/app.controller.ts` |
| Health service | ✅ `backend/src/app.service.ts` |
| Smoke test | ✅ `backend/scripts/smoke-health.js` |
| TypeScript config | ✅ `backend/tsconfig.json` |
| NestJS CLI config | ✅ `backend/nest-cli.json` |
| Dependencies | ✅ Minimal (NestJS core only) |
| No DB packages | ✅ No prisma/typeorm/sequelize |

---

## 5. Approved Database Direction

From Phase 3 design documents:

| Decision | Source |
|----------|--------|
| **PostgreSQL** as primary database | `PHASE-03-DATABASE-SCHEMA-DESIGN.md` |
| **Prisma** as ORM (schema-first) | `PHASE-03-DATABASE-SCHEMA-DESIGN.md` |
| UUID primary keys for all core entities | Design principle #3 |
| Timestamps on all core tables | Design principle #4 |
| Soft delete where appropriate | Design principle #5 |
| Audit logs for sensitive actions | Design principle #6 |
| Money as Decimal(19,4) | Design principle #7 |
| Multi-vendor isolation at query level | Design principle #9 |
| No payment/settlement until Phase 9+ | Design principle #12 |

---

## 6. Prisma/PostgreSQL Setup Recommendation

### P4-002: Prisma Bootstrap (Recommended First Safe Task)

**Scope:**
- Install `prisma` as devDependency
- Install `@prisma/client` as dependency
- Create `prisma/schema.prisma` with minimal generator/datasource
- Create `backend/src/prisma.service.ts` (database connection service)
- Create `backend/src/prisma.module.ts` (NestJS module)
- Update `backend/.env.example` with `DATABASE_URL` placeholder
- Update `backend/README.md` with Prisma setup instructions
- Do NOT create any models yet
- Do NOT run `prisma migrate`
- Do NOT connect to a real database

**Rationale:** This establishes the Prisma foundation without touching any business schema. It can be validated by building the backend successfully.

### P4-003: Core Schema Foundation (After P4-002)

**Scope:**
- Add core platform models to `prisma/schema.prisma`:
  - `Tenant` (multi-tenant foundation)
  - `User` (identity)
  - `UserRole` (role mapping)
  - `Vendor` (seller foundation)
  - `Category` (catalog tree)
  - `Product` (catalog foundation)
  - `AuditLog` (activity tracking)
- Run `prisma migrate dev` (development only)
- Create seed placeholder (no real data)
- Validate schema compiles

---

## 7. Proposed Database Implementation Sequence

| Task | Title | Scope | Risk |
|------|-------|-------|------|
| P4-001 | Database Readiness Audit | This document | NONE |
| P4-002 | Prisma Bootstrap | Install Prisma, connection service, no models | LOW |
| P4-003 | Core Schema Foundation | Tenant, User, Vendor, Category, Product, AuditLog | MEDIUM |
| P4-004 | Seed Script Foundation | Safe dev seed data for testing | LOW |
| P4-005 | Database Foundation Freeze Gate | Audit + freeze | NONE |

---

## 8. First Safe Database Task Recommendation

**P4-002: Prisma/PostgreSQL Bootstrap**

This task should:
1. Install `prisma` and `@prisma/client`
2. Create minimal `prisma/schema.prisma`:
   ```prisma
   generator client {
     provider = "prisma-client-js"
   }

   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
3. Create `PrismaService` and `PrismaModule` for NestJS
4. Update `backend/.env.example` with safe placeholder
5. Verify backend builds with Prisma installed
6. Do NOT create any data models yet
7. Do NOT run migrations
8. Do NOT connect to a real database

---

## 9. Suggested Domain Model Groups

From `PHASE-03-DATABASE-SCHEMA-DESIGN.md`:

| Group | Models | Phase |
|-------|--------|-------|
| **Platform Core** | Tenant, User, UserRole, StaffRole, AuditLog | P4-003 |
| **Vendor/Seller** | Vendor, VendorUser, VendorProfile, VendorVerification | P4-003 |
| **Catalog** | Category, Product, ProductImage, ProductVariant | P4-003 |
| **B2C Commerce** | Cart, CartItem, Order, OrderItem, Address | Phase 5+ |
| **B2B Wholesale** | WholesaleBuyerProfile, RFQ, RFQItem | Phase 5+ |
| **Payments** | Payment, Refund, CommissionRule, Settlement | Phase 9+ |
| **Admin/Owner** | PlatformSetting, AdminActionLog, RiskFlag | Phase 6+ |
| **Notifications** | Notification, SupportTicket | Phase 5+ |
| **AI Governance** | AiAssistantLog, AiRecommendation | Future |

---

## 10. Multi-Tenant SaaS Database Principles

1. Every business table belongs to a `tenantId` where appropriate
2. Cross-tenant data isolation enforced at query level
3. Future RBAC must respect tenant scope
4. Future audit logs track `actorId`, `action`, `entityType`, `entityId`, `timestamp`
5. Future modules must not bypass tenant isolation
6. Tenant deletion cascades safely or blocks if data exists
7. Platform admin can view all tenants; vendor admin sees only their tenant

---

## 11. Migration Safety Rules

1. **No destructive migration** — never use `DROP TABLE` or `DROP COLUMN` without PM approval
2. **No reset command** — never run `prisma migrate reset` in any environment without explicit approval
3. **No seed/reset/init scripts** in production
4. **No production DATABASE_URL** in codebase
5. **No real credentials** committed
6. **No auto migration** — every migration requires PM review before `prisma migrate dev`
7. **Migration must be reviewed** before execution
8. **Rollback note required** — every migration must document how to undo it
9. **WDR required** after any migration task
10. **Development only** — migrations run in dev only until explicit production approval

---

## 12. Environment and Secrets Rules

| Rule | Status |
|------|--------|
| `.env.example` only (no real secrets) | ✅ Enforced |
| `backend/.env.example` only | ✅ Enforced |
| `.env` files ignored by git | ✅ `.gitignore` configured |
| No real `DATABASE_URL` | ✅ Placeholder only |
| No JWT secret | ✅ Placeholder only |
| No API keys | ✅ None exist |
| No payment keys | ✅ None exist |
| Production secrets via environment variables only | Documented |

---

## 13. Prohibited Actions

| Action | Status |
|--------|--------|
| Install Prisma | ❌ Prohibited until P4-002 |
| Create schema.prisma | ❌ Prohibited until P4-003 |
| Run migrations | ❌ Prohibited until P4-003 |
| Create seed scripts | ❌ Prohibited until P4-004 |
| Connect to PostgreSQL | ❌ Prohibited until real DB needed |
| Create .env.local | ❌ Prohibited |
| Create backend/.env | ❌ Prohibited |
| Implement auth/RBAC | ❌ Prohibited until Phase 8 |
| Implement payment/commerce | ❌ Prohibited until Phase 9+ |
| Implement CRM/ERP modules | ❌ Prohibited |
| Migrate from shop.com | ❌ Prohibited |
| Destructive migrations | ❌ Prohibited |

---

## 14. Validation Requirements for Future DB Tasks

Every database implementation task must:
1. Pass `npm run build` (root + backend)
2. Pass `npm run lint` (root)
3. Pass `npm run smoke` (backend)
4. Have WDR with migration evidence
5. Have rollback documentation
6. Have PM approval before migration execution
7. Not break existing frontend routes (17)
8. Not break existing health endpoints

---

## 15. Known Limitations

- No PostgreSQL server available yet (local dev or remote)
- No Prisma installed yet
- No schema exists yet
- No seed data exists yet
- Database design is document-only (844-line design doc)
- Multi-tenant isolation not yet validated in code
- No database backup/restore procedure defined

---

## 16. Recommended Next Task

**TOPLINE-P4-002: Prisma/PostgreSQL Bootstrap**

This is the safest first database task:
- Installs Prisma without creating business schema
- Creates connection service foundation
- Validates backend builds with Prisma
- No real database connection needed yet
- No migrations run
- No business logic implemented

---

## 17. Final Readiness Decision

### ✅ READY FOR P4-002 PLANNING/BOOTSTRAP

**Evidence:**
- Phase 3 frozen and all tasks closed
- Backend foundation exists and builds
- Health endpoints verified
- Database schema design document complete (844 lines)
- Environment safety rules established
- Prisma approved as ORM in Phase 3 docs
- PostgreSQL approved as database in Phase 3 docs
- Multi-tenant SaaS strategy documented
- No prohibited items found
- Frontend protected (17 routes)
- No real secrets in codebase

**The project is ready to begin P4-002 (Prisma Bootstrap) safely.**
