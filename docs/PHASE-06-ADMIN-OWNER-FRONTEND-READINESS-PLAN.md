# ToplineShop — Phase 6 Admin & Platform Owner Frontend Readiness Plan

> **Status**: READINESS PLAN  
> **Date**: 2026-09-08  
> **Task**: TOPLINE-P6-001  
> **Phase**: Phase 6 — Admin & Platform Owner Frontend

---

## 1. Purpose

This document defines the scope, goals, data strategy, and verification plan for Phase 6: Admin & Platform Owner Frontend. Phase 6 transforms existing placeholder admin/owner pages into functional frontend dashboards consuming Phase 5 read-only APIs.

---

## 2. Current State

### 2.1 Existing Frontend Pages

| Route | File | Status |
|-------|------|--------|
| `/admin` | `src/app/admin/page.tsx` | Placeholder — mock metrics, 8 nav items (all PLANNED) |
| `/owner` | `src/app/owner/page.tsx` | Placeholder — mock metrics, 6 nav items (mostly PLANNED), outdated dev progress |
| `/vendor` | `src/app/vendor/page.tsx` | Placeholder — not in Phase 6 scope |

### 2.2 Existing Sub-Routes

| Route | Status |
|-------|--------|
| `/admin/vendors` | Does not exist |
| `/admin/users` | Does not exist |
| `/admin/products` | Does not exist |
| `/admin/analytics` | Does not exist |
| `/owner/finance` | Does not exist |
| `/owner/audit` | Does not exist |
| `/owner/approvals` | Does not exist |
| `/owner/platform` | Does not exist |

### 2.3 Available Phase 5 Read-Only APIs

| Endpoint | Method | Data Available |
|----------|--------|----------------|
| `/tenants` | GET | List all tenants |
| `/tenants/:id` | GET | Get tenant by ID |
| `/vendors` | GET | List all vendors |
| `/vendors/:id` | GET | Get vendor by ID |
| `/categories` | GET | List all categories |
| `/categories/:id` | GET | Get category by ID |
| `/products` | GET | List all products (with filters) |
| `/products/:id` | GET | Get product by ID |
| `/health` | GET | DB health status |
| `/version` | GET | API version |

### 2.4 Mock Data Currently Used

- `adminPreviewMetrics`: Total Users (0), Total Vendors (0), Total Products (0), Active Disputes (0)
- `ownerPreviewMetrics`: GMV (₦0.00), Revenue (₦0.00), Active Users (0), Active Vendors (0)
- All values are hardcoded zeros — no real data connection

---

## 3. Phase 6 Goals

### 3.1 Admin Frontend Goals

1. **Admin Dashboard** — Replace hardcoded metrics with real counts from Phase 5 APIs
2. **Vendor Management Page** — List vendors from `/vendors` API, display vendor details
3. **Product Management Page** — List products from `/products` API, display product details
4. **Category Management Page** — List categories from `/categories` API
5. **Tenant Overview Page** — List tenants from `/tenants` API
6. **API Health Monitor** — Display `/health` and `/version` status

### 3.2 Owner Control Center Goals

1. **Owner Dashboard** — Replace hardcoded metrics with real counts from Phase 5 APIs
2. **Vendor Oversight Page** — List vendors with details
3. **Product Oversight Page** — List products with details
4. **Platform Health Page** — Display API health and database status
5. **Phase Status Page** — Display current project phase from registry (already ACTIVE)

### 3.3 Shared Goals

1. **API Client Layer** — Create a shared fetch wrapper for Phase 5 read-only APIs
2. **Type Safety** — Define TypeScript interfaces for API responses
3. **Error Handling** — Graceful handling of API errors (network, 404, 500)
4. **Loading States** — Proper loading indicators during API fetch
5. **Empty States** — Meaningful messages when no data exists

---

## 4. Screens/Routes Proposed for Phase 6

### 4.1 Admin Routes

| Route | Component | Data Source | Priority |
|-------|-----------|-------------|----------|
| `/admin` | AdminDashboard | `/tenants`, `/vendors`, `/products`, `/categories`, `/health` | HIGH |
| `/admin/vendors` | AdminVendorsList | `/vendors` | HIGH |
| `/admin/vendors/[id]` | AdminVendorDetail | `/vendors/:id` | MEDIUM |
| `/admin/products` | AdminProductsList | `/products` | HIGH |
| `/admin/products/[id]` | AdminProductDetail | `/products/:id` | MEDIUM |
| `/admin/categories` | AdminCategoriesList | `/categories` | HIGH |
| `/admin/tenants` | AdminTenantsList | `/tenants` | MEDIUM |
| `/admin/system` | AdminSystemHealth | `/health`, `/version` | LOW |

