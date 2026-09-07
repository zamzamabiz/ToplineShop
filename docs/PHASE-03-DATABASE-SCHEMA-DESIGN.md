# ToplineShop — Database Schema Design Document

> **Status**: DESIGN DOCUMENT — NO SCHEMA/MIGRATIONS CREATED  
> **Date**: 2026-09-07  
> **Author**: Implementation Agent under PM governance  
> **Approval Required**: PM before any Prisma schema or migration is written

---

## 1. Purpose

This document defines the future database schema design for ToplineShop — a multi-vendor SaaS marketplace supporting B2C retail, B2B wholesale, vendor dashboards, admin panel, owner control center, and future AI governance.

**This is a design artifact only.** No schema files, migrations, or database commands have been executed.

---

## 2. Current State

| Item | Status |
|------|--------|
| Database | Does not exist |
| Schema | Not created |
| Migrations | Not created |
| ORM | Not installed (Prisma planned) |
| Backend | Does not exist |
| Auth | Not implemented |
| Payment | Not implemented |
| Frontend | Frozen (17 routes, mock data) |

---

## 3. Database Design Principles

1. **PostgreSQL** as primary database
2. **Prisma** as ORM (schema-first approach)
3. **UUID primary keys** for all core entities (non-sequential, safer for multi-vendor)
4. **Timestamps** (`createdAt`, `updatedAt`) on all core tables
5. **Soft delete** (`deletedAt`) where appropriate (users, vendors, products)
6. **Audit logs** for all sensitive actions (financial, role changes, destructive ops)
7. **Money stored as Decimal(19,4)** or integer minor units — never floating point
8. **Currency code** stored alongside monetary values (ISO 4217)
9. **Multi-vendor isolation** enforced at query level (vendorId filter on all vendor data)
10. **Owner/admin financial safety** — read-only access to revenue for admins, write access only for owner
11. **B2B and B2C separation** where domain logic differs (RFQ vs direct order)
12. **No payment/settlement implementation** until approved Phase 9+
13. **No fake revenue** — all financial data must come from real transactions
14. **Idempotency** on payment operations (idempotency keys)
15. **Immutable financial records** — no direct deletes on payments, settlements, ledger entries

---

## 4. Domain Model Overview

```
Identity + Access
├── User
├── UserRole (RBAC mapping)
├── StaffRole (admin/owner/support boundary)

Vendor/Seller
├── Vendor
├── VendorUser (user-vendor membership)
├── VendorProfile (storefront info)
├── VendorVerification

Catalog
├── Category (self-referencing tree)
├── Product
├── ProductImage
├── ProductVariant
├── ProductAttribute
├── VendorProductListing (seller offers)
├── Inventory (placeholder/future)

B2C Commerce
├── Cart / CartItem
├── Order / OrderItem
├── OrderStatusHistory
├── Address
├── Shipment (placeholder/future)

B2B Wholesale
├── WholesaleBuyerProfile
├── BusinessAccountApproval
├── RFQ / RFQItem / RFQQuote
├── BulkPricingRule (placeholder)

Payments + Financial
├── Payment
├── Refund
├── CommissionRule
├── VendorSettlement
├── LedgerEntry
├── FinancialAuditLog

Admin + Owner
├── AdminActionLog
├── OwnerMetricSnapshot
├── PlatformSetting
├── RiskFlag

Notifications + Support
├── Notification
├── SupportTicket
├── SupportMessage

Future AI Governance
├── AiAssistantLog
├── AiRecommendation
├── AiActionProposal
├── AiApprovalGate
```

---

## 5. Entity-by-Entity Design

### 5.1 Identity + Access

#### User
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| email | VARCHAR(255) | UNIQUE, NOT NULL |
| name | VARCHAR(255) | NOT NULL |
| passwordHash | VARCHAR(255) | nullable (OAuth users) |
| phone | VARCHAR(50) | nullable |
| avatar | TEXT | nullable |
| status | UserStatus | enum: ACTIVE, INACTIVE, SUSPENDED |
| emailVerified | BOOLEAN | default false |
| createdAt | TIMESTAMP | NOT NULL |
| updatedAt | TIMESTAMP | NOT NULL |
| deletedAt | TIMESTAMP | nullable (soft delete) |

