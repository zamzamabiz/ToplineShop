# ToplineShop — API Contract Design Document

> **Status**: DESIGN DOCUMENT — NO API/BACKEND IMPLEMENTATION CREATED  
> **Date**: 2026-09-07  
> **Author**: Implementation Agent under PM governance  
> **Approval Required**: PM before any API routes or backend code is written

---

## 1. Purpose

This document defines the future API contract design for ToplineShop — a multi-vendor SaaS marketplace. It specifies route patterns, request/response formats, validation rules, auth requirements, error handling, and safety boundaries.

**This is a design artifact only.** No API files, controllers, or backend code have been created.

---

## 2. Current State

| Item | Status |
|------|--------|
| API endpoints | Do not exist |
| Backend | Does not exist |
| Auth | Not implemented |
| Database | Not created |
| Frontend | Frozen (17 routes, mock data) |

---

## 3. API Design Principles

1. **REST API first** — resource-oriented URLs
2. **Versioned prefix**: `/api/v1/*`
3. **JSON only** — request and response bodies
4. **Consistent response envelope** — all responses wrapped in `{ data, meta, error }`
5. **Auth required by route class** — public, customer, vendor, admin, owner
6. **RBAC enforced server-side** — never trust client-side role checks
7. **Vendor isolation** — vendor users can only access own data
8. **Audit logging** — all sensitive actions logged
9. **Idempotency** — payment/order operations require idempotency keys
10. **No fake revenue** — financial APIs return real data only
11. **No payment endpoints** until Phase 9+
12. **Rate limiting** — per-role, per-vendor, per-IP

---

## 4. Global Contract Standards

### Success Response Envelope

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

### Error Response Envelope

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable error",
    "details": [
      { "field": "email", "message": "Invalid email format" }
    ]
  },
  "requestId": "req_abc123"
}
```

### Pagination Standard

```
GET /api/v1/products?page=1&limit=20&sort=-createdAt&category=electronics
```

| Parameter | Type | Default | Notes |
|-----------|------|---------|-------|
| page | integer | 1 | 1-indexed |
| limit | integer | 20 | Max 100 |
| sort | string | -createdAt | Prefix `-` for descending |
| search | string | — | Full-text search where supported |
| category | string | — | Filter by category slug/id |
| status | string | — | Filter by status |

### Date/Time Format

- ISO 8601: `2026-09-07T14:30:00Z`
- All timestamps in UTC

### Money Format

```json
{
  "amount": 4999900,
  "currency": "NGN",
  "display": "₦49,999.00"
}
```

- `amount`: integer minor units (kobo) or Decimal(19,4)
- `currency`: ISO 4217 code
- `display`: formatted string for UI

### Auth Header

```
Authorization: Bearer <jwt_token>
```

### Rate Limit Response

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMITED",
    "message": "Too many requests",
    "retryAfter": 60
  }
}
```

### Request ID Header

```
X-Request-ID: req_abc123
```

---

## 5. API Group Design

### A. Health/System

| Route | Method | Auth | Purpose |
|-------|--------|------|---------|
| `/api/v1/health` | GET | None | Health check |
| `/api/v1/version` | GET | None | Version info |

**Response:**
```json
{ "status": "ok", "version": "0.1.0", "uptime": 12345 }
```

---

### B. Auth/Session

| Route | Method | Auth | RBAC | Purpose |
|-------|--------|------|------|---------|
| `POST /api/v1/auth/register` | POST | None | — | Register new user |
| `POST /api/v1/auth/login` | POST | None | — | Login, return JWT |
| `POST /api/v1/auth/logout` | POST | Any | — | Invalidate session |
| `GET /api/v1/auth/me` | GET | Customer | — | Current user profile |
| `POST /api/v1/auth/refresh` | POST | Any | — | Refresh JWT |

**Login Request:**
```json
{ "email": "user@example.com", "password": "secret" }
```

