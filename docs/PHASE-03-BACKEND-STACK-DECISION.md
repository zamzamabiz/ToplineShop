# ToplineShop — Backend Stack Decision + Project Structure Plan

> **Status**: DECISION DOCUMENT — NO IMPLEMENTATION  
> **Date**: 2026-09-07  
> **Author**: Implementation Agent under PM governance  
> **Approval Required**: PM/Owner before any backend code is written

---

## 1. Current Frontend Frozen Status

| Item | Status |
|------|--------|
| Phase 0-2 | PASS / CLOSED |
| Frontend routes | 17 (all building) |
| Mock data | Centralized |
| Commerce placeholders | All safe |
| Backend | Does not exist |
| No packages installed beyond frontend needs | Confirmed |

---

## 2. Backend Stack Comparison

### Option A — Next.js Full-Stack Only

| Aspect | Assessment |
|--------|------------|
| Pros | Single codebase, shared types, simpler deployment, lowest ops cost |
| Cons | Couples frontend/backend, harder to scale independently, vendor lock-in to Next.js runtime |
| Scaling risk | Low for MVP, high for complex multi-vendor |
| Team/AI complexity | Low |
| Multi-vendor SaaS | Weak — no independent rate limiting, multi-tenancy hard |
| B2B wholesale | Weak — bulk operations need independent scaling |
| Payment/commission safety | Medium — audit logs mix with frontend code |
| Future AI features | Weak — AI needs independent compute/resources |

### Option B — Separate Express/Fastify Backend

| Aspect | Assessment |
|--------|------------|
| Pros | Clean separation, lightweight, fast to start |
| Cons | Less opinionated, more boilerplate for enterprise patterns, weaker DI |
| Scaling risk | Medium — manual architecture decisions |
| Team/AI complexity | Medium |
| Multi-vendor SaaS | Medium — needs manual structuring |
| B2B wholesale | Medium |
| Payment/commission safety | Medium — no built-in guardrails |
| Future AI features | Medium |

### Option C — Hybrid: Next.js Frontend + NestJS Backend (RECOMMENDED)

| Aspect | Assessment |
|--------|------------|
| Pros | Frontend stays proven Next.js, backend is enterprise-grade NestJS, clean API contract, DI built-in, modular by design |
| Cons | Two services to deploy, API versioning needed, slightly more infrastructure |
| Scaling risk | Low — independent scaling, clear boundaries |
| Team/AI complexity | Medium — but NestJS patterns are well-documented |
| Multi-vendor SaaS | Strong — modules map to domains, guards for RBAC |
| B2B wholesale | Strong — independent service for bulk operations |
| Payment/commission safety | Strong — isolated service, audit logs, owner-only guards |
| Future AI features | Strong — AI service can be separate NestJS module or microservice |

### DECISION: Option C — Hybrid

**Rationale:**
1. ToplineShop is B2C + B2B + multi-vendor SaaS — needs clean separation
2. Payment/commission/settlement requires isolated, auditable backend
3. Future AI features need independent compute
4. NestJS provides enterprise patterns (DI, guards, interceptors, modules) out of the box
5. Standard architecture for marketplace platforms (Jumia, Konga, Shopify pattern)

---

## 3. Project Structure Plan

### Current State

```
ToplineShop/           ← Next.js at root (frontend)
  src/
    app/               ← 15 page routes
    components/        ← marketplace, ui, layout
    data/              ← mock data
    types/             ← TypeScript types
    project/           ← registry
  docs/
  WDR/
  package.json         ← frontend only
```

### Recommended Non-Disruptive Path: Option 1 (Add `backend/` Later)

```
ToplineShop/           ← keep as-is (frontend)
  src/                 ← existing frontend (unchanged)
  backend/             ← FUTURE: NestJS backend (separate)
    src/
      modules/         ← domain modules
      common/          ← shared utilities
      config/          ← env config
    prisma/            ← schema, migrations, seeds
    package.json       ← backend-only dependencies
    tsconfig.json      ← backend TypeScript config
    nest-cli.json      ← NestJS config
  docs/
  WDR/
```

**Why Option 1:**
- Zero risk to existing frontend
- No file moves required
- Backend can be developed independently
- Frontend team continues without disruption
- Can be migrated to monorepo later if needed

### Future Monorepo Migration (Option 2 — Deferred)

```
ToplineShop/
  apps/
    web/               ← current Next.js frontend
    api/               ← NestJS backend
  packages/
    shared/            ← shared types, DTOs, contracts
  docs/
  WDR/
```

**When:** Only after backend is proven and team grows. Not now.

---

## 4. Package / Tooling Plan

### Backend Packages (Future — NOT installed now)

| Package | Purpose | Install In |
|---------|---------|-----------|
| `@nestjs/core` | NestJS framework | P3-007 |
| `@nestjs/common` | NestJS utilities | P3-007 |
| `@nestjs/platform-express` | HTTP adapter | P3-007 |
| `@prisma/client` | Prisma ORM client | P3-007 |
| `prisma` | Prisma CLI (dev) | P3-007 |
| `class-validator` | DTO validation | P3-007 |
| `class-transformer` | DTO transformation | P3-007 |
| `@nestjs/swagger` | API documentation | P3-007 |
| `@nestjs/config` | Env configuration | P3-007 |
| `bcrypt` / `argon2` | Password hashing | P3-007 |
| `@nestjs/jwt` | JWT auth | P3-007 |
| `@nestjs/passport` | Auth strategies | P3-007 |
| `jest` / `vitest` | Testing | P3-007 |