#### UserRole
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| userId | UUID | FK → User |
| role | RoleType | enum: CUSTOMER, WHOLESALE_BUYER, VENDOR_USER, VENDOR_ADMIN, PLATFORM_ADMIN, OWNER, SUPPORT |
| createdAt | TIMESTAMP | NOT NULL |

**Constraint:** One user can have multiple roles. Role changes logged in AuditLog.

#### StaffRole (Admin/Owner boundary)
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| userId | UUID | FK → User |
| staffRole | StaffRoleType | enum: PLATFORM_ADMIN, OWNER, SUPPORT |
| permissions | JSONB | granular permissions (future) |
| createdAt | TIMESTAMP | NOT NULL |

---

### 5.2 Vendor/Seller

#### Vendor
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| name | VARCHAR(255) | NOT NULL |
| slug | VARCHAR(255) | UNIQUE, NOT NULL |
| description | TEXT | nullable |
| logo | TEXT | nullable |
| status | VendorStatus | enum: PENDING, ACTIVE, SUSPENDED, BANNED |
| verified | BOOLEAN | default false |
| ownerId | UUID | FK → User (vendor owner) |
| createdAt | TIMESTAMP | NOT NULL |
| updatedAt | TIMESTAMP | NOT NULL |
| deletedAt | TIMESTAMP | nullable |

#### VendorUser
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| vendorId | UUID | FK → Vendor |
| userId | UUID | FK → User |
| role | VendorUserRole | enum: OWNER, ADMIN, STAFF |
| createdAt | TIMESTAMP | NOT NULL |

**Constraint:** Vendor users can only access their own vendor data.

#### VendorProfile
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| vendorId | UUID | FK → Vendor, UNIQUE |
| location | VARCHAR(255) | nullable |
| responseRate | VARCHAR(50) | nullable |
| deliveryNote | TEXT | nullable |
| returnPolicy | TEXT | nullable |
| supportNote | TEXT | nullable |
| joinedLabel | VARCHAR(100) | nullable |
| storeMetrics | JSONB | nullable (computed, not source of truth) |
| createdAt | TIMESTAMP | NOT NULL |
| updatedAt | TIMESTAMP | NOT NULL |

#### VendorVerification
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| vendorId | UUID | FK → Vendor |
| documentType | VARCHAR(50) | CAC, TAX_CERT, etc. |
| documentUrl | TEXT | NOT NULL |
| status | VerificationStatus | enum: PENDING, APPROVED, REJECTED |
| reviewedBy | UUID | FK → User (admin) |
| reviewedAt | TIMESTAMP | nullable |
| createdAt | TIMESTAMP | NOT NULL |

---

### 5.3 Catalog

#### Category
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| name | VARCHAR(255) | NOT NULL |
| slug | VARCHAR(255) | UNIQUE, NOT NULL |
| icon | VARCHAR(50) | nullable |
| parentId | UUID | FK → Category (self-referencing, nullable) |
| sortOrder | INTEGER | default 0 |
| createdAt | TIMESTAMP | NOT NULL |
| updatedAt | TIMESTAMP | NOT NULL |

#### Product
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| name | VARCHAR(255) | NOT NULL |
| slug | VARCHAR(255) | UNIQUE, NOT NULL |
| description | TEXT | nullable |
| categoryId | UUID | FK → Category |
| vendorId | UUID | FK → Vendor |
| basePrice | DECIMAL(19,4) | NOT NULL (in minor units concept) |
| currency | VARCHAR(3) | default 'NGN' |
| status | ProductStatus | enum: DRAFT, ACTIVE, ARCHIVED, SUSPENDED |
| inStock | BOOLEAN | default true |
| stockLabel | VARCHAR(100) | nullable |
| deliveryNote | TEXT | nullable |
| returnNote | TEXT | nullable |
| createdAt | TIMESTAMP | NOT NULL |
| updatedAt | TIMESTAMP | NOT NULL |
| deletedAt | TIMESTAMP | nullable |

