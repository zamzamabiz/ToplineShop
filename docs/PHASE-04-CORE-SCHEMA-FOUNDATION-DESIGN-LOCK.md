# ToplineShop — Core Schema Foundation Design Lock

> **Status**: DESIGN LOCK — DOCUMENTATION ONLY  
> **Date**: 2026-09-07  
> **Task**: TOPLINE-P4-003  
> **Author**: Implementation Agent under PM governance  
> **Approval Required**: PM before any Prisma models or migrations are written

---

## 1. Purpose

This document locks the exact safe schema group for the first real database schema implementation (P4-004). It decides which core models to implement first, which to defer, what fields each model requires, what tenant isolation rules are mandatory, and what safety rules must be followed.

**This is a design documentation artifact only.** No Prisma models, migrations, or database changes have been made.

---

## 2. Current Database State

| Item | Status |
|------|--------|
| Prisma installed | 6.19.3 |
| @prisma/client installed | 6.19.3 |
| Schema file exists | `backend/prisma/schema.prisma` |
| Schema content | Generator + datasource only |
| Prisma model count | 0 |
| Migration count | 0 |
| PostgreSQL connection | Not active |
| PrismaService `onModuleInit` | Empty (no connection) |
| Health endpoint | `database: not_configured` |
| Backend smoke | PASS (3/3 endpoints) |
| Root lint | PASS (0 errors) |
| Root build | PASS (17 routes) |

---

## 3. Dependencies

| Dependency | Status | Purpose |
|------------|--------|---------|
| TOPLINE-P4-001 | PASS / CLOSED | Database readiness audit |
| TOPLINE-P4-002 | PASS / CLOSED | Prisma bootstrap (packages, service, schema shell) |
| Phase 3 Freeze Gate | PASS / CLOSED | All Phase 3 tasks frozen |

---

## 4. Approved First-Scope Model List

After reviewing all Phase 3 design documents, the following 7 models are approved as the safest first-scope group:

| # | Model | Purpose | Risk |
|---|-------|---------|------|
| 1 | **Tenant** | Multi-tenant business isolation boundary | LOW |
| 2 | **User** | Platform-level identity (placeholder only) | LOW |
| 3 | **Membership** | Tenant ↔ User relationship | LOW |
| 4 | **Vendor** | Marketplace seller identity | LOW |
| 5 | **Category** | Product catalog tree | LOW |
| 6 | **Product** | Catalog foundation | LOW |
| 7 | **AuditLog** | Governance activity tracking | LOW |

**Rationale:** These 7 models establish the minimum viable platform foundation. They enable multi-tenancy, identity, marketplace seller identity, product catalog structure, and governance logging — without touching auth, payments, orders, or any business logic.

---

## 5. Deferred Model List

The following models are explicitly deferred to later tasks/phases:

### Commerce (Phase 5+)
- Cart / CartItem
- Order / OrderItem / OrderStatusHistory
- Address

### B2B Wholesale (Phase 5+)
- WholesaleBuyerProfile
- RFQ / RFQItem / RFQQuote
- BulkPricingRule

### Payments & Financial (Phase 9+)
- Payment
- Refund
- CommissionRule
- VendorSettlement
- LedgerEntry
- FinancialAuditLog

### Admin & Owner (Phase 6+)
- AdminActionLog
- OwnerMetricSnapshot
- PlatformSetting
- RiskFlag

### Notifications & Support (Phase 5+)
- Notification
- SupportTicket / SupportMessage

### Auth Infrastructure (Phase 8+)
- AuthAccount (OAuth providers)
- Session (session tokens)
- ApprovalGate

### Auth/RBAC Tables (Phase 8+)
- Role
- Permission
- RolePermission
- TenantMembershipRole
- Module
- TenantModule
- VendorMembership

### AI Governance (Future)
- AiAssistantLog
- AiRecommendation
- AiActionProposal
- AiApprovalGate

