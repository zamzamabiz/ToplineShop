# ToplineShop — Phase 5 Backend API Readiness Plan + Service Layer Architecture

> **Status**: READINESS PLAN — DOCUMENTATION ONLY  
> **Date**: 2026-09-07  
> **Task**: TOPLINE-P5-001  
> **Author**: Implementation Agent under PM governance  
> **Approval Required**: PM before any API implementation begins

---

## 1. Purpose

This document defines how backend API work will be implemented safely after the Phase 4 database foundation. It establishes the service layer architecture, API standards, tenant isolation rules, and the exact next implementation task.

**This is a planning/documentation artifact only.** No API endpoints, controllers, services, or repositories have been created.

---

## 2. Current Frozen Baseline

| Item | Status |
|------|--------|
| Phase 1 | PASS / CLOSED |
| Phase 2 | PASS / CLOSED |
| Phase 3 | PASS / CLOSED / FROZEN |
| GUI-001 | PASS / CLOSED |
| Phase 4 | PASS / CLOSED / FROZEN |
| Prisma version | 6.19.3 |
| @prisma/client version | 6.19.3 |
| PostgreSQL | 17.6 (local dev) |
| Database | toplineshop_dev (local) |
| Migration | `20260907172636_init_core_schema` |
| Models | 7 (Tenant, User, Membership, Vendor, Category, Product, AuditLog) |
| Enums | 7 |
| Tables | 7 |
| Indexes | 11 |
| Foreign keys | 11 |
| Seed data | None |
| Auth/RBAC | Not implemented |
| Payment/commerce | Not implemented |
| Health endpoints | GET /, /health, /version |
| Health status | `database: not_configured` |
| Backend smoke | PASS |
| Frontend routes | 17 |

---

## 3. Phase 5 Goal

Phase 5 should introduce backend service/API foundation safely, without jumping into full commerce. The goal is to:

1. Establish common API standards (response format, error handling)
2. Validate Prisma access patterns in a real service
3. Enforce tenant isolation at the service layer
4. Build the foundation for future business endpoints

**Phase 5 should NOT:**
- Implement full business CRUD
- Implement auth/RBAC enforcement
- Implement payment/order/commerce logic
- Add complex validation pipes

---

## 4. Recommended First API Domain

### Recommended: System Metadata + Database Health

The safest first implementation domain is **system metadata and database health status** because:

1. **Low risk** — No business logic, no financial implications
2. **Validates architecture** — Tests Prisma access, service layer, response format
3. **Validates tenant isolation** — Can test tenant-scoped queries safely
4. **No auth required** — Public endpoints for health/status
5. **Immediate value** — Health endpoint can report real DB status

### Avoid Starting With

| Domain | Reason |
|--------|--------|
| Orders | Complex business logic, financial implications |
| Payments | High-risk, requires auth, financial safety |
| Checkout | Complex workflow, financial implications |
| RFQ | B2B complexity, approval workflows |
| Auth/RBAC | Security-critical, requires careful design |
| Vendor onboarding | Multi-step workflow, approval logic |

---

## 5. Backend Module Architecture

### Proposed Structure

```
backend/src/
  common/
    dto/                    # Shared DTOs (future)
    filters/                # Exception filters (future)
    interceptors/           # Response interceptors (future)
    responses/              # Standard response helpers
    errors/                 # Custom error classes (future)
  prisma/
    prisma.module.ts        # Global PrismaModule (exists)
    prisma.service.ts       # PrismaService (exists)
  health/
    health.module.ts        # Health module (future refinement)
    health.controller.ts    # Health endpoints (refine existing)
    health.service.ts       # Health business logic (refine existing)
  tenants/                  # Future: Tenant read service
    tenants.module.ts
    tenants.controller.ts
    tenants.service.ts
  audit/                    # Future: Audit logging service
    audit.module.ts
    audit.service.ts
  app.module.ts             # Root module (exists)
  app.controller.ts         # Root controller (exists)
  app.service.ts            # Root service (exists)
  main.ts                   # Bootstrap (exists)
```

### Module Rules

- Each domain gets its own module (tenants, audit, health, etc.)
- Modules are self-contained with controller, service, and optional repository
- Global modules (PrismaModule) are imported where needed
- No circular dependencies between modules