**Constraint:** Product belongs to one vendor. Vendor can only manage own products.

#### ProductImage
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| productId | UUID | FK → Product |
| url | TEXT | NOT NULL |
| alt | VARCHAR(255) | nullable |
| sortOrder | INTEGER | default 0 |
| createdAt | TIMESTAMP | NOT NULL |

#### ProductVariant
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| productId | UUID | FK → Product |
| name | VARCHAR(255) | NOT NULL (e.g., "Size: XL, Color: Red") |
| sku | VARCHAR(100) | nullable |
| price | DECIMAL(19,4) | NOT NULL |
| currency | VARCHAR(3) | default 'NGN' |
| stock | INTEGER | default 0 |
| status | InventoryStatus | enum: IN_STOCK, LOW_STOCK, OUT_OF_STOCK |
| createdAt | TIMESTAMP | NOT NULL |
| updatedAt | TIMESTAMP | NOT NULL |

#### ProductAttribute
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| productId | UUID | FK → Product |
| label | VARCHAR(255) | NOT NULL |
| value | VARCHAR(255) | NOT NULL |
| sortOrder | INTEGER | default 0 |

#### VendorProductListing (Seller Offer)
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| vendorId | UUID | FK → Vendor |
| productId | UUID | FK → Product |
| offerPrice | DECIMAL(19,4) | NOT NULL |
| currency | VARCHAR(3) | default 'NGN' |
| stock | INTEGER | default 0 |
| status | ListingStatus | enum: ACTIVE, PAUSED, ENDED |
| createdAt | TIMESTAMP | NOT NULL |
| updatedAt | TIMESTAMP | NOT NULL |

**Purpose:** Allows multiple vendors to offer the same product at different prices.

---

### 5.4 B2C Commerce

#### Cart
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| userId | UUID | FK → User (nullable for guest carts) |
| sessionId | VARCHAR(255) | nullable (guest cart identifier) |
| status | CartStatus | enum: ACTIVE, CHECKOUT, ABANDONED, CONVERTED |
| createdAt | TIMESTAMP | NOT NULL |
| updatedAt | TIMESTAMP | NOT NULL |

#### CartItem
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| cartId | UUID | FK → Cart |
| productId | UUID | FK → Product |
| variantId | UUID | FK → ProductVariant (nullable) |
| vendorId | UUID | FK → Vendor (denormalized for isolation) |
| quantity | INTEGER | NOT NULL, min 1 |
| unitPrice | DECIMAL(19,4) | NOT NULL (locked at add time) |
| currency | VARCHAR(3) | default 'NGN' |
| createdAt | TIMESTAMP | NOT NULL |
| updatedAt | TIMESTAMP | NOT NULL |

#### Order
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| orderNumber | VARCHAR(50) | UNIQUE, NOT NULL (human-readable) |
| userId | UUID | FK → User |
| status | OrderStatus | enum: PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED, REFUNDED |
| subtotal | DECIMAL(19,4) | NOT NULL |
| shippingCost | DECIMAL(19,4) | default 0 |
| total | DECIMAL(19,4) | NOT NULL |
| currency | VARCHAR(3) | default 'NGN' |
| shippingAddressId | UUID | FK → Address |
| notes | TEXT | nullable |
| createdAt | TIMESTAMP | NOT NULL |
| updatedAt | TIMESTAMP | NOT NULL |

#### OrderItem
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| orderId | UUID | FK → Order |
| productId | UUID | FK → Product |
| variantId | UUID | FK → ProductVariant (nullable) |
| vendorId | UUID | FK → Vendor |
| productName | VARCHAR(255) | NOT NULL (snapshot) |
| quantity | INTEGER | NOT NULL |
| unitPrice | DECIMAL(19,4) | NOT NULL (snapshot at order time) |
| total | DECIMAL(19,4) | NOT NULL |
| currency | VARCHAR(3) | default 'NGN' |

