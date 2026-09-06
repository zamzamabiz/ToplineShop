# ToplineShop — Phase 3 Backend Readiness Architecture Plan

> **Status**: PLANNING DOCUMENT — NO IMPLEMENTATION  
> **Date**: 2026-09-07  
> **Author**: Implementation Agent under PM governance  
> **Approval Required**: PM/Owner before any backend code is written

---

## 1. Current Frontend Freeze Status

| Item | Status |
|------|--------|
| Phase 1 (UX Architecture) | PASS / CLOSED |
| Phase 2 (Public Marketplace Frontend) | PASS / CLOSED |
| Frontend routes | 17 (all building) |
| Mock data | Centralized in `src/data/marketplaceMockData.ts` |
| Shared types | `src/types/marketplace.ts` |
| Commerce placeholders | All buttons disabled, badges visible |
| Owner browser check | PASS |

**Frontend is frozen.** No further frontend work required until backend is wired.

---

## 2. Backend Stack Recommendation

### Current Stack
- Next.js 16.3.4 (Turbopack)
- React 19.2.8
- Tailwind CSS 4
- TypeScript 5
- No backend packages

### Option A: Next.js Full-Stack (API Routes + Server Actions)

| Aspect | Assessment |
|--------|------------|
| **Pros** | Single codebase, shared types, simpler deployment, lower ops cost |
| **Cons** | Couples frontend and backend, harder to scale independently, vendor lock-in to Next.js runtime |
| **Risk** | Medium — tight coupling makes future migration harder |
| **Best fit** | Small-to-medium marketplace, single team |

### Option B: Separate Backend Service (NestJS)

| Aspect | Assessment |
|--------|------------|
| **Pros** | Clean separation of concerns, independent scaling, enterprise patterns, better testability |
| **Cons** | More infrastructure, two deployments, cross-origin complexity |
| **Risk** | Medium — more moving parts, but industry standard |
| **Best fit** | Multi-vendor SaaS with complex business logic |

### Option C: Hybrid — Next.js Frontend + Separate Backend API (Recommended)

| Aspect | Assessment |
|--------|------------|
| **Pros** | Frontend stays Next.js (proven), backend is independent NestJS service, clean API contract, future-proof for multi-vendor SaaS, B2B, AI features |
| **Cons** | Two services to deploy, API versioning needed |
| **Risk** | Low — standard architecture for marketplace platforms |
| **Best fit** | **ToplineShop** — B2C + B2B + multi-vendor SaaS + future AI |

### Recommendation: Option C (Hybrid)

**Rationale:**
1. ToplineShop is a multi-vendor marketplace with B2B wholesale — complex enough to warrant separation
2. Future AI features (product recommendations, chatbot, fraud detection) need independent backend
3. Payment/commission/settlement requires isolated, auditable backend
4. Owner dashboard needs real-time data without frontend rebuilds
5. Vendor SaaS requires independent API rate limiting and multi-tenancy

---

## 3. Database Direction Plan

### Stack
- **Primary DB**: PostgreSQL (via Supabase or self-hosted)
- **ORM**: Prisma
- **Migrations**: Prisma Migrate (version-controlled)
- **Seeds**: Prisma Seed script for dev/staging

### Environment Separation

| Environment | Database | Purpose |
|-------------|----------|---------|
| Development | Local PostgreSQL or Supabase free tier | Local dev |
| Staging | Supabase staging project | Pre-production testing |
| Production | Supabase production or AWS RPS | Live marketplace |

### Seed Policy
- Dev seed: realistic mock data matching current `marketplaceMockData.ts`
- Staging seed: anonymized production-like data
- Production seed: none (real data only)

### Backup/Rollback Policy
- Daily automated backups (Supabase handles this)
- Prisma Migrate for schema rollback safety
- No destructive operations without PM approval

### Core Domain Models (Future)