---

## 6. Controller / Service / Repository Boundaries

### Controller Rules

- Controllers handle HTTP boundary only (request/response mapping)
- Controllers delegate all business logic to services
- Controllers do NOT access Prisma directly
- Controllers do NOT contain business rules
- Controllers return standardized response format

### Service Rules

- Services contain business/read logic
- Services use PrismaService for database access
- Services enforce tenant isolation
- Services map Prisma results to safe DTOs
- Services do NOT expose raw Prisma objects to controllers

### Repository Rules (Optional)

- Repositories may be introduced for complex queries
- Repositories encapsulate Prisma query logic
- Repositories are injectable services
- Not required for simple CRUD — services can use PrismaService directly

---

## 7. Prisma Access Rules

| Rule | Enforcement |
|------|-------------|
| PrismaService used only in services/repositories | Controllers never access Prisma directly |
| No raw DB access in controllers | All DB access through service layer |
| No cross-tenant query without tenant filter | Services must filter by tenantId for tenant-scoped data |
| No direct exposure of internal Prisma objects | Services map to DTOs before returning |
| PrismaService onModuleInit remains empty | Connection enabled only when DB health check is implemented |
| No raw Prisma errors returned to client | Services catch and transform errors |

---

## 8. Tenant Isolation Plan

### Core Rules

| Model | Isolation | Enforcement |
|-------|-----------|-------------|
| Tenant | Boundary | Isolation boundary itself |
| User | Global | Platform-level, no tenantId |
| Membership | Bridge | Links User ↔ Tenant |
| Vendor | tenantId | All queries filter by tenantId |
| Category | tenantId | All queries filter by tenantId |
| Product | tenantId | All queries filter by tenantId |
| AuditLog | tenantId (optional) | Platform events may have null tenantId |

### Enforcement Strategy

1. **Service layer** — All tenant-scoped queries include `WHERE tenantId = :currentTenantId`
2. **Middleware (future)** — Extract tenantId from request context (auth/tenant resolution)
3. **No bypass** — No service may query tenant-scoped data without tenantId filter
4. **Owner/Admin (future)** — Cross-tenant access requires explicit authorization and audit logging
5. **First task** — No tenant resolution middleware yet; use hardcoded or test tenantId for validation

### First Task Tenant Strategy

For the first implementation task (P5-002), tenant isolation can be validated by:
- Using a test tenantId in service methods
- Verifying queries include tenantId filter
- No real tenant resolution middleware yet

---

## 9. API Response Standard

### Success Response

```json
{
  "ok": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150
  }
}
```

### Error Response

```json
{
  "ok": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable safe message"
  }
}
```

### Response Rules

- All responses wrapped in standard envelope
- No sensitive stack traces in client response
- No raw Prisma errors returned
- No internal implementation details exposed
- Error codes are predictable and documented
- Request ID may be added in future for tracing

---

## 10. Error Handling Standard

### Error Categories

| Category | HTTP Status | Example |
|----------|-------------|---------|
| Validation | 400 | Invalid request body |
| Not Found | 404 | Resource not found |
| Unauthorized | 401 | Missing/invalid auth (future) |
| Forbidden | 403 | Insufficient permissions (future) |
| Conflict | 409 | Resource already exists |
| Internal | 500 | Server error |

### Error Rules

- Safe error responses — no sensitive details
- No raw Prisma errors returned to client
- Predictable status codes
- Centralized exception filter (future)
- Logging without secrets
- No stack traces in production responses

---

## 11. DTO and Validation Plan

### DTO Introduction Strategy

| Phase | DTO Scope |
|-------|-----------|
| P5-002 | Read-only response DTOs for health/metadata |
| P5-003+ | Request DTOs for write endpoints |
| Future | class-validator/class-transformer for input validation |

### First Task DTO Rules

- Read-only endpoints start with safe response DTOs
- No package installation in P5-001
- Validation pipes deferred unless next task explicitly approves
- DTOs are TypeScript interfaces or classes (no decorators yet)

---

## 12. Audit Logging Plan

### Current State

- AuditLog model exists in database
- No audit write service implemented
- No automatic audit capture

### Future Plan