#### OrderStatusHistory
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| orderId | UUID | FK → Order |
| status | OrderStatus | NOT NULL |
| note | TEXT | nullable |
| changedBy | UUID | FK → User |
| createdAt | TIMESTAMP | NOT NULL |

#### Address
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| userId | UUID | FK → User |
| label | VARCHAR(50) | HOME, WORK, etc. |
| street | TEXT | NOT NULL |
| city | VARCHAR(255) | NOT NULL |
| state | VARCHAR(255) | NOT NULL |
| country | VARCHAR(100) | default 'Nigeria' |
| postalCode | VARCHAR(20) | nullable |
| phone | VARCHAR(50) | nullable |
| isDefault | BOOLEAN | default false |
| createdAt | TIMESTAMP | NOT NULL |
| updatedAt | TIMESTAMP | NOT NULL |

---

### 5.5 B2B Wholesale

#### WholesaleBuyerProfile
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| userId | UUID | FK → User, UNIQUE |
| companyName | VARCHAR(255) | NOT NULL |
| businessType | VARCHAR(100) | nullable |
| cacNumber | VARCHAR(100) | nullable (business registration) |
| taxId | VARCHAR(100) | nullable |
| status | ApprovalStatus | enum: PENDING, APPROVED, REJECTED |
| approvedBy | UUID | FK → User (admin) |
| approvedAt | TIMESTAMP | nullable |
| createdAt | TIMESTAMP | NOT NULL |
| updatedAt | TIMESTAMP | NOT NULL |

#### RFQ (Request for Quote)
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| buyerId | UUID | FK → User |
| vendorId | UUID | FK → Vendor |
| status | RFQStatus | enum: DRAFT, SUBMITTED, QUOTED, ACCEPTED, REJECTED, EXPIRED |
| notes | TEXT | nullable |
| createdAt | TIMESTAMP | NOT NULL |
| updatedAt | TIMESTAMP | NOT NULL |

#### RFQItem
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| rfqId | UUID | FK → RFQ |
| productName | VARCHAR(255) | NOT NULL |
| quantity | INTEGER | NOT NULL |
| specifications | TEXT | nullable |
| unitPrice | DECIMAL(19,4) | nullable (filled by vendor quote) |

#### RFQQuote
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| rfqId | UUID | FK → RFQ |
| vendorId | UUID | FK → Vendor |
| totalQuote | DECIMAL(19,4) | NOT NULL |
| currency | VARCHAR(3) | default 'NGN' |
| validUntil | TIMESTAMP | NOT NULL |
| notes | TEXT | nullable |
| status | QuoteStatus | enum: PENDING, ACCEPTED, REJECTED |
| createdAt | TIMESTAMP | NOT NULL |

#### BulkPricingRule (Placeholder)
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| productId | UUID | FK → Product |
| minQuantity | INTEGER | NOT NULL |
| maxQuantity | INTEGER | nullable |
| unitPrice | DECIMAL(19,4) | NOT NULL |
| currency | VARCHAR(3) | default 'NGN' |
| createdAt | TIMESTAMP | NOT NULL |

---

### 5.6 Payments + Financial Safety

#### Payment
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| orderId | UUID | FK → Order |
| provider | VARCHAR(50) | PAYSTACK, FLUTTERWAVE, etc. |
| providerRef | VARCHAR(255) | external reference |
| amount | DECIMAL(19,4) | NOT NULL |
| currency | VARCHAR(3) | NOT NULL |
| status | PaymentStatus | enum: PENDING, SUCCESS, FAILED, REFUNDED |
| idempotencyKey | VARCHAR(255) | UNIQUE (prevents duplicate charges) |
| metadata | JSONB | nullable |
| createdAt | TIMESTAMP | NOT NULL |
| updatedAt | TIMESTAMP | NOT NULL |

