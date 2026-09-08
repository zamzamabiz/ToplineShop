# ToplineShop — Phase 7 Backend/API Foundation Readiness Plan

> **Status**: READINESS PLAN  
> **Date**: 2026-09-08  
> **Task**: TOPLINE-P7-001  
> **Phase**: Phase 7 — Backend/API Foundation

---

## 1. Purpose

This document defines the readiness plan for Phase 7 — Backend/API Foundation. Phase 7 extends the existing NestJS backend scaffold with new service modules, write APIs, validation, error handling, observability, and testing foundations. This is a planning artifact only.

---

## 2. Current Frozen Baseline

| Item | Status |
|------|--------|
| Phase 1-6 | PASS / CLOSED |
| Frontend routes | 27 (13 admin/owner from Phase 6 + 14 public/customer/vendor) |
| Backend scaffold | NestJS 11 + Prisma 6.19.3 + PostgreSQL 17.6 |
| Database models | 7 (Tenant, User, Membership, Vendor, Category, Product, AuditLog) |
| Database enums | 7 |
| Migration | `20260907172636_init_core_schema` |
| Phase 5 read-only endpoints | 11 (GET /, /health, /version, /tenants, /tenants/:id, /vendors, /vendors/:id, /categories, /categories/:id, /products, /products/:id) |
| Auth/RBAC | Not implemented |
| Payment/commerce | Not implemented |
| Write APIs | None |
| Frontend API client | `src/lib/api-client.ts` — 11 read-only GET methods |
| Frontend types | `src/types/api.ts` — 17 types |

---

## 3. Phase 7 Objective

Extend the backend with safe write operations, validation, error handling, observability, and testing foundations. Phase 7 must:

1. Add write API endpoints for core entities (create, update, delete)
2. Implement proper request validation with DTOs
3. Implement consistent error handling and response formatting
4. Add structured logging and observability hooks
5. Establish testing patterns (unit, integration, e2e)
6. Prepare the foundation for Phase 8 auth/RBAC integration

---

## 4. In-Scope Work

### 4.1 Write API Endpoints
- POST /tenants — create tenant
- PATCH /tenants/:id — update tenant
- DELETE /tenants/:id — soft delete tenant
- POST /vendors — create vendor
- PATCH /vendors/:id — update vendor
- POST /categories — create category
- PATCH /categories/:id — update category
- POST /products — create product
- PATCH /products/:id — update product
- DELETE /products/:id — soft delete product

### 4.2 Validation Layer
- Request DTO validation with class-validator
- Input sanitization
- Type-safe request/response contracts

### 4.3 Error Handling
- Global exception filter
- Consistent error response format
- HTTP status code mapping
- Validation error formatting

### 4.4 Observability
- Structured logging with context
- Request/response logging middleware
- Error tracking hooks
- Performance timing

### 4.5 Testing Foundation
- Unit test setup (Jest)
- Integration test patterns
- E2E test scaffolding
- Test database isolation

---

## 5. Out-of-Scope Work

| Item | Deferred To | Reason |
|------|-------------|--------|
| Auth/RBAC implementation | Phase 8 | Requires dedicated security phase |
| JWT/session management | Phase 8 | Auth foundation |
| Payment/settlement APIs | Phase 9+ | Requires business decisions |
| Order/commerce logic | Phase 9+ | Requires payment foundation |
| Real-time/WebSocket | Phase 8+ | Requires infrastructure |
| Multi-currency | Phase 9+ | Business rules needed |
| Seed data | Phase 7+ (optional) | Not required for foundation |
| Production deployment | Phase 10 | Requires full feature set |

---

## 6. Backend Architecture

### 6.1 Module Structure (Existing)

```
backend/src/
├── app.module.ts
├── app.controller.ts
├── app.service.ts
├── main.ts
├── common/
│   └── api-response.ts
├── prisma/
│   ├── prisma.module.ts
│   └── prisma.service.ts
├── tenants/
│   ├── dto/
│   │   └── tenant-summary.dto.ts
│   ├── tenants.module.ts
│   ├── tenants.controller.ts
│   └── tenants.service.ts
├── vendors/ (same structure)
├── categories/ (same structure)
├── products/ (same structure)
└── audit/
    ├── types/
    │   └── audit-event.type.ts
    ├── audit.module.ts
    └── audit.service.ts
```

### 6.2 New Modules for Phase 7

```
backend/src/
├── common/
│   ├── api-response.ts (existing)
│   ├── filters/
│   │   └── all-exceptions.filter.ts (NEW)
│   ├── interceptors/
│   │   └── logging.interceptor.ts (NEW)
│   └── pipes/
│       └── validation.pipe.ts (NEW)
├── health/ (NEW module)
│   ├── health.module.ts
│   ├── health.controller.ts
│   └── health.service.ts
└── testing/ (NEW - test utilities)
    ├── test.module.ts
    └── test.utils.ts
```

---

## 7. API/Service Contracts

### 7.1 Write Endpoint Pattern

```typescript
// POST /tenants
interface CreateTenantRequest {
  name: string;
  slug: string;
  type: 'PLATFORM' | 'VENDOR';
}

interface CreateTenantResponse {
  ok: true;
  data: TenantSummary;
  meta: { phase: string };
}
```