- AuditLog service introduced later (separate task)
- Audit writes for: tenant changes, user changes, vendor changes, product changes, admin actions
- No audit logging in first API task unless explicitly scoped
- No fake audit claims
- No audit logging of secrets

### Audit Rules

- AuditLog is write-only (no updates/deletes)
- AuditLog includes tenantId where applicable
- AuditLog includes actorUserId where applicable
- AuditLog action format: ENTITY_ACTION (e.g., TENANT_CREATED)

---

## 13. Security and Secrets Rules

| Rule | Enforcement |
|------|-------------|
| No secrets in responses | Never return passwords, tokens, keys |
| No raw SQL | Use Prisma ORM only |
| No production DB exposure | Local dev only |
| No destructive endpoints | No DROP/TRUNCATE/DELETE without approval |
| No unaudited financial operations | Financial endpoints require audit logging |
| Tenant-safe access required | Before business APIs |
| No auth bypass | Auth enforcement deferred to Phase 8+ |

---

## 14. Deferred API Domains

| Domain | Deferred To | Reason |
|--------|------------|--------|
| Auth/login/logout | Phase 8+ | Security-critical |
| RBAC enforcement | Phase 8+ | Requires auth foundation |
| User registration | Phase 8+ | Requires auth |
| Vendor onboarding | Phase 5+ (later) | Multi-step workflow |
| Product CRUD | Phase 5+ (later) | Business logic |
| Category CRUD | Phase 5+ (later) | Business logic |
| Cart | Phase 5+ (later) | Commerce logic |
| Orders | Phase 5+ (later) | Complex workflow |
| Checkout | Phase 5+ (later) | Financial implications |
| Payments | Phase 9+ | High-risk financial |
| RFQ | Phase 5+ (later) | B2B complexity |
| Subscriptions | Phase 9+ | Billing complexity |
| CRM/ERP modules | Phase 7+ | Domain-specific |
| Admin destructive ops | Phase 6+ | Requires RBAC |

---

## 15. Recommended P5 Implementation Sequence

| Task | Title | Scope | Risk |
|------|-------|-------|------|
| P5-001 | Backend API Readiness Plan | This document | NONE |
| P5-002 | Backend Common API Standards + DB Health Status | Response helpers, refined health endpoint | LOW |
| P5-003 | Tenant Read Service | Basic tenant CRUD (read-only first) | LOW |
| P5-004 | Audit Logging Foundation | AuditLog write service | LOW |
| P5-005 | Vendor Read Service | Basic vendor read endpoints | LOW |
| P5-006 | Category Read Service | Basic category read endpoints | LOW |
| P5-007 | Product Read Service | Basic product read endpoints | LOW |
| P5-008 | Phase 5 Freeze Gate | Audit and freeze | NONE |

---

## 16. Exact Next Task Recommendation

### TOPLINE-P5-002 — Backend Common API Standards + Database Health Status

**Scope:**
- Introduce common response helper/types in `backend/src/common/responses/`
- Refine health endpoint to report `prisma_configured` status
- Optionally test database connection safely (ping query)
- No business CRUD yet
- No tenant/vendor/product endpoints yet
- No auth/payment/commerce

**Rationale:**
- Lowest risk — no business logic
- Validates architecture — tests Prisma access, service layer, response format
- Immediate value — health endpoint reports real DB status
- Foundation — establishes common patterns for future endpoints

---

## 17. Known Limitations

- No auth/RBAC implementation
- No tenant resolution middleware
- No API versioning prefix implemented yet
- No rate limiting implemented
- No request ID tracing
- No centralized exception filter
- No validation pipes
- No DTO decorators (class-validator/class-transformer)
- Health endpoint still reports `database: not_configured`
- PrismaService onModuleInit is empty

---

## 18. Final Readiness Decision

### READY FOR P5-002

**Evidence:**
- Phase 4 frozen — all tasks CLOSED
- Database foundation complete — 7 models, 7 enums, 1 migration
- Backend builds and smoke passes
- Frontend protected (17 routes)
- No prohibited items found
- Service layer architecture documented
- API response standard defined
- Tenant isolation plan defined
- First API domain identified (system metadata + DB health)
- Exact P5-002 scope defined

**The project is ready for P5-002 implementation.**