### Reason for Deferral
All deferred models are higher-risk business, financial, auth, or domain-specific tables. They should not be mixed into the first schema foundation. The first scope establishes identity, tenant isolation, catalog structure, and governance logging only.

---

## 6. Design Principles

| # | Principle | Implementation |
|---|-----------|----------------|
| 1 | **UUID primary keys** | All models use `@id @default(uuid())` |
| 2 | **Timestamps on all tables** | `createdAt` and `updatedAt` on every model |
| 3 | **Soft delete where appropriate** | `deletedAt` nullable on Tenant, Vendor, Category, Product |
| 4 | **tenantId on business tables** | Vendor, Category, Product carry `tenantId` |
| 5 | **Audit logging for important changes** | AuditLog captures all significant events |
| 6 | **Decimal safety for money** | `Decimal(19,4)` for `basePrice` (no money logic now) |
| 7 | **No cross-tenant data leakage** | Tenant isolation via `tenantId` on business tables |
| 8 | **No destructive migration** | Schema additions only |
| 9 | **No seed/reset/init scripts** | Without explicit PM approval |
| 10 | **No production database connection** | Development only |
| 11 | **No auth/payment business logic** | Schema foundation only |
| 12 | **Modular SaaS architecture** | Schema supports future modules |

---

## 7. Model-by-Model Design Details

### 7.1 Tenant

**Purpose:** Top-level business isolation boundary. Each vendor organization, the platform itself, and future business tenants are represented here.

**Why included:** Multi-tenancy is the foundation of the SaaS architecture. Without Tenant, no business data can be properly isolated.

**Why safe:** Tenant is a structural model with no business logic, no auth, no payments. It is purely organizational.

**Fields:**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | UUID | Yes | PK, `@id @default(uuid())` |
| name | VARCHAR(255) | Yes | Organization name |
| slug | VARCHAR(255) | Yes | URL-friendly identifier |
| type | TenantType | Yes | `PLATFORM`, `VENDOR` |
| status | TenantStatus | Yes | `ACTIVE`, `SUSPENDED` |
| createdAt | TIMESTAMP | Yes | Auto-generated |
| updatedAt | TIMESTAMP | Yes | Auto-updated |
| deletedAt | TIMESTAMP | No | Soft delete (nullable) |

**Relations:**
- Tenant → Membership (1:N)
- Tenant → Vendor (1:N)
- Tenant → Category (1:N)
- Tenant → Product (1:N)
- Tenant → AuditLog (1:N)

**Indexes/Unique Constraints:**
- `slug` — UNIQUE

**Tenant Isolation:** Tenant is the isolation boundary itself. All business data references `tenantId`.

**Audit Rule:** Tenant creation, suspension, deletion logged in AuditLog.

**Deferred Fields/Features:**
- `parentId` (org hierarchy) — future
- `type` extended values (`CUSTOMER_ORG`, `WHOLESALER`) — future
- Billing/subscription fields — future

**Risks:** None significant. Structural model only.

**Validation Notes for P4-004:**
- Verify slug uniqueness
- Verify type enum values
- Verify soft delete behavior

---

### 7.2 User

**Purpose:** Platform-level identity placeholder. Represents a person who may access one or more tenants.

**Why included:** User is the fundamental identity model. Without it, no membership, vendor, or audit relationship can exist.

**Why safe:** This is identity-only. No passwords, no sessions, no OAuth, no JWT, no login/logout. Just a name, email, and status.

**Fields:**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | UUID | Yes | PK, `@id @default(uuid())` |
| email | VARCHAR(255) | Yes | Unique, login identifier (future) |
| name | VARCHAR(255) | Yes | Display name |
| phone | VARCHAR(50) | No | Nullable |
| avatar | TEXT | No | Profile image URL (nullable) |
| status | UserStatus | Yes | `ACTIVE`, `DISABLED` |
| createdAt | TIMESTAMP | Yes | Auto-generated |
| updatedAt | TIMESTAMP | Yes | Auto-updated |
| deletedAt | TIMESTAMP | No | Soft delete (nullable) |