**Immutable:** No direct deletes. Refunds recorded separately.

#### Refund
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| paymentId | UUID | FK → Payment |
| amount | DECIMAL(19,4) | NOT NULL |
| reason | TEXT | NOT NULL |
| status | RefundStatus | enum: PENDING, APPROVED, REJECTED, PROCESSED |
| approvedBy | UUID | FK → User (owner only) |
| approvedAt | TIMESTAMP | nullable |
| createdAt | TIMESTAMP | NOT NULL |

#### CommissionRule
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| vendorId | UUID | FK → Vendor |
| category | VARCHAR(100) | nullable (category-specific commission) |
| rate | DECIMAL(5,4) | NOT NULL (e.g., 0.1000 = 10%) |
| effectiveFrom | TIMESTAMP | NOT NULL |
| effectiveTo | TIMESTAMP | nullable |
| createdAt | TIMESTAMP | NOT NULL |
| updatedAt | TIMESTAMP | NOT NULL |

#### VendorSettlement
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| vendorId | UUID | FK → Vendor |
| period | VARCHAR(20) | e.g., "2026-W36" |
| grossSales | DECIMAL(19,4) | NOT NULL |
| commission | DECIMAL(19,4) | NOT NULL |
| netPayout | DECIMAL(19,4) | NOT NULL |
| currency | VARCHAR(3) | default 'NGN' |
| status | SettlementStatus | enum: PENDING, APPROVED, PAID, DISPUTED |
| approvedBy | UUID | FK → User (owner only) |
| approvedAt | TIMESTAMP | nullable |
| paidAt | TIMESTAMP | nullable |
| createdAt | TIMESTAMP | NOT NULL |

#### LedgerEntry
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| accountType | VARCHAR(50) | VENDOR, PLATFORM, COMMISSION |
| referenceType | VARCHAR(50) | ORDER, PAYMENT, REFUND, SETTLEMENT |
| referenceId | UUID | FK to respective table |
| debit | DECIMAL(19,4) | default 0 |
| credit | DECIMAL(19,4) | default 0 |
| currency | VARCHAR(3) | NOT NULL |
| description | TEXT | nullable |
| createdAt | TIMESTAMP | NOT NULL |

**Immutable:** No deletes. Balanced entries enforced.

#### FinancialAuditLog
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| entityType | VARCHAR(50) | PAYMENT, REFUND, SETTLEMENT, COMMISSION |
| entityId | UUID | NOT NULL |
| action | VARCHAR(50) | CREATED, UPDATED, APPROVED, REJECTED |
| performedBy | UUID | FK → User |
| oldValues | JSONB | nullable |
| newValues | JSONB | nullable |
| createdAt | TIMESTAMP | NOT NULL |

---

### 5.7 Admin + Owner Control

#### AdminActionLog
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| adminId | UUID | FK → User |
| action | VARCHAR(100) | NOT NULL |
| entityType | VARCHAR(50) | NOT NULL |
| entityId | UUID | NOT NULL |
| details | JSONB | nullable |
| createdAt | TIMESTAMP | NOT NULL |

#### OwnerMetricSnapshot
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| snapshotDate | DATE | NOT NULL |
| totalVendors | INTEGER | NOT NULL |
| activeVendors | INTEGER | NOT NULL |
| totalProducts | INTEGER | NOT NULL |
| totalOrders | INTEGER | NOT NULL |
| totalRevenue | DECIMAL(19,4) | NOT NULL |
| totalCommissions | DECIMAL(19,4) | NOT NULL |
| currency | VARCHAR(3) | default 'NGN' |
| createdAt | TIMESTAMP | NOT NULL |

#### PlatformSetting
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| key | VARCHAR(255) | UNIQUE, NOT NULL |
| value | JSONB | NOT NULL |
| description | TEXT | nullable |
| updatedBy | UUID | FK → User (owner only) |
| updatedAt | TIMESTAMP | NOT NULL |