### 4.2 Owner Routes

| Route | Component | Data Source | Priority |
|-------|-----------|-------------|----------|
| `/owner` | OwnerDashboard | `/tenants`, `/vendors`, `/products`, `/health` | HIGH |
| `/owner/vendors` | OwnerVendorsList | `/vendors` | HIGH |
| `/owner/products` | OwnerProductsList | `/products` | MEDIUM |
| `/owner/platform` | OwnerPlatformHealth | `/health`, `/version` | MEDIUM |

### 4.3 Route Count Impact

- Current frontend routes: 17
- Proposed Phase 6 additions: up to 12 new routes
- Projected total after Phase 6: ~29 routes

---

## 5. Data Source Strategy

### 5.1 API Client Layer

Create `src/lib/api-client.ts` — a shared fetch wrapper for Phase 5 read-only APIs.

**Features:**
- Base URL configuration (default: `http://localhost:3001`)
- JSON response parsing
- Standard error handling
- Type-safe response wrappers

### 5.2 API Response Types

Create `src/types/api.ts` — TypeScript interfaces for Phase 5 API responses.

**Types needed:**
- `TenantSummary` — id, name, slug, type, status, createdAt
- `VendorSummary` — id, tenantId, name, slug, status, createdAt
- `CategorySummary` — id, tenantId, name, slug, parentId, createdAt
- `ProductSummary` — id, tenantId, vendorId, categoryId, name, status, createdAt
- `HealthResponse` — status, database, version
- `ApiListResponse<T>` — ok, data: T[], meta

### 5.3 Data Fetching Pattern

- Use `fetch()` directly (no TanStack Query yet — planned for later phases)
- Client-side fetching with `useEffect` + `useState`
- Loading/error/empty states for all data views
- No server-side data fetching (keep pages client-rendered for now)

### 5.4 API Base URL

- Default: `http://localhost:3001` (NestJS backend port)
- Configurable via environment variable `NEXT_PUBLIC_API_URL`
- Backend must be running for real data to appear

---

## 6. Explicitly Deferred Items

| Item | Status | Reason |
|------|--------|--------|
| Auth/RBAC implementation | DEFERRED | Phase 8+ |
| Payment/settlement execution | DEFERRED | Phase 9+ |
| Write APIs (create/update/delete) | DEFERRED | Phase 7+ |
| Database schema changes | DEFERRED | Phase 4 frozen |
| Migrations | DEFERRED | Phase 4 frozen |
| Production secrets | DEFERRED | Phase 10+ |
| User management actions (suspend/activate) | DEFERRED | Requires write APIs |
| Vendor approval actions | DEFERRED | Requires write APIs |
| Product moderation actions | DEFERRED | Requires write APIs |
| Financial data (GMV, revenue, commissions) | DEFERRED | No payment APIs exist |
| Audit log viewing | DEFERRED | No audit read API exists |
| Real-time updates | DEFERRED | Phase 8+ |
| Search/filter/pagination on list pages | DEFERRED | Phase 7+ (requires API support) |
| TanStack Query integration | DEFERRED | Phase 7+ |
| Zustand state management | DEFERRED | Phase 7+ |

---

## 7. UX Standards for Admin/Owner Pages

### 7.1 Design System Compliance

- Use existing design system components: `AppShell`, `MarketplaceSection`, `MarketplaceGrid`, `MetricCard`, `Badge`, `Card`
- Use existing theme tokens: `--app-canvas`, `--surface-primary`, `--border-default`, `--text-muted`
- Use existing icon library: `lucide-react`
- Follow existing responsive patterns (max-w-7xl, px-4 sm:px-6 lg:px-8)

### 7.2 Page Structure Pattern

```
AppShell dashboard="admin|owner"
  └── min-h-screen (app-canvas bg)
      └── max-w-7xl container
          ├── Page header (title + badge + description)
          ├── Metrics section (MetricCard grid)
          ├── Main content section
          └── Safety banner (placeholder notice)
```

### 7.3 Data Display Pattern

- **Loading**: Skeleton or spinner during API fetch
- **Empty**: "No data available" message with context
- **Error**: Error message with retry option
- **Success**: Data table or card grid