**Relations:**
- User → Membership (1:N)
- User → AuditLog (1:N, optional — actorUserId)

**Indexes/Unique Constraints:**
- `email` — UNIQUE

**Tenant Isolation:** User is platform-level (global). Access is tenant-scoped through Membership. Users do not carry `tenantId` because a user may belong to multiple tenants.

**Deferred Fields/Features:**
- `passwordHash` — Phase 8+ (auth)
- `emailVerified` — Phase 8+ (auth)
- `phone` unique constraint — Phase 8+ (auth)
- OAuth/provider accounts — Phase 8+ (auth)
- Session management — Phase 8+ (auth)

**Risks:** None significant. Identity placeholder only.

**Validation Notes for P4-004:**
- Verify email uniqueness
- Verify status enum values
- Verify no auth fields present

---

### 7.3 Membership

**Purpose:** Links a User to a Tenant. Defines which users can access which tenants and in what capacity.

**Why included:** Membership is the core multi-tenant access model. Without it, there is no way to associate users with tenant contexts.

**Why safe:** No role enforcement, no permission checks, no auth tokens. Pure relationship table with status.

**Fields:**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | UUID | Yes | PK, `@id @default(uuid())` |
| userId | UUID | Yes | FK → User |
| tenantId | UUID | Yes | FK → Tenant |
| status | MembershipStatus | Yes | `ACTIVE`, `INVITED`, `SUSPENDED` |
| createdAt | TIMESTAMP | Yes | Auto-generated |
| updatedAt | TIMESTAMP | Yes | Auto-updated |

**Relations:**
- Membership → User (N:1)
- Membership → Tenant (N:1)

**Indexes/Unique Constraints:**
- `(userId, tenantId)` — UNIQUE (one membership per user per tenant)

**Tenant Isolation:** Membership is the bridge between User (global) and Tenant (scoped). Querying by `tenantId` gives all members of a tenant.

**Audit Rule:** Membership creation, suspension logged in AuditLog.

**Deferred Fields/Features:**
- Role assignment (TenantMembershipRole) — Phase 8+
- Permission resolution — Phase 8+
- Joined date (separate from createdAt) — future
- Invitation token — Phase 8+ (auth)

**Risks:** None significant. Relationship table only.

**Validation Notes for P4-004:**
- Verify FK integrity
- Verify unique constraint on (userId, tenantId)
- Verify status enum values

---

### 7.4 Vendor

**Purpose:** Marketplace seller identity. Represents a business entity that sells products on the platform.

**Why included:** Vendor is the core marketplace business entity. Products belong to vendors. The entire marketplace revolves around vendors.

**Why safe:** Vendor is identity-only in this scope. No profile details, no verification documents, no financial accounts. Just name, slug, status, and tenant/owner references.

**Fields:**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | UUID | Yes | PK, `@id @default(uuid())` |
| tenantId | UUID | Yes | FK → Tenant (tenant isolation) |
| name | VARCHAR(255) | Yes | Vendor display name |
| slug | VARCHAR(255) | Yes | URL-friendly identifier |
| description | TEXT | No | Vendor description (nullable) |
| logo | TEXT | No | Logo URL (nullable) |
| status | VendorStatus | Yes | `DRAFT`, `ACTIVE`, `SUSPENDED` |
| ownerId | UUID | No | FK → User (vendor owner, nullable) |
| createdAt | TIMESTAMP | Yes | Auto-generated |
| updatedAt | TIMESTAMP | Yes | Auto-updated |
| deletedAt | TIMESTAMP | No | Soft delete (nullable) |

**Relations:**
- Vendor → Tenant (N:1)
- Vendor → User (N:1, ownerId)
- Vendor → Product (1:N)

**Indexes/Unique Constraints:**
- `slug` — UNIQUE
- `(tenantId, name)` — optional composite index

**Tenant Isolation:** Vendor carries `tenantId`. All vendor queries must filter by `tenantId`.

**Audit Rule:** Vendor creation, status changes logged in AuditLog.