```
Users
├── id, email, name, role, createdAt, updatedAt
├── Roles: GUEST, CUSTOMER, WHOLESALE_BUYER, VENDOR_USER, VENDOR_ADMIN, PLATFORM_ADMIN, OWNER

Vendors
├── id, name, slug, description, logo, verified, status, ownerId
├── VendorProfile: location, responseRate, deliveryNote, returnPolicy

Products
├── id, name, slug, description, price, originalPrice, currency, categoryId, vendorId
├── ProductVariant: id, productId, name, price, sku, stock
├── ProductImage: id, productId, url, alt, sortOrder
├── ProductSpec: id, productId, label, value

Categories
├── id, name, slug, icon, parentId (self-referencing tree)

Cart
├── CartItem: id, cartId, productId, variantId, quantity, price
├── Cart: id, userId (or sessionId for guests)

Orders
├── Order: id, userId, status, total, shippingAddress, createdAt
├── OrderItem: id, orderId, productId, variantId, quantity, price

Payments
├── Payment: id, orderId, provider, amount, currency, status, reference, createdAt
├── Refund: id, paymentId, amount, reason, status, approvedBy

Commissions
├── Commission: id, orderId, vendorId, amount, rate, status, settledAt

Settlements
├── Settlement: id, vendorId, amount, period, status, paidAt

B2B
├── RFQ: id, buyerId, vendorId, items, status, createdAt
├── WholesaleAccount: id, userId, company, verified, tier

AuditLogs
├── id, userId, action, entity, entityId, metadata, createdAt

Notifications
├── id, userId, type, title, read, createdAt

AI (Future)
├── AIConversation: id, userId, messages, createdAt
├── AIRecommendation: id, userId, productId, score, createdAt
```

---

## 4. Auth + RBAC Plan

### Authentication
- **Provider**: NextAuth.js (Auth.js) or custom JWT
- **Sessions**: HTTP-only cookies (secure, SameSite)
- **Password**: bcrypt hashing
- **OAuth**: Google, GitHub (future)

### Roles (RBAC)

| Role | Access |
|------|--------|
| GUEST | Public browsing only |
| CUSTOMER | Cart, orders, profile, reviews |
| WHOLESALE_BUYER | + RFQ, bulk pricing, wholesale dashboard |
| VENDOR_USER | + Vendor dashboard, own products |
| VENDOR_ADMIN | + Vendor settings, team management |
| PLATFORM_ADMIN | + Admin panel, vendor approval, moderation |
| OWNER/SUPER ADMIN | + Financial controls, settlements, platform config |
| SUPPORT/OPERATIONS | + Order support, ticket management |

### Safety Rules
1. **Owner-only financial controls**: Settlements, commission rate changes, revenue exports
2. **Admin cannot fake revenue**: Read-only access to financial metrics
3. **Vendor isolation**: Vendor can only access own data (enforced at API + DB level)
4. **Customer isolation**: Customer cannot access vendor/admin areas
5. **AI safety**: AI cannot approve payments, refunds, settlements, or destructive actions
6. **Audit logging**: All role changes, financial operations, and destructive actions logged

---

## 5. API Boundary Plan

### API Groups

| Group | Purpose | Routes (Future) | Risk | Phase |
|-------|---------|-----------------|------|-------|
| Auth/Session | Login, register, refresh | `/api/auth/*` | Low | 7 |
| Users/Profile | Profile CRUD, preferences | `/api/users/*` | Low | 7 |
| Categories | Category tree, CRUD | `/api/categories/*` | Low | 7 |
| Products | Product CRUD, search, variants | `/api/products/*` | Medium | 7 |
| Vendors | Vendor profiles, storefronts | `/api/vendors/*` | Medium | 7 |
| Cart | Cart add/remove/update | `/api/cart/*` | Medium | 8 |
| Orders | Order creation, status | `/api/orders/*` | High | 8 |
| Payments | Payment initiation, webhooks | `/api/payments/*` | Critical | 9 |
| B2B RFQ | RFQ creation, responses | `/api/rfq/*` | Medium | 8 |
| Admin | Vendor approval, moderation | `/api/admin/*` | High | 8 |
| Owner Metrics | Revenue, analytics, exports | `/api/owner/*` | Critical | 9 |
| Audit Logs | Activity logging | `/api/audit/*` | Medium | 8 |
| Notifications | User notifications | `/api/notifications/*` | Low | 8 |
| AI Assistant | Chat, recommendations | `/api/ai/*` | Medium | 10 |