### 7.4 Safety Banners

All admin/owner pages must retain a visible safety banner indicating:
- Data is read-only (no write actions)
- Auth/RBAC not implemented
- Financial data not real (if applicable)

---

## 8. Verification Plan

### 8.1 Build Verification

| Check | Command | Expected |
|-------|---------|----------|
| TypeScript | `npx tsc --noEmit` | PASS |
| Lint | `npm run lint` | PASS (0 errors) |
| Frontend build | `npm run build` | PASS |
| Backend build | `cd backend && npm run build` | PASS (no changes) |

### 8.2 Route Verification

| Check | Method | Expected |
|-------|--------|----------|
| `/admin` renders | Browser | PASS |
| `/admin/vendors` renders | Browser | PASS |
| `/admin/products` renders | Browser | PASS |
| `/owner` renders | Browser | PASS |
| `/owner/vendors` renders | Browser | PASS |
| All new routes show loading → data or empty state | Browser | PASS |

### 8.3 API Integration Verification

| Check | Method | Expected |
|-------|--------|----------|
| API client fetches `/vendors` | Browser network tab | 200 OK |
| API client fetches `/products` | Browser network tab | 200 OK |
| API client handles backend offline | Stop backend, reload | Error state shown |
| API client handles empty data | Empty DB | Empty state shown |

### 8.4 Safety Verification

| Check | Expected |
|-------|----------|
| No auth/RBAC code added | PASS |
| No write API calls | PASS |
| No database changes | PASS |
| No new packages | PASS |
| No secrets committed | PASS |
| Safety banners present on all pages | PASS |

---

## 9. WDR and Closure Requirements

### 9.1 WDR Contents

- Task ID and title
- Objective
- Preflight checks
- Files created/modified
- Route inventory (before/after)
- API integration summary
- Verification results
- Safety confirmations
- Self-assessment
- PM decision required

### 9.2 Closure Criteria

- [ ] All Phase 6 tasks completed
- [ ] All new routes render without errors
- [ ] API client connects to Phase 5 endpoints
- [ ] Loading/error/empty states work
- [ ] Safety banners present
- [ ] TypeScript passes
- [ ] Lint passes
- [ ] Build passes
- [ ] No prohibited items (auth, writes, schema changes, secrets)
- [ ] WDR created with evidence
- [ ] Registry updated

### 9.3 Freeze Gate

Phase 6 will conclude with a freeze gate audit (TOPLINE-P6-008 or similar) verifying:
- All admin/owner frontend routes stable
- All data sourced from Phase 5 read-only APIs
- No write operations
- No auth/RBAC implementation
- Ready for Phase 7 backend wiring

---

## 10. Proposed Task Breakdown

| Task ID | Title | Priority | Dependencies |
|---------|-------|----------|--------------|
| TOPLINE-P6-001 | Phase 6 Readiness Plan (THIS TASK) | HIGH | P5-008 |
| TOPLINE-P6-002 | API Client Layer + Response Types | HIGH | P6-001 |
| TOPLINE-P6-003 | Admin Dashboard + Vendor List Page | HIGH | P6-002 |
| TOPLINE-P6-004 | Admin Product + Category List Pages | HIGH | P6-002 |
| TOPLINE-P6-005 | Owner Dashboard + Vendor Oversight Page | HIGH | P6-002 |
| TOPLINE-P6-006 | Owner Product + Platform Health Pages | MEDIUM | P6-002 |
| TOPLINE-P6-007 | Admin/Owner Detail Pages | MEDIUM | P6-003, P6-004 |
| TOPLINE-P6-008 | Phase 6 Freeze Gate | HIGH | P6-003 through P6-007 |

**Note**: Task breakdown is a recommendation. PM to approve final task sequence.

---

## 11. Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| Backend not running during dev | LOW | API client shows error state gracefully |
| Empty database | LOW | Empty state UI with context message |
| API response shape mismatch | LOW | TypeScript types + error handling |
| Scope creep into write operations | MEDIUM | Explicit deferred items list, safety banners |
| Auth/RBAC pressure | LOW | Clear deferral to Phase 8 |

---

## 12. Summary

Phase 6 transforms admin and owner placeholder pages into functional read-only dashboards consuming Phase 5 APIs. No write operations, no auth, no schema changes. The API client layer and TypeScript types establish the foundation for future API integration in Phase 7+.

**Recommended next task**: TOPLINE-P6-002 (API Client Layer + Response Types)