**Deferred Fields/Features:**
- VendorProfile (storefront details) — Phase 5+
- VendorVerification (document verification) — Phase 8+
- VendorUser (vendor membership) — Phase 8+
- `verified` boolean — Phase 8+
- Financial accounts — Phase 9+

**Risks:** None significant. Identity model only.

**Validation Notes for P4-004:**
- Verify slug uniqueness
- Verify tenantId FK integrity
- Verify ownerId FK integrity
- Verify status enum values

---

### 7.5 Category

**Purpose:** Product catalog tree. Organizes products into hierarchical categories.

**Why included:** Categories are fundamental to marketplace navigation and product organization. Without them, products cannot be structured.

**Why safe:** Categories are structural data with no business logic, no financial implications, no auth requirements.

**Fields:**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | UUID | Yes | PK, `@id @default(uuid())` |
| tenantId | UUID | Yes | FK → Tenant (tenant isolation) |
| name | VARCHAR(255) | Yes | Category display name |
| slug | VARCHAR(255) | Yes | URL-friendly identifier |
| icon | VARCHAR(50) | No | Icon identifier (nullable) |
| parentId | UUID | No | FK → Category (self-referencing, nullable) |
| sortOrder | INTEGER | Yes | Default 0 |
| status | CategoryStatus | Yes | `ACTIVE`, `HIDDEN` |
| createdAt | TIMESTAMP | Yes | Auto-generated |
| updatedAt | TIMESTAMP | Yes | Auto-updated |
| deletedAt | TIMESTAMP | No | Soft delete (nullable) |

**Relations:**
- Category → Tenant (N:1)
- Category → Category (self-referencing, N:1 via parentId)
- Category → Product (1:N)

**Indexes/Unique Constraints:**
- `(tenantId, slug)` — UNIQUE (slug unique per tenant)

**Tenant Isolation:** Category carries `tenantId`. All category queries must filter by `tenantId`. Slug uniqueness scoped to tenant.

**Audit Rule:** Category creation, updates logged in AuditLog.

**Deferred Fields/Features:**
- Category image/banner — future
- Category metadata/SEO fields — future
- Category path/materialized path — future

**Risks:** None significant. Structural data only.

**Validation Notes for P4-004:**
- Verify self-referencing parentId
- Verify (tenantId, slug) unique constraint
- Verify status enum values
- Verify sortOrder behavior

---

### 7.6 Product

**Purpose:** Catalog foundation. Represents a sellable item in the marketplace.

**Why included:** Products are the core marketplace entity. Without products, there is no catalog, no browsing, no commerce.

**Why safe:** Product in this scope is minimal catalog data only. No pricing logic, no inventory management, no order association, no payment. Just name, description, price placeholder, and references.

**Fields:**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | UUID | Yes | PK, `@id @default(uuid())` |
| tenantId | UUID | Yes | FK → Tenant (tenant isolation) |
| vendorId | UUID | Yes | FK → Vendor (product owner) |
| categoryId | UUID | Yes | FK → Category |
| name | VARCHAR(255) | Yes | Product display name |
| slug | VARCHAR(255) | Yes | URL-friendly identifier |
| description | TEXT | No | Product description (nullable) |
| basePrice | Decimal(19,4) | Yes | Base price (in minor units concept) |
| currency | VARCHAR(3) | Yes | Default `'NGN'` |
| status | ProductStatus | Yes | `DRAFT`, `ACTIVE`, `ARCHIVED` |
| inStock | BOOLEAN | Yes | Default `true` |
| createdAt | TIMESTAMP | Yes | Auto-generated |
| updatedAt | TIMESTAMP | Yes | Auto-updated |
| deletedAt | TIMESTAMP | No | Soft delete (nullable) |

**Relations:**
- Product → Tenant (N:1)
- Product → Vendor (N:1)
- Product → Category (N:1)

**Indexes/Unique Constraints:**
- `(tenantId, slug)` — UNIQUE (slug unique per tenant)
- `vendorId` — index
- `categoryId` — index