### API Design Principles
1. RESTful with JSON payloads
2. Versioned: `/api/v1/*`
3. Rate limiting per role/vendor
4. Input validation (Zod schemas)
5. Error responses: `{ error: string, code: string, details?: any }`
6. Pagination: cursor-based for large datasets
7. Idempotency keys for payment operations

---

## 6. Payment / Checkout Safety Policy

### Rules (Non-Negotiable)

1. **No payment until product/order/cart/auth are real and tested**
2. **No fake financial metrics** — all monetary values come from real transactions
3. **No commission/settlement logic without ledger design**
4. **All money operations require audit logs**
5. **Refund/settlement/payment must be Owner-approved** in future phase
6. **Payment provider integration deferred** to Phase 9+

### Payment Flow (Future)

```
Customer → Cart → Checkout → Order Created → Payment Initiated
                                                    ↓
                                            Payment Provider (Paystack/Flutterwave)
                                                    ↓
                                            Webhook Confirmation
                                                    ↓
                                            Order Confirmed → Commission Calculated
                                                    ↓
                                            Settlement Period → Vendor Payout (Owner Approved)
```

### Ledger Requirements
- Double-entry bookkeeping for all financial transactions
- Immutable audit trail
- Reconciliation capability
- Tax reporting support

---

## 7. Recommended Phase 3 Task Sequence

| Task | Title | Type | Dependencies |
|------|-------|------|-------------|
| TOPLINE-P3-001 | Backend Readiness Architecture Plan | Planning | Phase 2 CLOSED |
| TOPLINE-P3-002 | Backend Stack Decision + Project Structure | Planning | P3-001 |
| TOPLINE-P3-003 | Database Schema Design Document | Planning | P3-002 |
| TOPLINE-P3-004 | API Contract Design Document | Planning | P3-002 |
| TOPLINE-P3-005 | Auth/RBAC Design Document | Planning | P3-002 |
| TOPLINE-P3-006 | Backend Bootstrap Implementation | Implementation | P3-003, P3-004, P3-005 |
| TOPLINE-P3-007 | Health Check + Environment Safety | Implementation | P3-006 |
| TOPLINE-P3-008 | Phase 3 Backend Foundation Freeze Gate | Audit | P3-007 |

**Note**: Tasks P3-001 through P3-005 are planning documents only. No code until P3-006.

---

## 8. Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Scope creep in backend design | High | Strict task boundaries, PM audit gates |
| Premature optimization | Medium | Design for scale, implement for MVP |
| Payment integration complexity | High | Defer to Phase 9, focus on foundation |
| Multi-vendor data isolation bugs | High | API-level + DB-level enforcement, audit logs |
| Auth security vulnerabilities | High | Use battle-tested library (NextAuth/Auth.js), security review |
| Database migration conflicts | Medium | Prisma Migrate, single source of truth schema |

---

## 9. Owner Approval Gates

| Gate | When | Approval Required |
|------|------|-------------------|
| Architecture Plan Approved | After P3-001 | PM + Owner |
| Stack Decision Approved | After P3-002 | PM + Owner |
| Schema Design Approved | After P3-003 | PM |
| API Contract Approved | After P3-004 | PM |
| Auth Design Approved | After P3-005 | PM + Owner |
| Backend Bootstrap Complete | After P3-007 | PM |
| Phase 3 Freeze Gate | After P3-008 | PM + Owner |

---

## 10. Explicit "No Implementation Yet" Note

**This document is a planning artifact only.**

- No backend code has been written
- No database schema has been created
- No migrations have been run
- No auth has been implemented
- No payment logic exists
- No API endpoints exist
- No packages have been installed
- The frontend remains unchanged

**All backend implementation requires PM approval via the governed task sequence above.**