### Dev Tooling (Future)

| Tool | Purpose | Install In |
|------|---------|-----------|
| `docker-compose` | Local PostgreSQL | P3-006 |
| `@types/bcrypt` | Type definitions | P3-007 |
| Backend lint config | ESLint for backend | P3-007 |
| Backend test config | Jest/Vitest config | P3-007 |

---

## 5. Environment Plan

### Future Environment Files (NOT created now)

| File | Purpose | Created In |
|------|---------|-----------|
| `backend/.env.example` | Template for backend env | P3-006 |
| `backend/.env.local` | Local development env | P3-006 |
| `.env.example` | Root-level template | P3-006 |

### Required Environment Variables (Future)

| Variable | Purpose | Phase |
|----------|---------|-------|
| `DATABASE_URL` | PostgreSQL connection | P3-006 |
| `JWT_SECRET` | Auth token signing | P3-007 |
| `JWT_EXPIRY` | Token expiry config | P3-007 |
| `NODE_ENV` | Environment mode | P3-006 |
| `BACKEND_PORT` | Backend service port | P3-006 |
| `FRONTEND_URL` | CORS origin | P3-007 |
| Payment provider keys | Paystack/Flutterwave | Phase 9+ |
| AI service keys | OpenAI/etc | Phase 10+ |

### Safety Rules
- No real secrets committed to repo
- `.env.local` in `.gitignore`
- Owner approval before payment keys
- Separate dev/staging/prod configs

---

## 6. Frontend / Backend Boundary

### Frontend (Next.js) — What It Owns

| Responsibility | Current | Future |
|---------------|---------|--------|
| UI rendering | ✅ All pages | Same |
| Client navigation | ✅ All routes | Same |
| Placeholder/mock data | ✅ `marketplaceMockData.ts` | Removed when APIs wired |
| API client | None | `fetch` wrapper to backend |
| State management | None (mock) | React Query / SWR |

### Backend (NestJS) — What It Will Own

| Responsibility | Phase |
|---------------|-------|
| Business rules | P3-007+ |
| Auth/session verification | P3-007+ |
| RBAC enforcement | P3-007+ |
| Vendor/product/category CRUD | P3-007+ |
| Cart/order orchestration | Phase 4+ |
| Payment processing | Phase 9+ |
| Commission/settlement | Phase 9+ |
| Audit logging | P3-007+ |
| Admin/owner metrics | P3-007+ |
| AI governance logs | Phase 10+ |

### Shared (Future)

| Artifact | Purpose | Created In |
|----------|---------|-----------|
| API contracts | Request/response types | P3-004 |
| DTO schemas | Validation rules | P3-005 |
| Shared enums | Status codes, roles | P3-004 |

---

## 7. Implementation Gate Plan

| Gate | Description | Required Before |
|------|-------------|----------------|
| **A** | Backend stack decision approved | P3-003 |
| **B** | Database schema design approved | P3-007 |
| **C** | API contract design approved | P3-007 |
| **D** | Auth/RBAC design approved | P3-007 |
| **E** | Environment safety approved | P3-007 |
| **F** | Backend bootstrap allowed | P3-007 |

**TOPLINE-P3-002 does not authorize backend coding.** Only documentation.

---

## 8. Updated Phase 3 Task Sequence

| Task | Title | Type | Gate |
|------|-------|------|------|
| TOPLINE-P3-001 | Backend Readiness Architecture Plan | Planning | — |
| **TOPLINE-P3-002** | **Backend Stack Decision + Project Structure** | **Planning** | **A** |
| TOPLINE-P3-003 | Database Schema Design Document | Planning | B |
| TOPLINE-P3-004 | API Contract Design Document | Planning | C |
| TOPLINE-P3-005 | Auth/RBAC Design Document | Planning | D |
| TOPLINE-P3-006 | Environment + Secrets Safety Plan | Planning | E |
| TOPLINE-P3-007 | Backend Bootstrap Implementation | Implementation | F |
| TOPLINE-P3-008 | Health Check API + Backend Smoke Test | Implementation | — |
| TOPLINE-P3-009 | Phase 3 Backend Foundation Freeze Gate | Audit | — |

---

## 9. Explicit "No Backend Implementation Yet" Note

**This document is a decision and planning artifact only.**

- No backend code has been written
- No packages have been installed
- No database schema has been created
- No migrations have been run
- No API endpoints exist
- No auth has been implemented
- The frontend remains unchanged

**All backend implementation requires PM approval via the governed task sequence above.**

---

## 10. Owner/PM Approval Requirements

| Gate | Approval Required |
|------|-------------------|
| Stack Decision (this doc) | PM + Owner |
| Database Schema | PM |
| API Contracts | PM |
| Auth/RBAC Design | PM + Owner |
| Environment Safety | PM |
| Backend Bootstrap | PM |
| Phase 3 Freeze | PM + Owner |
