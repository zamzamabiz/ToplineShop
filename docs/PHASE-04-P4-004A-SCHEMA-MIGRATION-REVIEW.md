# ToplineShop — P4-004A Schema & Migration Review

> **Status**: SCHEMA IMPLEMENTED — NO MIGRATION EXECUTED  
> **Date**: 2026-09-07  
> **Task**: TOPLINE-P4-004A  
> **Author**: Implementation Agent under PM governance

---

## 1. Purpose

This document reviews the core Prisma schema models implemented in `backend/prisma/schema.prisma` and the expected migration that would be generated. No migration has been executed against any database.

---

## 2. Schema Summary

| Metric | Count |
|--------|-------|
| Models | 7 |
| Enums | 7 |
| Relations | 8 |
| Unique constraints | 6 |
| Indexes | 5 |
| Migrations executed | 0 |

---

## 3. Enum List

| Enum | Values | Used By |
|------|--------|---------|
| TenantType | PLATFORM, VENDOR | Tenant |
| TenantStatus | ACTIVE, SUSPENDED | Tenant |
| UserStatus | ACTIVE, DISABLED | User |
| MembershipStatus | ACTIVE, INVITED, SUSPENDED | Membership |
| VendorStatus | DRAFT, ACTIVE, SUSPENDED | Vendor |
| CategoryStatus | ACTIVE, HIDDEN | Category |
| ProductStatus | DRAFT, ACTIVE, ARCHIVED | Product |

---

## 4. Model List

| Model | Table Name | PK | Soft Delete | tenantId |
|-------|-----------|-----|-------------|----------|
| Tenant | tenants | UUID | deletedAt | N/A (boundary) |
| User | users | UUID | deletedAt | No (platform-level) |
| Membership | memberships | UUID | No | Yes (via FK) |
| Vendor | vendors | UUID | deletedAt | Yes |
| Category | categories | UUID | deletedAt | Yes |
| Product | products | UUID | deletedAt | Yes |
| AuditLog | audit_logs | UUID | No | Yes (optional) |

---

## 5. Relations Summary

| From | To | Type | FK Field |
|------|----|------|----------|
| Membership | User | N:1 | userId |
| Membership | Tenant | N:1 | tenantId |
| Vendor | Tenant | N:1 | tenantId |
| Vendor | User | N:1 | ownerId (optional) |
| Category | Tenant | N:1 | tenantId |
| Category | Category | N:1 (self) | parentId (optional) |
| Product | Tenant | N:1 | tenantId |
| Product | Vendor | N:1 | vendorId |
| Product | Category | N:1 | categoryId |
| AuditLog | Tenant | N:1 (optional) | tenantId |
| AuditLog | User | N:1 (optional) | actorUserId |

---

## 6. Tenant Isolation Summary

| Model | Isolation | Rule |
|-------|-----------|------|
| Tenant | Boundary | Isolation boundary itself |
| User | Global | Platform-level, no tenantId |
| Membership | Bridge | Links User ↔ Tenant |
| Vendor | tenantId | All queries filter by tenantId |
| Category | tenantId | All queries filter by tenantId. Slug unique per tenant. |
| Product | tenantId | All queries filter by tenantId. Slug unique per tenant. |
| AuditLog | tenantId (optional) | Platform events may have null tenantId |

---

## 7. Unique / Index Summary

| Model | Constraint | Type |
|-------|-----------|------|
| Tenant | slug | UNIQUE |
| User | email | UNIQUE |
| Membership | (userId, tenantId) | UNIQUE |
| Vendor | slug | UNIQUE |
| Category | (tenantId, slug) | UNIQUE |
| Product | (tenantId, slug) | UNIQUE |
| Product | vendorId | INDEX |
| Product | categoryId | INDEX |
| AuditLog | tenantId | INDEX |
| AuditLog | (entityType, entityId) | INDEX |
| AuditLog | createdAt | INDEX |

---

## 8. Expected Future Migration

When P4-004B runs `prisma migrate dev`, the following SQL objects would be created:

- 7 enum types
- 7 tables with columns, primary keys, foreign keys
- 6 unique constraints
- 5 indexes

**Migration name suggestion**: `init_core_schema`

**Risk**: LOW — all new tables, no destructive operations, no data loss possible.

---

## 9. Rollback Note

If rollback is needed:
- Drop all 7 tables in reverse dependency order
- Drop all 7 enum types
- Or: `prisma migrate reset` (destructive, requires PM approval)

---

## 10. P4-004B Prerequisites

Before P4-004B can execute:
- [ ] PM approves this schema review
- [ ] Local PostgreSQL available (or Docker)
- [ ] `DATABASE_URL` configured in `backend/.env`
- [ ] `backend/.env` added to `.gitignore` (already configured)
- [ ] PM approves migration execution
- [ ] Migration SQL reviewed for safety

---

## 11. Confirmation

- ✅ 7 models implemented (Tenant, User, Membership, Vendor, Category, Product, AuditLog)
- ✅ 7 enums implemented
- ✅ No migration executed
- ✅ No database connection created
- ✅ No db push run
- ✅ No seed scripts created
- ✅ Prisma validate PASS
- ✅ Prisma generate PASS