**Tenant Isolation:** Product carries `tenantId`. All product queries must filter by `tenantId`. Slug uniqueness scoped to tenant.

**Audit Rule:** Product creation, updates, status changes logged in AuditLog.

**Deferred Fields/Features:**
- ProductImage — Phase 5+
- ProductVariant — Phase 5+
- ProductAttribute — Phase 5+
- VendorProductListing — Phase 5+
- Inventory management — Phase 5+
- `stockLabel`, `deliveryNote`, `returnNote` — Phase 5+
- Rating/review aggregation — Phase 5+

**Risks:**
- `basePrice` as Decimal(19,4) — no money logic implemented. Price is data only, not computed.
- `currency` defaults to NGN — future multi-currency support deferred.

**Validation Notes for P4-004:**
- Verify (tenantId, slug) unique constraint
- Verify vendorId FK integrity
- Verify categoryId FK integrity
- Verify Decimal precision
- Verify status enum values

---

### 7.7 AuditLog

**Purpose:** Governance activity tracking. Records significant events for audit trail.

**Why included:** AuditLog is essential for governance. All sensitive actions must be logged. Building it now ensures the foundation exists before any business logic is implemented.

**Why safe:** AuditLog is a write-only log table. No business logic, no auth, no financial implications. It records events, nothing more.

**Fields:**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | UUID | Yes | PK, `@id @default(uuid())` |
| tenantId | UUID | No | FK → Tenant (nullable for platform events) |
| actorUserId | UUID | No | FK → User (nullable for system events) |
| action | VARCHAR(100) | Yes | Event type (e.g., `TENANT_CREATED`, `VENDOR_SUSPENDED`) |
| entityType | VARCHAR(50) | Yes | Affected entity type (e.g., `Tenant`, `Vendor`) |
| entityId | UUID | Yes | Affected entity ID |
| summary | TEXT | No | Human-readable summary (nullable) |
| metadata | JSONB | No | Additional structured data (nullable) |
| createdAt | TIMESTAMP | Yes | Auto-generated |

**Relations:**
- AuditLog → Tenant (N:1, optional)
- AuditLog → User (N:1, optional — actorUserId)

**Indexes/Unique Constraints:**
- `tenantId` — index
- `entityType, entityId` — composite index
- `createdAt` — index (for time-range queries)

**Tenant Isolation:** AuditLog carries optional `tenantId`. Platform-level events may have `tenantId = NULL`. Tenant-scoped events always carry `tenantId`.

**Audit Rule:** AuditLog itself is immutable. No soft delete. No updates. No deletes. Write-only.

**Deferred Fields/Features:**
- `ipAddress` — Phase 8+ (auth context)
- `userAgent` — Phase 8+ (auth context)
- `resource` field (alias for entityType) — future
- `resourceId` field (alias for entityId) — future
- Retention policy enforcement — future

**Risks:**
- AuditLog growth — may need partitioning in future. Not a concern at current scale.
- Immutability — must be enforced at application level (no Prisma-level enforcement for "no update/delete").

**Validation Notes for P4-004:**
- Verify no soft delete on AuditLog
- Verify no update/delete operations (enforced at service level)
- Verify index performance

---

## 8. Tenant Isolation Rules

### 8.1 Core Principle

Tenant is the top-level business isolation boundary. Every business table must include `tenantId` unless it is a platform-level global entity.

### 8.2 Tenant-Scoped Models

| Model | tenantId | Isolation Rule |
|-------|----------|----------------|
| Vendor | Required | All vendor queries filter by `tenantId` |
| Category | Required | All category queries filter by `tenantId`. Slug unique per tenant. |
| Product | Required | All product queries filter by `tenantId`. Slug unique per tenant. |
| AuditLog | Optional | Tenant-scoped events carry `tenantId`. Platform events may be NULL. |

### 8.3 Global Models (No tenantId)