#### RiskFlag
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| entityType | VARCHAR(50) | USER, VENDOR, ORDER, PAYMENT |
| entityId | UUID | NOT NULL |
| reason | TEXT | NOT NULL |
| severity | RiskSeverity | enum: LOW, MEDIUM, HIGH, CRITICAL |
| status | FlagStatus | enum: OPEN, REVIEWED, RESOLVED, DISMISSED |
| flaggedBy | UUID | FK → User or SYSTEM |
| resolvedBy | UUID | FK → User (nullable) |
| createdAt | TIMESTAMP | NOT NULL |
| resolvedAt | TIMESTAMP | nullable |

---

### 5.8 Notifications + Support

#### Notification
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| userId | UUID | FK → User |
| type | VARCHAR(50) | ORDER, PAYMENT, SYSTEM, PROMOTIONAL |
| title | VARCHAR(255) | NOT NULL |
| body | TEXT | nullable |
| read | BOOLEAN | default false |
| metadata | JSONB | nullable |
| createdAt | TIMESTAMP | NOT NULL |

#### SupportTicket
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| userId | UUID | FK → User |
| orderId | UUID | FK → Order (nullable) |
| subject | VARCHAR(255) | NOT NULL |
| status | TicketStatus | enum: OPEN, IN_PROGRESS, WAITING_CUSTOMER, RESOLVED, CLOSED |
| priority | Priority | enum: LOW, MEDIUM, HIGH, URGENT |
| assignedTo | UUID | FK → User (support staff, nullable) |
| createdAt | TIMESTAMP | NOT NULL |
| updatedAt | TIMESTAMP | NOT NULL |

#### SupportMessage
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| ticketId | UUID | FK → SupportTicket |
| senderId | UUID | FK → User |
| message | TEXT | NOT NULL |
| attachment | TEXT | nullable (URL) |
| createdAt | TIMESTAMP | NOT NULL |

---

### 5.9 Future AI Governance

#### AiAssistantLog
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| userId | UUID | FK → User |
| sessionId | VARCHAR(255) | NOT NULL |
| role | VARCHAR(50) | SYSTEM, USER |
| content | TEXT | NOT NULL |
| tokenCount | INTEGER | nullable |
| createdAt | TIMESTAMP | NOT NULL |

#### AiRecommendation
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| userId | UUID | FK → User (nullable for anonymous) |
| entityType | VARCHAR(50) | PRODUCT, VENDOR, CATEGORY |
| entityId | UUID | NOT NULL |
| score | DECIMAL(5,4) | NOT NULL (0-1) |
| reason | TEXT | nullable |
| createdAt | TIMESTAMP | NOT NULL |

#### AiActionProposal
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| actionType | VARCHAR(50) | PRICE_ADJUSTMENT, PRODUCT_RECOMMENDATION, FRAUD_FLAG |
| entityType | VARCHAR(50) | NOT NULL |
| entityId | UUID | NOT NULL |
| proposedBy | VARCHAR(50) | AI_SYSTEM |
| proposal | JSONB | NOT NULL |
| status | AiProposalStatus | enum: PROPOSED, APPROVED, REJECTED, EXPIRED |
| approvedBy | UUID | FK → User (nullable, owner required for financial) |
| createdAt | TIMESTAMP | NOT NULL |
| resolvedAt | TIMESTAMP | nullable |

#### AiApprovalGate
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| proposalId | UUID | FK → AiActionProposal |
| gateType | VARCHAR(50) | FINANCIAL, LEGAL, TAX, VENDOR_PENALTY, CUSTOMER_PENALTY |
| requiredApprover | VARCHAR(50) | OWNER, PLATFORM_ADMIN |
| status | GateStatus | enum: PENDING, APPROVED, REJECTED |
| approvedBy | UUID | FK → User (nullable) |
| createdAt | TIMESTAMP | NOT NULL |
| resolvedAt | TIMESTAMP | nullable |