**Login Response:**
```json
{
  "data": {
    "user": { "id": "uuid", "email": "...", "name": "...", "roles": ["CUSTOMER"] },
    "accessToken": "jwt...",
    "refreshToken": "jwt...",
    "expiresIn": 3600
  }
}
```

---

### C. Users/Profile

| Route | Method | Auth | RBAC | Purpose |
|-------|--------|------|------|---------|
| `GET /api/v1/users/me` | GET | Customer | — | Get own profile |
| `PATCH /api/v1/users/me` | PATCH | Customer | — | Update own profile |
| `GET /api/v1/users/me/addresses` | GET | Customer | — | List own addresses |
| `POST /api/v1/users/me/addresses` | POST | Customer | — | Add address |
| `PATCH /api/v1/users/me/addresses/:id` | PATCH | Customer | — | Update address |
| `DELETE /api/v1/users/me/addresses/:id` | DELETE | Customer | — | Delete address |
| `GET /api/v1/admin/users` | GET | Admin | PLATFORM_ADMIN | List all users |
| `GET /api/v1/admin/users/:id` | GET | Admin | PLATFORM_ADMIN | Get user detail |
| `PATCH /api/v1/admin/users/:id/status` | PATCH | Admin | PLATFORM_ADMIN | Suspend/activate user |

---

### D. Categories

| Route | Method | Auth | RBAC | Purpose |
|-------|--------|------|------|---------|
| `GET /api/v1/categories` | GET | None | — | List categories (tree) |
| `GET /api/v1/categories/:slug` | GET | None | — | Get category with products |
| `POST /api/v1/admin/categories` | POST | Admin | PLATFORM_ADMIN | Create category |
| `PATCH /api/v1/admin/categories/:id` | PATCH | Admin | PLATFORM_ADMIN | Update category |
| `DELETE /api/v1/admin/categories/:id` | DELETE | Admin | PLATFORM_ADMIN | Delete category |

---

### E. Products

| Route | Method | Auth | RBAC | Purpose |
|-------|--------|------|------|---------|
| `GET /api/v1/products` | GET | None | — | List products (paginated) |
| `GET /api/v1/products/:id` | GET | None | — | Get product detail |
| `GET /api/v1/products/search` | GET | None | — | Search products |
| `POST /api/v1/vendor/products` | POST | Vendor | VENDOR_USER | Create product |
| `PATCH /api/v1/vendor/products/:id` | PATCH | Vendor | VENDOR_USER | Update own product |
| `DELETE /api/v1/vendor/products/:id` | DELETE | Vendor | VENDOR_ADMIN | Archive own product |
| `GET /api/v1/vendor/products` | GET | Vendor | VENDOR_USER | List vendor's products |
| `PATCH /api/v1/admin/products/:id/status` | PATCH | Admin | PLATFORM_ADMIN | Moderate product |