| Model | Reason |
|-------|--------|
| User | Platform-level identity. A user may belong to multiple tenants via Membership. |
| Membership | Bridge model linking User to Tenant. Carries `tenantId` but is the access boundary itself. |
| Tenant | The isolation boundary itself. Does not carry its own `tenantId`. |

### 8.4 Query Rules (Future Enforcement)

- All vendor queries: `WHERE tenantId = :currentTenantId`
- All category queries: `WHERE tenantId = :currentTenantId`
- All product queries: `WHERE tenantId = :currentTenantId`
- All audit queries: `WHERE tenantId = :currentTenantId OR tenantId IS NULL` (for platform events)
- Unique constraints: `(tenantId, slug)` for Category and Product (slug unique per tenant)

### 8.5 Cross-Tenant Access Rules

- **Owner/Admin** may view data across tenants (audit-logged).
- **Vendor users** may only access data within their tenant.
- **Customers** access product/category data through public APIs (tenant-scoped).
- **No automatic cross-tenant queries** without explicit Owner/Admin authorization.

---

## 9. AuditLog Design

### 9.1 Minimal Design

AuditLog in this scope is a minimal governance log:

- `id` — UUID primary key
- `tenantId` — optional (nullable for platform events)
- `actorUserId` — optional (nullable for system events)
- `action` — string (event type)
- `entityType` — string (affected entity type)
- `entityId` — UUID (affected entity ID)
- `summary` — optional text (human-readable description)
- `metadata` — optional JSONB (structured data)
- `createdAt` — timestamp (event time)

### 9.2 Design Decisions

- **No soft delete on AuditLog** — audit logs are immutable
- **No update/delete operations** — enforced at application level
- **Optional tenantId** — supports both platform and tenant-scoped events
- **Optional actorUserId** — supports both user-triggered and system events
- **JSONB metadata** — flexible for different event types
- **No ipAddress/userAgent** — deferred to auth implementation (Phase 8+)

### 9.3 Action Naming Convention

Format: `ENTITY_ACTION`

Examples:
- `TENANT_CREATED`
- `TENANT_SUSPENDED`
- `USER_CREATED`
- `MEMBERSHIP_CREATED`
- `MEMBERSHIP_SUSPENDED`
- `VENDOR_CREATED`
- `VENDOR_SUSPENDED`
- `CATEGORY_CREATED`
- `PRODUCT_CREATED`
- `PRODUCT_UPDATED`
- `PRODUCT_ARCHIVED`

### 9.4 What Is NOT Implemented

- Audit service/helper — future
- Event bus/listener — future
- Automatic audit capture — future
- Audit query API — future
- Audit export — future
- Retention policy — future
- ipAddress/userAgent capture — Phase 8+

---

## 10. Soft Delete Design

### 10.1 Model Soft Delete Decisions

| Model | Soft Delete | Reason |
|-------|-------------|--------|
| Tenant | `deletedAt` nullable | Tenant deletion is rare and risky. Soft delete allows recovery. |
| User | `deletedAt` nullable | User deletion affects memberships and audit trail. Soft delete preserves history. |
| Membership | No soft delete | Use `status` field (`SUSPENDED`) instead. Membership is a relationship, not a standalone entity. |
| Vendor | `deletedAt` nullable | Vendor deletion affects products and orders. Soft delete preserves history. |
| Category | `deletedAt` nullable | Category deletion affects products. Soft delete preserves references. |
| Product | `deletedAt` nullable | Product deletion affects orders (future). Soft delete preserves history. |
| AuditLog | No soft delete | Immutable. No deletes at all. |

### 10.2 Soft Delete Pattern

```prisma
model Example {
  id        String    @id @default(uuid())
  // ... other fields ...
  deletedAt DateTime? @map("deleted_at")
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
}
```

### 10.3 Soft Delete Query Rules (Future)

- Default queries: `WHERE deletedAt IS NULL`
- Admin/Owner queries: May include soft-deleted records (audit-logged)
- Restore operations: Set `deletedAt = NULL` (requires approval)
- Hard delete: Prohibited without PM/Owner approval

---