### 7.2 Validation Rules

| Field | Rules |
|-------|-------|
| name | Required, 1-255 chars, trimmed |
| slug | Required, 1-255 chars, lowercase, alphanumeric + hyphens, unique |
| type | Required, enum value |
| status | Optional, enum value, defaults to initial state |

### 7.3 Error Response Format

```typescript
interface ApiErrorResponse {
  ok: false;
  error: {
    code: string;    // e.g., "VALIDATION_ERROR", "NOT_FOUND"
    message: string; // Human-readable
    details?: Array<{
      field: string;
      message: string;
    }>;
  };
}
```

---

## 8. Frontend Integration Boundary

### 8.1 Current Frontend API Client

The frontend uses `src/lib/api-client.ts` with 11 read-only GET methods. Phase 7 will:

1. Add write methods to the API client (POST, PATCH, DELETE)
2. Update `src/types/api.ts` with request/response types
3. Preserve backward compatibility with existing read methods

### 8.2 New Frontend API Methods (Phase 7)

```typescript
// Additions to src/lib/api-client.ts
createTenant(data: CreateTenantRequest): Promise<ApiResponse<TenantSummary>>
updateTenant(id: string, data: UpdateTenantRequest): Promise<ApiResponse<TenantSummary>>
deleteTenant(id: string): Promise<ApiResponse<void>>
// Similar for vendors, categories, products
```

---

## 9. Validation, Error Handling, Observability

### 9.1 Validation Strategy

- Use `class-validator` for DTO validation
- Global `ValidationPipe` with `whitelist: true`, `forbidNonWhitelisted: true`
- Transform plain objects to DTO instances

### 9.2 Error Handling Strategy

- Global `AllExceptionsFilter` catching all errors
- Map known errors to appropriate HTTP status codes
- Log unexpected errors with stack traces
- Return safe error messages (no stack traces in production)

### 9.3 Observability Strategy

- `LoggingInterceptor` for request/response logging
- Include: method, path, status, duration, request ID
- Structured JSON logging for production
- Console logging for development

---

## 10. Security Gates

| Gate | Status | Notes |
|------|--------|-------|
| Auth/RBAC | DEFERRED | Phase 8 |
| Input validation | IN SCOPE | class-validator DTOs |
| SQL injection prevention | IN SCOPE | Prisma parameterized queries |
| Rate limiting | DEFERRED | Phase 8+ |
| CORS | IN SCOPE | Configure allowed origins |
| Secrets handling | IN SCOPE | .env files, no hardcoded secrets |
| Payment security | DEFERRED | Phase 9+ |

---

## 11. Task Sequence

| Task | Title | Priority | Dependencies |
|------|-------|----------|--------------|
| P7-001 | Phase 7 Readiness Plan (THIS TASK) | HIGH | P6-008 |
| P7-002 | Error Handling + Validation Foundation | HIGH | P7-001 |
| P7-003 | Observability + Logging Foundation | HIGH | P7-002 |
| P7-004 | Tenant Write API | HIGH | P7-002 |
| P7-005 | Vendor Write API | HIGH | P7-004 |
| P7-006 | Category Write API | MEDIUM | P7-004 |
| P7-007 | Product Write API | MEDIUM | P7-005, P7-006 |
| P7-008 | Testing Foundation | MEDIUM | P7-003 |
| P7-009 | Frontend API Client Write Methods | MEDIUM | P7-004 through P7-007 |
| P7-010 | Phase 7 Freeze Gate | HIGH | All P7 tasks |

---

## 12. Dependencies and Acceptance Evidence

### 12.1 Task Dependencies

```
P7-001 (Plan)
  └── P7-002 (Error/Validation)
        ├── P7-003 (Observability)
        │     └── P7-008 (Testing)
        ├── P7-004 (Tenant Write)
        │     ├── P7-005 (Vendor Write)
        │     │     └── P7-007 (Product Write)
        │     └── P7-006 (Category Write)
        │           └── P7-007 (Product Write)
        └── P7-009 (Frontend API Client)
              └── P7-010 (Freeze Gate)
```

### 12.2 Acceptance Evidence

Each task requires:
- TypeScript compilation pass
- Lint pass
- Build pass
- Unit tests pass (where applicable)
- WDR with commit hash
- PM approval

---

## 13. WDR Requirements

Each Phase 7 task WDR must include:
1. Task ID/title/status/date/phase
2. Objective
3. Preflight results
4. Files created/modified
5. API endpoints added/modified
6. Validation rules applied
7. Error handling behavior
8. Test results (where applicable)
9. Verification results
10. Safety confirmations
11. Git evidence with commit hash
12. Self-assessment
13. PM decision required

---

## 14. Summary

Phase 7 extends the backend with write operations, validation, error handling, observability, and testing. The foundation prepares for Phase 8 auth/RBAC integration. All work builds on the existing Phase 5 read-only scaffold without breaking changes.

**Recommended first implementation task**: TOPLINE-P7-002 (Error Handling + Validation Foundation)