**Product List Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Wireless Headphones",
      "slug": "wireless-headphones",
      "price": { "amount": 4999900, "currency": "NGN", "display": "₦49,999.00" },
      "rating": 4.5,
      "reviewCount": 128,
      "vendor": { "id": "uuid", "name": "TechStore", "slug": "techstore" },
      "category": { "id": "uuid", "name": "Electronics", "slug": "electronics" },
      "inStock": true,
      "images": [{ "url": "...", "alt": "..." }]
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 150 }
}
```

---

### F. Vendors/Public Storefront

| Route | Method | Auth | RBAC | Purpose |
|-------|--------|------|------|---------|
| `GET /api/v1/vendors` | GET | None | — | List verified vendors |
| `GET /api/v1/vendors/:slug` | GET | None | — | Get vendor storefront |
| `GET /api/v1/vendors/:slug/products` | GET | None | — | List vendor's public products |

---

### G. Vendor Dashboard

| Route | Method | Auth | RBAC | Purpose |
|-------|--------|------|------|---------|
| `GET /api/v1/vendor/dashboard` | GET | Vendor | VENDOR_USER | Dashboard metrics |
| `GET /api/v1/vendor/products` | GET | Vendor | VENDOR_USER | List own products |
| `POST /api/v1/vendor/products` | POST | Vendor | VENDOR_USER | Create product |
| `PATCH /api/v1/vendor/products/:id` | PATCH | Vendor | VENDOR_USER | Update product |
| `GET /api/v1/vendor/orders` | GET | Vendor | VENDOR_USER | List vendor's order items |
| `GET /api/v1/vendor/profile` | GET | Vendor | VENDOR_USER | Get own vendor profile |
| `PATCH /api/v1/vendor/profile` | PATCH | Vendor | VENDOR_ADMIN | Update vendor profile |

**Vendor isolation:** All vendor routes filtered by `vendorId` from JWT.

---

### H. Cart

| Route | Method | Auth | RBAC | Purpose |
|-------|--------|------|------|---------|
| `GET /api/v1/cart` | GET | Customer | — | Get current cart |
| `POST /api/v1/cart/items` | POST | Customer | — | Add item to cart |
| `PATCH /api/v1/cart/items/:id` | PATCH | Customer | — | Update item quantity |
| `DELETE /api/v1/cart/items/:id` | DELETE | Customer | — | Remove item |

**Add to Cart Request:**
```json
{
  "productId": "uuid",
  "variantId": "uuid",
  "quantity": 2
}
```

**Cart Response:**
```json
{
  "data": {
    "id": "uuid",
    "items": [
      {
        "id": "uuid",
        "product": { "id": "uuid", "name": "...", "price": { "amount": 4999900, "currency": "NGN" } },
        "quantity": 2,
        "lineTotal": { "amount": 9999800, "currency": "NGN" }
      }
    ],
    "subtotal": { "amount": 9999800, "currency": "NGN" },
    "itemCount": 2
  }
}
```

**Note:** Cart implementation deferred until auth/session decision is finalized.

---

### I. Orders

| Route | Method | Auth | RBAC | Purpose |
|-------|--------|------|------|---------|
| `GET /api/v1/orders` | GET | Customer | — | List own orders |
| `GET /api/v1/orders/:id` | GET | Customer | — | Get order detail |
| `POST /api/v1/orders` | POST | Customer | — | Create order from cart |
| `GET /api/v1/vendor/orders` | GET | Vendor | VENDOR_USER | List vendor's order items |
| `PATCH /api/v1/admin/orders/:id/status` | PATCH | Admin | PLATFORM_ADMIN | Update order status |

**Note:** Order creation deferred until cart/auth/payment foundations are real.

---

### J. B2B / Wholesale / RFQ

| Route | Method | Auth | RBAC | Purpose |
|-------|--------|------|------|---------|
| `GET /api/v1/b2b/categories` | GET | None | — | List B2B supplier categories |
| `POST /api/v1/b2b/rfqs` | POST | Wholesale | WHOLESALE_BUYER | Create RFQ |
| `GET /api/v1/b2b/rfqs` | GET | Wholesale | WHOLESALE_BUYER | List own RFQs |
| `GET /api/v1/b2b/rfqs/:id` | GET | Wholesale | WHOLESALE_BUYER | Get RFQ detail |
| `POST /api/v1/b2b/rfqs/:id/quotes` | POST | Vendor | VENDOR_USER | Submit quote for RFQ |
| `PATCH /api/v1/b2b/rfqs/:id/accept` | PATCH | Wholesale | WHOLESALE_BUYER | Accept quote |
| `GET /api/v1/vendor/rfqs` | GET | Vendor | VENDOR_USER | List received RFQs |

**Note:** RFQ quote acceptance deferred until cart/order/payment are real.

---

### K. Admin

| Route | Method | Auth | RBAC | Purpose |
|-------|--------|------|------|---------|
| `GET /api/v1/admin/dashboard` | GET | Admin | PLATFORM_ADMIN | Platform metrics |
| `GET /api/v1/admin/vendors` | GET | Admin | PLATFORM_ADMIN | List all vendors |
| `GET /api/v1/admin/vendors/:id` | GET | Admin | PLATFORM_ADMIN | Get vendor detail |
| `PATCH /api/v1/admin/vendors/:id/status` | PATCH | Admin | PLATFORM_ADMIN | Approve/suspend vendor |
| `GET /api/v1/admin/users` | GET | Admin | PLATFORM_ADMIN | List all users |
| `PATCH /api/v1/admin/users/:id/status` | PATCH | Admin | PLATFORM_ADMIN | Suspend/activate user |
| `GET /api/v1/admin/products` | GET | Admin | PLATFORM_ADMIN | List all products |
| `PATCH /api/v1/admin/products/:id/status` | PATCH | Admin | PLATFORM_ADMIN | Moderate product |
| `GET /api/v1/admin/audit-logs` | GET | Admin | PLATFORM_ADMIN | View audit logs |
| `GET /api/v1/admin/risk-flags` | GET | Admin | PLATFORM_ADMIN | View risk flags |
| `PATCH /api/v1/admin/risk-flags/:id` | PATCH | Admin | PLATFORM_ADMIN | Resolve risk flag |

**Note:** Admin actions logged in AdminActionLog.

---

### L. Owner Control Center

| Route | Method | Auth | RBAC | Purpose |
|-------|--------|------|------|---------|
| `GET /api/v1/owner/metrics` | GET | Owner | OWNER | Executive metrics |
| `GET /api/v1/owner/revenue-summary` | GET | Owner | OWNER | Revenue/commission summary |
| `GET /api/v1/owner/settlements` | GET | Owner | OWNER | List settlements |
| `POST /api/v1/owner/settlements/:id/approve` | POST | Owner | OWNER | Approve settlement |
| `GET /api/v1/owner/risk-flags` | GET | Owner | OWNER | View all risk flags |
| `POST /api/v1/owner/approvals/:id/decision` | POST | Owner | OWNER | Approve/reject pending action |
| `GET /api/v1/owner/platform-settings` | GET | Owner | OWNER | View platform settings |
| `PATCH /api/v1/owner/platform-settings` | PATCH | Owner | OWNER | Update platform settings |

**Note:** Owner-only. Financial APIs return real data only — no fake metrics.

---

### M. Payments/Financial Safety (FUTURE LOCKED)

| Route | Method | Auth | RBAC | Status |
|-------|--------|------|------|--------|
| `POST /api/v1/payments/intent` | POST | Customer | — | FUTURE LOCKED |
| `POST /api/v1/payments/confirm` | POST | Customer | — | FUTURE LOCKED |
| `POST /api/v1/refunds` | POST | Owner | OWNER | FUTURE LOCKED |
| `GET /api/v1/settlements` | GET | Owner | OWNER | FUTURE LOCKED |
| `POST /api/v1/settlements/:id/approve` | POST | Owner | OWNER | FUTURE LOCKED |
| `GET /api/v1/ledger` | GET | Owner | OWNER | FUTURE LOCKED |

**All payment/settlement/ledger APIs are FUTURE LOCKED — not implemented until Phase 9+.**

---

### N. Notifications/Support

| Route | Method | Auth | RBAC | Purpose |
|-------|--------|------|------|---------|
| `GET /api/v1/notifications` | GET | Any | — | List own notifications |
| `PATCH /api/v1/notifications/:id/read` | PATCH | Any | — | Mark as read |
| `POST /api/v1/notifications/read-all` | POST | Any | — | Mark all as read |
| `GET /api/v1/support/tickets` | GET | Customer | — | List own tickets |
| `POST /api/v1/support/tickets` | POST | Customer | — | Create support ticket |
| `GET /api/v1/support/tickets/:id` | GET | Customer | — | Get ticket detail |
| `POST /api/v1/support/tickets/:id/messages` | POST | Customer | — | Add message to ticket |
| `GET /api/v1/admin/support/tickets` | GET | Admin | PLATFORM_ADMIN | List all tickets |
| `PATCH /api/v1/admin/support/tickets/:id` | PATCH | Admin | PLATFORM_ADMIN | Assign/update ticket |

---

### O. Future AI Governance

| Route | Method | Auth | RBAC | Status |
|-------|--------|------|------|--------|
| `GET /api/v1/ai/recommendations` | GET | Any | — | FUTURE |
| `POST /api/v1/ai/chat` | POST | Any | — | FUTURE |
| `POST /api/v1/ai/proposals` | POST | AI_SYSTEM | — | FUTURE |
| `POST /api/v1/ai/proposals/:id/approve` | POST | Owner | OWNER | FUTURE |
| `GET /api/v1/ai/audit-log` | GET | Admin | PLATFORM_ADMIN | FUTURE |

**AI action execution requires AiApprovalGate — AI cannot directly execute financial/destructive actions.**

---

## 6. Security + RBAC Route Classes

| Class | Auth | RBAC | Examples |
|-------|------|------|---------|
| Public | None | — | Products, categories, vendors, health |
| Customer | JWT | CUSTOMER | Cart, orders, profile, notifications |
| Wholesale | JWT | WHOLESALE_BUYER | RFQ, wholesale pricing |
| Vendor | JWT | VENDOR_USER | Vendor dashboard, own products |
| Vendor Admin | JWT | VENDOR_ADMIN | Vendor settings, team |
| Admin | JWT | PLATFORM_ADMIN | User/vendor/product management, audit |
| Owner | JWT | OWNER | Financial controls, settlements, platform config |
| AI System | Service key | AI_SERVICE | Proposals (approval-gated) |

---

## 7. Error + Audit Policy

### Standard Error Codes

| Code | HTTP Status | Meaning |
|------|-------------|---------|
| VALIDATION_ERROR | 400 | Invalid request body |
| NOT_FOUND | 404 | Resource not found |
| UNAUTHORIZED | 401 | Missing or invalid auth |
| FORBIDDEN | 403 | Insufficient permissions |
| CONFLICT | 409 | Resource already exists |
| RATE_LIMITED | 429 | Too many requests |
| INTERNAL_ERROR | 500 | Server error |
| VENDOR_ISOLATION | 403 | Cross-vendor access denied |

### Audit Log Requirements

| Action | Logged In |
|--------|-----------|
| User role change | AdminActionLog |
| Vendor status change | AdminActionLog |
| Product moderation | AdminActionLog |
| Payment/refund/settlement | FinancialAuditLog |
| Owner platform config change | AdminActionLog |
| AI proposal approval | AiApprovalGate |

---

## 8. Frontend Integration Plan

1. **Current state**: Frontend uses mock data from `marketplaceMockData.ts`
2. **Future**: Introduce API client layer (fetch wrapper or Axios)
3. **No scattered fetch**: All API calls through centralized client
4. **Shared contracts**: DTOs/types may be shared via `packages/shared` (future monorepo)
5. **Phased migration**: Replace mock data with API calls per feature group
6. **Type safety**: API response types generated from contracts

---

## 9. Deferred Items

| Item | Deferred To | Reason |
|------|------------|--------|
| Payment APIs | Phase 9+ | Requires business decisions |
| Settlement APIs | Phase 9+ | Requires ledger approval |
| Commission calculation | Phase 8+ | Requires business rules |
| AI chat/recommendations | Phase 10+ | Requires backend foundation |
| Real-time notifications | Phase 8+ | Requires WebSocket design |
| Multi-currency | Phase 9+ | NGN only for MVP |

---

## 10. Owner Approval Gates

| Gate | When | Required |
|------|------|----------|
| API contract design approved | After this document | PM |
| Auth strategy approved | Before P3-007 | PM + Owner |
| Payment provider selection | Phase 9 | Owner |
| Commission rate config | Phase 9 | Owner |
| Settlement approval workflow | Phase 9 | Owner |

---

## 11. Explicit "No API/Backend Implementation Created" Note

**This document is a design artifact only.**

- No API route files have been created
- No controllers or services exist
- No backend code has been written
- No database schema exists
- No auth has been implemented
- No payment logic exists

**All API implementation requires PM approval via the governed task sequence.**