## 11. Status/Enums Design

### 11.1 Enum Definitions

```prisma
enum TenantType {
  PLATFORM
  VENDOR
}

enum TenantStatus {
  ACTIVE
  SUSPENDED
}

enum UserStatus {
  ACTIVE
  DISABLED
}

enum MembershipStatus {
  ACTIVE
  INVITED
  SUSPENDED
}

enum VendorStatus {
  DRAFT
  ACTIVE
  SUSPENDED
}

enum CategoryStatus {
  ACTIVE
  HIDDEN
}

enum ProductStatus {
  DRAFT
  ACTIVE
  ARCHIVED
}
```

### 11.2 Enum Design Decisions

- **Minimal values** — only essential statuses included
- **No complex workflows** — no PENDING/APPROVED/REJECTED chains in this scope
- **No financial statuses** — no payment/order/refund statuses
- **No auth statuses** — no email verified, MFA enabled, etc.
- **Vendor `DRAFT`** — vendors start as draft before activation
- **Product `ARCHIVED`** — products can be archived (not deleted)
- **Category `HIDDEN`** — categories can be hidden without deletion

---

## 12. Index / Unique Constraint Plan

| Model | Constraint | Type | Purpose |
|-------|-----------|------|---------|
| Tenant | `slug` | UNIQUE | URL routing, deduplication |
| User | `email` | UNIQUE | Login identifier (future) |
| Membership | `(userId, tenantId)` | UNIQUE | One membership per user per tenant |
| Vendor | `slug` | UNIQUE | URL routing, deduplication |
| Category | `(tenantId, slug)` | UNIQUE | Slug unique per tenant |
| Product | `(tenantId, slug)` | UNIQUE | Slug unique per tenant |
| Product | `vendorId` | INDEX | Vendor product queries |
| Product | `categoryId` | INDEX | Category product queries |
| AuditLog | `tenantId` | INDEX | Tenant audit queries |
| AuditLog | `(entityType, entityId)` | INDEX | Entity audit trail |
| AuditLog | `createdAt` | INDEX | Time-range queries |

---

## 13. Migration Safety Plan

### 13.1 P4-004 Migration Rules

| Rule | Enforcement |
|------|-------------|
| Schema additions only | No DROP TABLE, no DROP COLUMN |
| No destructive operations | No data loss |
| No `prisma migrate reset` | Prohibited without PM approval |
| No `prisma db push` | Prohibited without PM approval |
| No production database | Development only |
| No seed scripts | Without explicit PM approval |
| Migration reviewed before execution | PM must approve migration name and SQL |
| WDR required | Must show migration name, model count, rollback note |
| Rollback note required | Every migration must document how to undo |

### 13.2 Migration Process

1. Add approved models to `backend/prisma/schema.prisma`
2. Run `prisma validate` (with dummy DATABASE_URL)
3. Run `prisma generate` (generates client)
4. Run `prisma migrate dev --name <descriptive_name>` (local only)
5. Verify migration SQL in `prisma/migrations/` folder
6. Verify no destructive operations in SQL
7. Run `prisma validate` again
8. Run `npm run build` (root + backend)
9. Create WDR with migration evidence
10. STOP — PM approval required before any further action

### 13.3 Prohibited Actions

- `prisma migrate reset` — destructive, requires PM + Owner approval
- `prisma db push` — bypasses migration history
- Production database connection — requires explicit Owner approval
- Seed scripts — require explicit PM approval
- Destructive SQL (DROP, TRUNCATE) — requires PM + Owner approval

---

## 14. P4-004 Implementation Recommendation

### 14.1 Recommended Scope — Split into P4-004A and P4-004B

**TOPLINE-P4-004A — Core Prisma Models Implementation + Migration File Generation Review**

**Scope:**
- Add the 7 approved Prisma models to `backend/prisma/schema.prisma`:
  - Tenant (with TenantType, TenantStatus enums)
  - User (with UserStatus enum)
  - Membership (with MembershipStatus enum)
  - Vendor (with VendorStatus enum)
  - Category (with CategoryStatus enum)
  - Product (with ProductStatus enum)
  - AuditLog (no enum)