**Rule:** AI cannot directly approve payments, refunds, settlements, destructive actions, legal/tax decisions, or vendor/customer penalties.

---

## 6. Key Relationships

| Relationship | Type | Notes |
|-------------|------|-------|
| User → UserRole | 1:N | One user has multiple roles |
| User → VendorUser | 1:N | One user can belong to multiple vendors |
| Vendor → VendorUser | 1:N | One vendor has multiple users |
| Vendor → Product | 1:N | One vendor owns many products |
| Category → Product | 1:N | One category has many products |
| Category → Category | 1:N | Self-referencing tree (parent/child) |
| Product → ProductVariant | 1:N | One product has many variants |
| Product → ProductImage | 1:N | One product has many images |
| Product → ProductAttribute | 1:N | One product has many attributes |
| Cart → CartItem | 1:N | One cart has many items |
| Order → OrderItem | 1:N | One order has many items |
| Order → OrderStatusHistory | 1:N | Status change audit trail |
| Order → Payment | 1:1 | One order has one payment |
| Payment → Refund | 1:N | One payment can have multiple refunds |
| Vendor → VendorSettlement | 1:N | One vendor has many settlements |
| User → Address | 1:N | One user has many addresses |
| User → RFQ | 1:N | One buyer has many RFQs |
| RFQ → RFQItem | 1:N | One RFQ has many items |
| RFQ → RFQQuote | 1:N | One RFQ can have many quotes |
| AiActionProposal → AiApprovalGate | 1:1 | Each proposal goes through gate |

---

## 7. Conceptual Status Enums

| Enum | Values |
|------|--------|
| UserStatus | ACTIVE, INACTIVE, SUSPENDED |
| RoleType | CUSTOMER, WHOLESALE_BUYER, VENDOR_USER, VENDOR_ADMIN, PLATFORM_ADMIN, OWNER, SUPPORT |
| StaffRoleType | PLATFORM_ADMIN, OWNER, SUPPORT |
| VendorStatus | PENDING, ACTIVE, SUSPENDED, BANNED |
| VendorUserRole | OWNER, ADMIN, STAFF |
| VerificationStatus | PENDING, APPROVED, REJECTED |
| ProductStatus | DRAFT, ACTIVE, ARCHIVED, SUSPENDED |
| ListingStatus | ACTIVE, PAUSED, ENDED |
| InventoryStatus | IN_STOCK, LOW_STOCK, OUT_OF_STOCK |
| CartStatus | ACTIVE, CHECKOUT, ABANDONED, CONVERTED |
| OrderStatus | PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED, REFUNDED |
| PaymentStatus | PENDING, SUCCESS, FAILED, REFUNDED |
| RefundStatus | PENDING, APPROVED, REJECTED, PROCESSED |
| SettlementStatus | PENDING, APPROVED, PAID, DISPUTED |
| RFQStatus | DRAFT, SUBMITTED, QUOTED, ACCEPTED, REJECTED, EXPIRED |
| QuoteStatus | PENDING, ACCEPTED, REJECTED |
| ApprovalStatus | PENDING, APPROVED, REJECTED |
| TicketStatus | OPEN, IN_PROGRESS, WAITING_CUSTOMER, RESOLVED, CLOSED |
| Priority | LOW, MEDIUM, HIGH, URGENT |
| RiskSeverity | LOW, MEDIUM, HIGH, CRITICAL |
| FlagStatus | OPEN, REVIEWED, RESOLVED, DISMISSED |
| AiProposalStatus | PROPOSED, APPROVED, REJECTED, EXPIRED |
| GateStatus | PENDING, APPROVED, REJECTED |

---

## 8. Money + Financial Safety Design