- Run `prisma validate` and `prisma generate`
- Create migration review documentation (inspect generated SQL without executing)
- Verify backend builds
- Verify backend smoke passes
- Verify root lint and build pass
- Create WDR with migration review evidence
- **Must NOT run migration against a database unless PM separately approves DB readiness**
- Do NOT run seed scripts
- Do NOT connect to real PostgreSQL
- Do NOT implement auth/RBAC
- Do NOT implement payment/order/commerce logic

**TOPLINE-P4-004B — Local PostgreSQL Connection + Migration Run**

**Scope (only after DB readiness is confirmed):**
- Connect to local PostgreSQL (dev database)
- Run `prisma migrate dev --name <name>` (local only)
- Verify migration SQL is non-destructive
- Verify backend builds and smoke passes
- Create WDR with migration evidence
- Requires PM approval before execution

### 14.2 P4-004A Deliverables

| Deliverable | Purpose |
|-------------|---------|
| Updated `backend/prisma/schema.prisma` | 7 models + enums |
| Migration review document | SQL review without execution |
| WDR | Evidence of safe implementation |
| Registry update | Task + WDR entries |

### 14.3 P4-004A Expected Model Count

7 models, 7 enums.

### 14.4 P4-004A Expected Migration Count

0 migrations executed. Migration file generated for review only.

---

## 15. Prohibited Actions for P4-004

| Action | Status |
|--------|--------|
| Create auth/session/OAuth models | ❌ Prohibited |
| Create order/cart/payment models | ❌ Prohibited |
| Create commission/settlement models | ❌ Prohibited |
| Create RFQ/wholesale models | ❌ Prohibited |
| Create notification/support models | ❌ Prohibited |
| Create AI governance models | ❌ Prohibited |
| Run seed scripts | ❌ Prohibited |
| Run `prisma migrate reset` | ❌ Prohibited |
| Run `prisma db push` | ❌ Prohibited |
| Connect to production database | ❌ Prohibited |
| Create `backend/.env` | ❌ Prohibited |
| Create `.env.local` | ❌ Prohibited |
| Implement auth/login/logout | ❌ Prohibited |
| Implement payment/order/commerce | ❌ Prohibited |
| Implement RBAC middleware | ❌ Prohibited |
| Modify frontend theme system | ❌ Prohibited |
| Modify frontend marketplace flows | ❌ Prohibited |
| Use `git add .` | ❌ Prohibited |
| Touch shop.com | ❌ Prohibited |

---

## 16. Known Limitations

- No PostgreSQL server available (local or remote)
- No real database connection active
- PrismaService `onModuleInit` is empty (no connection)
- Health endpoint still reports `database: not_configured`
- No seed data exists
- No auth/RBAC implementation
- No payment/order/commerce implementation
- Schema design is documentation-only until P4-004
- Multi-tenant isolation not yet validated in code
- No database backup/restore procedure defined
- AuditLog immutability enforced at application level only (no DB-level constraint)

---

## 17. Final Design Lock Decision

### READY FOR P4-004A IMPLEMENTATION REVIEW

**Evidence:**
- Phase 3 frozen and all tasks closed
- P4-001 readiness audit PASS
- P4-002 Prisma bootstrap PASS (6.19.3)
- Prisma schema exists (generator + datasource only)
- PrismaService scaffold exists (no connection)
- Backend builds and smoke passes
- Root lint and build pass
- Frontend protected (17 routes)
- No prohibited items found
- 7 first-scope models defined with full detail
- Deferred models explicitly listed
- Design principles documented
- Tenant isolation rules documented
- Migration safety plan documented
- P4-004A scope clearly defined (models + migration review, no DB execution)
- P4-004B scope clearly defined (DB connection + migration run, after DB readiness confirmed)
- Prohibited actions for P4-004 clearly listed

**The project is ready for P4-004A implementation review.**