1. **All monetary values** stored as `DECIMAL(19,4)` — no floating point
2. **Currency code** (ISO 4217) stored alongside every monetary column
3. **No revenue computation** from placeholder/mock data
4. **Commission/settlement** uses ledger-backed double-entry design
5. **Refund/payment/settlement** requires audit log entry
6. **Owner approval gate** for all sensitive financial actions (settlements, refunds > threshold)
7. **Payment provider integration** deferred to Phase 9+
8. **No direct deletes** on Payment, Refund, LedgerEntry, Settlement tables
9. **Idempotency keys** on payment operations to prevent duplicate charges
10. **Snapshot pricing** on OrderItem (unitPrice locked at order creation time)

---

## 9. Multi-Vendor Safety Design

1. **Vendor data isolation** — all vendor queries filtered by `vendorId`
2. **Vendor users limited** to assigned vendor(s) via VendorUser table
3. **Admin access** logged in AdminActionLog for cross-vendor actions
4. **Owner access** required for financial operations across vendors
5. **Product ownership** — product.vendorId enforced at API level
6. **Order visibility** — vendor sees only their OrderItems, not full customer data
7. **Settlement visibility** — vendor sees only own settlements
8. **Audit logs** for all cross-vendor admin actions

---

## 10. B2B Safety Design

1. **Wholesale buyer approval** required before RFQ submission (WholesaleBuyerProfile.status)
2. **RFQ workflow** has clear status progression (DRAFT → SUBMITTED → QUOTED → ACCEPTED/REJECTED)
3. **Quote acceptance** deferred until cart/order/payment foundations are real
4. **Bulk pricing rules** are design-only, not enforced until Phase 4+
5. **No automatic approval** without owner/admin policy review
6. **B2B orders** route through same Order/Payment flow as B2C (reuse infrastructure)

---

## 11. AI Governance Data Design

1. **AiAssistantLog** — records all AI conversations for audit
2. **AiRecommendation** — scored recommendations with reason tracking
3. **AiActionProposal** — AI proposes actions, never executes directly
4. **AiApprovalGate** — mandatory approval gate for sensitive AI proposals
5. **Rules enforced:**
   - AI cannot approve payments/refunds/settlements
   - AI cannot make legal/tax decisions
   - AI cannot penalize vendors/customers
   - All AI actions logged and auditable
   - Owner override required for financial AI proposals

---

## 12. Migration + Seed Policy

| Rule | Description |
|------|-------------|
| No migrations without PM/Owner approval | Every migration requires explicit task authorization |
| No destructive resets without written approval | `prisma migrate reset` requires PM + Owner sign-off |
| Dev seed from current mock data | Seed script replicates `marketplaceMockData.ts` structure |
| Staging/prod seeds restricted | No seed scripts in staging/prod without approval |
| Migration rollback plan required | Every migration must have documented rollback |
| Backups required before production | Automated backups before any production migration |
| Never run init/reset/seed without authorization | Scripts guarded by task authorization |

---

## 13. Deferred Items

| Item | Deferred To | Reason |
|------|------------|--------|
| Payment provider integration | Phase 9+ | Requires real business decisions |
| Settlement processing | Phase 9+ | Requires ledger design approval |
| Commission calculation engine | Phase 8+ | Requires business rules approval |
| Real inventory management | Phase 4+ | Frontend placeholder sufficient for now |
| AI recommendation engine | Phase 10+ | Requires backend foundation |
| Multi-currency support | Phase 9+ | NGN only for MVP |
| Tax calculation | Phase 9+ | Requires legal/business review |

---

## 14. Owner Approval Gates

| Gate | When | Required |
|------|------|----------|
| Schema design approved | After this document | PM + Owner |
| Migration policy approved | Before P3-007 | PM |
| Seed policy approved | Before P3-007 | PM |
| Payment provider selection | Phase 9 | Owner |
| Commission rate configuration | Phase 9 | Owner |
| Settlement approval workflow | Phase 9 | Owner |

---

## 15. Explicit "No Schema/Migrations Created" Note

**This document is a design artifact only.**

- No Prisma schema file has been created
- No migrations have been generated or run
- No database has been provisioned
- No seed scripts have been executed
- No database commands have been run

**All database implementation requires PM approval via the governed task sequence.**
